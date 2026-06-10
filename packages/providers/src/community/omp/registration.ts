import { isRegisteredProvider, registerProvider } from '../../registry';

import { OMP_CAPABILITIES } from './capabilities';
import { OmpProvider } from './provider';

/**
 * Register the omp (oh-my-pi) community provider.
 *
 * Idempotent — safe to call multiple times, so process entrypoints (CLI,
 * server, config-loader) can each call it without coordination. Kept separate
 * from `registerBuiltinProviders()` because `builtIn: false` is load-bearing:
 * omp is a community provider that drives the `omp` CLI over its RPC protocol
 * and must not be conflated with core providers.
 */
export function registerOmpProvider(): void {
  if (isRegisteredProvider('omp')) return;
  registerProvider({
    id: 'omp',
    displayName: 'omp (oh-my-pi)',
    factory: () => new OmpProvider(),
    capabilities: OMP_CAPABILITIES,
    builtIn: false,
  });
}
