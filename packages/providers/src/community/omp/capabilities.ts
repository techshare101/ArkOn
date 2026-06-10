import type { ProviderCapabilities } from '../../types';

/**
 * omp (oh-my-pi) capabilities — intentionally conservative for v1. Declared
 * flags must reflect wired-up behavior, not potential support; the dag-executor
 * uses these to warn users when a workflow node specifies a feature the
 * provider ignores.
 *
 * Based on CODEX_CAPABILITIES (the closest CLI-subprocess sibling). omp drives
 * the `omp --mode rpc` subprocess and streams assistant `text_delta` events, so
 * streaming text is fully supported.
 *
 * - sessionResume: false — v1 spawns with `--no-session` (ephemeral). RPC has
 *   switch_session/new_session, but Archon does not yet persist or thread an
 *   omp session id through resumeSessionId. TODO: wire session persistence.
 * - mcp: false — omp loads MCP from its own config, not per-node injection.
 * - structuredOutput: false — v1 sends no output schema over RPC and does not
 *   post-parse. TODO: add best-effort prompt-augmentation like Pi if needed.
 * - nativeTools: FALSE for v1 — omp's RPC host-tool bridge (set_host_tools +
 *   host_tool_call/host_tool_result frames) exists and could back NativeTool,
 *   but bridging host tools across the subprocess boundary is out of scope.
 *   TODO(#omp-host-tools): implement the host-tool RPC bridge and flip true.
 */
export const OMP_CAPABILITIES: ProviderCapabilities = {
  sessionResume: false,
  mcp: false,
  hooks: false,
  skills: false,
  agents: false,
  toolRestrictions: false,
  structuredOutput: false,
  envInjection: true,
  costControl: false,
  effortControl: false,
  thinkingControl: false,
  fallbackModel: false,
  sandbox: false,
  nativeTools: false,
};
