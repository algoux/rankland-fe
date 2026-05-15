import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MiniCache } from '@/utils/mini-cache.util';

describe('MiniCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves a value before it expires', () => {
    const cache = new MiniCache();
    cache.set('k1', { v: 1 }, 1000);
    expect(cache.get('k1')).toEqual({ v: 1 });
  });

  it('returns undefined and evicts after expiration', () => {
    const cache = new MiniCache();
    cache.set('k1', 'data', 1000);
    vi.advanceTimersByTime(999);
    expect(cache.get('k1')).toBe('data');
    vi.advanceTimersByTime(2);
    expect(cache.get('k1')).toBeUndefined();
    expect(cache.get('k1')).toBeUndefined();
  });

  it('delete removes the key', () => {
    const cache = new MiniCache();
    cache.set('k1', 'data', 60_000);
    cache.delete('k1');
    expect(cache.get('k1')).toBeUndefined();
  });

  it('purges expired entries when auto purge interval elapses', () => {
    const cache = new MiniCache();
    cache.set('k1', 'old', 1000);
    cache.set('k2', 'fresh', 10 * 60 * 1000);
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(cache.get('k2')).toBe('fresh');
    expect(cache.get('k1')).toBeUndefined();
  });

  it('getWrappedCacheFunc returns cached result on subsequent calls', () => {
    const cache = new MiniCache();
    const fn = vi.fn((x: number) => x * 2);
    const wrapped = cache.getWrappedCacheFunc('id', 60_000, fn);
    expect(wrapped(3)).toBe(6);
    expect(wrapped(99)).toBe(6);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('getWrappedCacheFuncAsync caches resolved values', async () => {
    const cache = new MiniCache();
    const fn = vi.fn(async (x: number) => x + 1);
    const wrapped = cache.getWrappedCacheFuncAsync('id-async', 60_000, fn);
    expect(await wrapped(1)).toBe(2);
    expect(await wrapped(100)).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
