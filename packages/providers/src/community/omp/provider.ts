/**
 * omp (oh-my-pi) agent provider.
 *
 * Drives the `omp` CLI in RPC mode (`omp --mode rpc`) as a subprocess and
 * implements Archon's IAgentProvider. Modeled on the codex CLI-subprocess
 * provider's spawn / stream / abort patterns.
 *
 * WHY RPC (not an SDK clone): omp's bundled SDK diverged heavily from upstream
 * Pi, but its RPC protocol is a stable, typed contract (NDJSON frames on
 * stdin/stdout). We speak that protocol directly.
 *
 * WHY LOCAL FRAME TYPES (not `import type` from omp): omp does not export its
 * rpc-types on a clean public subpath — `rpc-types.ts` lives under
 * `src/modes/rpc/` and transitively imports many internal types
 * (AgentMessage, CompactionResult, SessionStats, …). Deep-importing internal
 * paths is brittle and against AGENTS.md. We instead declare a MINIMAL local
 * copy of only the frames this provider reads/writes. The authoritative source
 * is `@oh-my-pi/pi-coding-agent/src/modes/rpc/rpc-types.ts` +
 * `@oh-my-pi/pi-agent-core` AgentEvent; keep this in sync if omp's protocol
 * changes (the dependency is pinned to a fixed version for exactly this reason).
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import type {
  IAgentProvider,
  SendQueryOptions,
  MessageChunk,
  ProviderCapabilities,
  TokenUsage,
  SystemPromptInput,
} from '../../types';
import { createLogger } from '@archon/paths';
import { OMP_CAPABILITIES } from './capabilities';
import { parseOmpConfig } from './config';
import { parseOmpModelRef } from './model-ref';

/** Lazy-initialized logger (deferred so test mocks can intercept createLogger) */
let cachedLog: ReturnType<typeof createLogger> | undefined;
function getLog(): ReturnType<typeof createLogger> {
  if (!cachedLog) cachedLog = createLogger('provider.omp');
  return cachedLog;
}

// ─── Minimal local copy of omp RPC frame types ───────────────────────────────
// See file header for why these are hand-written rather than imported.

/** stdin commands we send (subset of omp's RpcCommand). */
type OmpCommand =
  | { id?: string; type: 'prompt'; message: string }
  | { id?: string; type: 'abort' }
  | { id?: string; type: 'set_model'; provider: string; modelId: string };

/** The readiness signal omp emits on stdout before accepting commands. */
interface OmpReadyFrame {
  type: 'ready';
}

/** Response ack/error frame (omp's RpcResponse, success branch collapsed). */
interface OmpResponseFrame {
  type: 'response';
  command: string;
  success: boolean;
  id?: string;
  error?: string;
  data?: unknown;
}

/** pi-ai Usage subset we read off completed assistant messages. */
interface OmpUsage {
  input?: number;
  output?: number;
  totalTokens?: number;
  cost?: { total?: number };
}

/** AgentEvent subset (see @oh-my-pi/pi-agent-core AgentEvent). */
interface OmpAgentEventBase {
  type: string;
}

interface OmpMessageUpdateEvent extends OmpAgentEventBase {
  type: 'message_update';
  assistantMessageEvent: { type: string; delta?: string };
}

interface OmpMessageEndEvent extends OmpAgentEventBase {
  type: 'message_end';
  message: { role?: string; usage?: OmpUsage };
}

interface OmpToolStartEvent extends OmpAgentEventBase {
  type: 'tool_execution_start';
  toolCallId: string;
  toolName: string;
  args: unknown;
}

interface OmpToolEndEvent extends OmpAgentEventBase {
  type: 'tool_execution_end';
  toolCallId: string;
  toolName: string;
  result: unknown;
  isError?: boolean;
}

// ─── Frame parsing helpers ────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseFrame(line: string): Record<string, unknown> | undefined {
  const trimmed = line.trim();
  if (!trimmed) return undefined;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    // Non-JSON stdout noise (should not happen in RPC mode, which routes all
    // human output to stderr). Skip rather than crash the stream.
    getLog().debug({ linePreview: trimmed.slice(0, 120) }, 'omp.non_json_stdout');
    return undefined;
  }
}

function isReadyFrame(f: Record<string, unknown>): f is OmpReadyFrame & Record<string, unknown> {
  return f.type === 'ready';
}

function isResponseFrame(
  f: Record<string, unknown>
): f is OmpResponseFrame & Record<string, unknown> {
  return f.type === 'response' && typeof f.command === 'string' && typeof f.success === 'boolean';
}

/** Extract a plain-text rendering of an omp tool result (AgentToolResult). */
function extractToolOutput(result: unknown): string {
  if (typeof result === 'string') return result;
  if (!isRecord(result)) return '';
  const content = result.content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (isRecord(part) && typeof part.text === 'string') return part.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function addUsage(acc: TokenUsage, usage: OmpUsage): void {
  acc.input += typeof usage.input === 'number' ? usage.input : 0;
  acc.output += typeof usage.output === 'number' ? usage.output : 0;
  if (typeof usage.cost?.total === 'number') {
    acc.cost = (acc.cost ?? 0) + usage.cost.total;
  }
}

// ─── System-prompt flattening ─────────────────────────────────────────────────

/**
 * Flatten Archon's SystemPromptInput into a single string for omp's
 * `--append-system-prompt` CLI flag. This is the channel the Sovereign
 * protocol flows in through. We APPEND (never replace) omp's own system prompt
 * — matching the SDK preset-with-append shape Archon standardized on.
 */
function flattenSystemPrompt(input: SystemPromptInput | undefined): string | undefined {
  if (input === undefined) return undefined;
  if (typeof input === 'string') return input.trim() || undefined;
  if (Array.isArray(input)) {
    const joined = input.join('\n\n').trim();
    return joined || undefined;
  }
  // SystemPromptPreset: only the appended text is portable to omp (omp has its
  // own base prompt; we cannot inject the claude_code preset itself).
  return input.append?.trim() || undefined;
}

// ─── Binary resolution ────────────────────────────────────────────────────────

/**
 * Resolve the omp binary to spawn.
 *
 * Resolution order (KISS — no compiled-binary vendor probing yet; omp is a
 * community provider expected to be on PATH):
 *   1. `OMP_BIN_PATH` env var (parity with codex's CODEX_BIN_PATH)
 *   2. `assistants.omp.ompBinaryPath` config (parity with codexBinaryPath)
 *   3. `omp` on PATH (callers put `$HOME/.bun/bin` on PATH; that's where
 *      `bun add -g @oh-my-pi/pi-coding-agent` installs it)
 */
export function resolveOmpBinary(configOmpBinaryPath?: string): string {
  const envPath = process.env.OMP_BIN_PATH;
  if (envPath?.trim()) return envPath.trim();
  if (configOmpBinaryPath?.trim()) return configOmpBinaryPath.trim();
  return 'omp';
}

// ─── Async chunk queue ────────────────────────────────────────────────────────

/**
 * Single-producer/single-consumer async queue bridging the subprocess's
 * push-based stdout callbacks to the pull-based async generator.
 */
class ChunkQueue {
  private buffer: MessageChunk[] = [];
  private resolveNext: ((value: IteratorResult<MessageChunk>) => void) | null = null;
  private rejectNext: ((err: Error) => void) | null = null;
  private ended = false;
  private failure: Error | null = null;

  push(chunk: MessageChunk): void {
    if (this.ended) return;
    if (this.resolveNext) {
      const resolve = this.resolveNext;
      this.resolveNext = null;
      this.rejectNext = null;
      resolve({ value: chunk, done: false });
    } else {
      this.buffer.push(chunk);
    }
  }

  end(): void {
    if (this.ended) return;
    this.ended = true;
    if (this.resolveNext) {
      const resolve = this.resolveNext;
      this.resolveNext = null;
      this.rejectNext = null;
      resolve({ value: undefined, done: true });
    }
  }

  fail(err: Error): void {
    if (this.ended) return;
    this.failure = err;
    this.ended = true;
    if (this.rejectNext) {
      const reject = this.rejectNext;
      this.resolveNext = null;
      this.rejectNext = null;
      reject(err);
    }
  }

  next(): Promise<IteratorResult<MessageChunk>> {
    const buffered = this.buffer.shift();
    if (buffered !== undefined) {
      return Promise.resolve({ value: buffered, done: false });
    }
    if (this.failure) return Promise.reject(this.failure);
    if (this.ended) return Promise.resolve({ value: undefined, done: true });
    return new Promise<IteratorResult<MessageChunk>>((resolve, reject) => {
      this.resolveNext = resolve;
      this.rejectNext = reject;
    });
  }
}

// ─── omp Provider ──────────────────────────────────────────────────────────────

export class OmpProvider implements IAgentProvider {
  getType(): string {
    return 'omp';
  }

  getCapabilities(): ProviderCapabilities {
    return OMP_CAPABILITIES;
  }

  async *sendQuery(
    prompt: string,
    cwd: string,
    _resumeSessionId?: string,
    requestOptions?: SendQueryOptions
  ): AsyncGenerator<MessageChunk> {
    if (requestOptions?.abortSignal?.aborted) {
      throw new Error('Query aborted');
    }

    const config = parseOmpConfig(requestOptions?.assistantConfig ?? {});
    const binary = resolveOmpBinary(config.ompBinaryPath);
    const modelRef = requestOptions?.model ?? config.model;

    // omp's `--model` flag expects a bare model id and pairs with `--provider`;
    // its set_model RPC command takes {provider, modelId}. We use set_model
    // (sent after `ready`) because it validates against the live catalog and
    // surfaces a clear error frame on a bad ref. Resolve the ref up front so a
    // syntactically-broken model fails before we spawn.
    let parsedModel: { provider: string; modelId: string } | undefined;
    if (modelRef) {
      parsedModel = parseOmpModelRef(modelRef);
      if (!parsedModel) {
        throw new Error(
          `Invalid omp model ref "${modelRef}". Expected "<provider>/<modelId>" ` +
            '(e.g. "minimax/MiniMax-M2"). Configure via assistants.omp.model or a workflow model: field.'
        );
      }
    }

    const appendSystemPrompt = flattenSystemPrompt(
      requestOptions?.systemPrompt ?? requestOptions?.nodeConfig?.systemPrompt
    );

    const args = ['--mode', 'rpc', '--no-session', '--cwd', cwd];
    if (appendSystemPrompt) {
      args.push('--append-system-prompt', appendSystemPrompt);
    }

    // Project-scoped env overrides inherited process env (matches Codex).
    const env: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(process.env).filter((e): e is [string, string] => e[1] !== undefined)
      ),
      ...(requestOptions?.env ?? {}),
    };

    getLog().debug({ binary, cwd, hasModel: Boolean(parsedModel) }, 'omp.spawn');

    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawn(binary, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err) {
      throw new Error(`Failed to spawn omp (${binary}): ${(err as Error).message}`);
    }

    const queue = new ChunkQueue();
    const tokens: TokenUsage = { input: 0, output: 0 };
    let stderrTail = '';
    let readyResolved = false;
    let readyResolve: (() => void) | null = null;
    let readyReject: ((err: Error) => void) | null = null;
    const readyPromise = new Promise<void>((resolve, reject) => {
      readyResolve = resolve;
      readyReject = reject;
    });
    let promptAckSeen = false;

    const writeCommand = (cmd: OmpCommand): void => {
      if (!child.stdin.writable) return;
      child.stdin.write(`${JSON.stringify(cmd)}\n`);
    };

    // ── stdout: line-buffered NDJSON frames ──
    const rl = createInterface({ input: child.stdout });
    rl.on('line', (line: string) => {
      const frame = parseFrame(line);
      if (!frame) return;

      if (isReadyFrame(frame)) {
        if (!readyResolved) {
          readyResolved = true;
          readyResolve?.();
        }
        return;
      }

      if (isResponseFrame(frame)) {
        // PROMPT IS ASYNC: the prompt response is just an ack; assistant output
        // arrives later as agent events. Any success:false response (including
        // a deferred prompt failure emitted by omp's rpc-mode) is fatal.
        if (!frame.success) {
          queue.fail(new Error(`omp ${frame.command} failed: ${frame.error ?? 'unknown error'}`));
          return;
        }
        if (frame.command === 'prompt') promptAckSeen = true;
        return;
      }

      // Agent events.
      const eventType = frame.type;
      switch (eventType) {
        case 'message_update': {
          const evt = frame as unknown as OmpMessageUpdateEvent;
          const inner = evt.assistantMessageEvent;
          if (inner?.type === 'text_delta' && typeof inner.delta === 'string' && inner.delta) {
            queue.push({ type: 'assistant', content: inner.delta });
          } else if (
            inner?.type === 'thinking_delta' &&
            typeof inner.delta === 'string' &&
            inner.delta
          ) {
            queue.push({ type: 'thinking', content: inner.delta });
          }
          break;
        }
        case 'message_end': {
          const evt = frame as unknown as OmpMessageEndEvent;
          if (evt.message?.role === 'assistant' && evt.message.usage) {
            addUsage(tokens, evt.message.usage);
          }
          break;
        }
        case 'tool_execution_start': {
          const evt = frame as unknown as OmpToolStartEvent;
          queue.push({
            type: 'tool',
            toolName: evt.toolName,
            toolCallId: evt.toolCallId,
            ...(isRecord(evt.args) ? { toolInput: evt.args } : {}),
          });
          break;
        }
        case 'tool_execution_end': {
          const evt = frame as unknown as OmpToolEndEvent;
          queue.push({
            type: 'tool_result',
            toolName: evt.toolName,
            toolCallId: evt.toolCallId,
            toolOutput: extractToolOutput(evt.result),
          });
          break;
        }
        case 'agent_end': {
          // End-of-turn. Emit the terminal result chunk and close the stream.
          queue.push({ type: 'result', tokens });
          queue.end();
          break;
        }
        default:
          // agent_start / turn_start / turn_end / message_start /
          // tool_execution_update / extension_ui_request etc. carry no
          // user-facing content for v1 — ignore.
          break;
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      stderrTail = (stderrTail + data.toString()).slice(-2000);
    });

    child.on('error', (err: Error) => {
      const e = new Error(`omp subprocess error: ${err.message}`);
      if (!readyResolved) readyReject?.(e);
      queue.fail(e);
    });

    child.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      getLog().debug({ code, signal }, 'omp.exit');
      // A clean exit after agent_end is benign (queue already ended). A
      // non-zero / signalled exit before the terminal result is fatal.
      if (code !== 0 && code !== null) {
        const e = new Error(`omp exited with code ${code}. ${stderrTail.trim()}`.trim());
        if (!readyResolved) readyReject?.(e);
        queue.fail(e);
      } else {
        if (!readyResolved) {
          readyReject?.(new Error(`omp exited before ready. ${stderrTail.trim()}`.trim()));
        }
        // If the stream never reached agent_end, close it so the consumer is
        // not left hanging. A premature close surfaces as a stream-incomplete
        // result rather than a silent stall.
        queue.end();
      }
    });

    // ── Abort wiring: send abort frame, then kill ──
    const onAbort = (): void => {
      writeCommand({ type: 'abort' });
      child.kill('SIGTERM');
      queue.fail(new Error('Query aborted'));
    };
    if (requestOptions?.abortSignal) {
      requestOptions.abortSignal.addEventListener('abort', onAbort, { once: true });
    }

    try {
      // 1. Wait for omp to be ready (or fail fast on early exit).
      await readyPromise;

      // 2. Select the model via set_model (validated server-side). We do NOT
      //    await a dedicated response here — a failing set_model emits a
      //    success:false response that the stdout handler turns into a queue
      //    failure, which surfaces on the first `next()`.
      if (parsedModel) {
        writeCommand({
          type: 'set_model',
          provider: parsedModel.provider,
          modelId: parsedModel.modelId,
        });
      }

      // 3. Fire the prompt. Output streams as agent events.
      writeCommand({ type: 'prompt', message: prompt });

      // 4. Drain the queue, yielding MessageChunks until end/agent_end/failure.
      while (true) {
        const result = await queue.next();
        if (result.done) break;
        yield result.value;
      }

      if (!promptAckSeen) {
        getLog().warn('omp.prompt_ack_missing');
      }
    } finally {
      if (requestOptions?.abortSignal) {
        requestOptions.abortSignal.removeEventListener('abort', onAbort);
      }
      rl.close();
      if (!child.killed) {
        // stdin EOF tells omp's RPC loop to exit cleanly (see rpc-mode.ts:
        // "stdin closed — RPC client is gone, exit cleanly").
        try {
          child.stdin.end();
        } catch {
          // stdin may already be closed — ignore.
        }
        child.kill('SIGTERM');
      }
    }
  }
}
