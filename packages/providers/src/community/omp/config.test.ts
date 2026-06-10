import { describe, test, expect } from 'bun:test';

import { parseOmpConfig } from './config';

describe('parseOmpConfig', () => {
  test('parses a full valid config', () => {
    expect(
      parseOmpConfig({ model: 'minimax/MiniMax-M2', ompBinaryPath: '/usr/local/bin/omp' })
    ).toEqual({ model: 'minimax/MiniMax-M2', ompBinaryPath: '/usr/local/bin/omp' });
  });

  test('returns an empty object for an empty config', () => {
    expect(parseOmpConfig({})).toEqual({});
  });

  test('drops non-string model silently (KISS, no throw)', () => {
    expect(parseOmpConfig({ model: 123 })).toEqual({});
    expect(parseOmpConfig({ model: null })).toEqual({});
  });

  test('drops non-string ompBinaryPath silently', () => {
    expect(parseOmpConfig({ ompBinaryPath: true })).toEqual({});
  });

  test('keeps valid fields and drops invalid ones in the same config', () => {
    expect(parseOmpConfig({ model: 'minimax/MiniMax-M2', ompBinaryPath: 42 })).toEqual({
      model: 'minimax/MiniMax-M2',
    });
  });

  test('ignores unknown fields', () => {
    expect(parseOmpConfig({ model: 'minimax/MiniMax-M2', somethingElse: 'x' })).toEqual({
      model: 'minimax/MiniMax-M2',
    });
  });
});
