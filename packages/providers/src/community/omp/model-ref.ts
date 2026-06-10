/**
 * Shape of a parsed omp (oh-my-pi) model reference.
 *
 * omp's `set_model` RPC command takes a `{ provider, modelId }` pair (see
 * `RpcCommand` in @oh-my-pi/pi-coding-agent's rpc-types). omp's catalog is
 * large and login-gated, so Archon does syntactic validation only at parse
 * time and defers the existence check to omp's `set_model` handler at query
 * time (it returns `success: false` with "Model not found" when the ref does
 * not match an available model).
 */
export interface OmpModelRef {
  /** omp provider id, e.g. 'minimax', 'anthropic', 'openai', 'google', 'openrouter'. */
  provider: string;
  /** Model id (may itself contain slashes, e.g. 'qwen/qwen3-coder' under openrouter). */
  modelId: string;
}

/**
 * Parse an omp model ref. Splits on the FIRST '/' so namespaced model ids
 * under aggregators like OpenRouter survive:
 *   'openrouter/qwen/qwen3-coder' → { provider: 'openrouter', modelId: 'qwen/qwen3-coder' }
 *   'minimax/MiniMax-M2'          → { provider: 'minimax', modelId: 'MiniMax-M2' }
 *
 * Returns undefined for malformed refs so callers can surface a clear error
 * rather than spawning omp with a model it will reject.
 *
 * Mirrors `parsePiModelRef` — omp's set_model contract is identical to Pi's.
 */
export function parseOmpModelRef(raw: string): OmpModelRef | undefined {
  const idx = raw.indexOf('/');
  if (idx <= 0 || idx === raw.length - 1) return undefined;

  const provider = raw.slice(0, idx);
  const modelId = raw.slice(idx + 1);

  if (!/^[a-z][a-z0-9-]*$/.test(provider)) return undefined;
  if (modelId.length === 0) return undefined;

  return { provider, modelId };
}
