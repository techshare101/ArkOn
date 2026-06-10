import { describe, test, expect } from 'bun:test';

import { parseOmpModelRef } from './model-ref';

describe('parseOmpModelRef', () => {
  test('parses a simple provider/model ref', () => {
    expect(parseOmpModelRef('minimax/MiniMax-M2')).toEqual({
      provider: 'minimax',
      modelId: 'MiniMax-M2',
    });
  });

  test('splits on the FIRST slash so namespaced model ids survive', () => {
    expect(parseOmpModelRef('openrouter/qwen/qwen3-coder')).toEqual({
      provider: 'openrouter',
      modelId: 'qwen/qwen3-coder',
    });
  });

  test('accepts hyphenated provider ids', () => {
    expect(parseOmpModelRef('minimax-cn/abab6.5')).toEqual({
      provider: 'minimax-cn',
      modelId: 'abab6.5',
    });
  });

  test('returns undefined when there is no slash', () => {
    expect(parseOmpModelRef('minimax')).toBeUndefined();
  });

  test('returns undefined when the ref starts with a slash (empty provider)', () => {
    expect(parseOmpModelRef('/MiniMax-M2')).toBeUndefined();
  });

  test('returns undefined when the ref ends with a slash (empty model id)', () => {
    expect(parseOmpModelRef('minimax/')).toBeUndefined();
  });

  test('returns undefined when the provider has invalid characters', () => {
    // Uppercase / leading digit / underscores are not valid provider ids.
    expect(parseOmpModelRef('MiniMax/M2')).toBeUndefined();
    expect(parseOmpModelRef('1minimax/M2')).toBeUndefined();
    expect(parseOmpModelRef('mini_max/M2')).toBeUndefined();
  });

  test('returns undefined for an empty string', () => {
    expect(parseOmpModelRef('')).toBeUndefined();
  });
});
