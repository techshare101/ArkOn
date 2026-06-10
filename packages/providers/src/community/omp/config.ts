/**
 * Typed config parsing for the omp (oh-my-pi) provider defaults.
 * Validates and narrows the opaque assistantConfig to typed fields.
 *
 * Mirrors `parseCodexConfig` — defensive, silently drops invalid fields.
 */
import type { OmpProviderDefaults } from '../../types';

// Re-export so consumers can import the type from either location
export type { OmpProviderDefaults } from '../../types';

/**
 * Parse raw assistantConfig into typed omp defaults.
 * Defensive: invalid fields are silently dropped (KISS — no throwing on
 * malformed user config; the provider falls back to omp's own defaults).
 */
export function parseOmpConfig(raw: Record<string, unknown>): OmpProviderDefaults {
  const result: OmpProviderDefaults = {};

  if (typeof raw.model === 'string') {
    result.model = raw.model;
  }

  if (typeof raw.ompBinaryPath === 'string') {
    result.ompBinaryPath = raw.ompBinaryPath;
  }

  return result;
}
