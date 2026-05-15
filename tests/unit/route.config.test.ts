import { describe, expect, it } from 'vitest';
import { extractQueryParams, formatUrl, getFullUrl, getRoutes } from '@/configs/route.config';

describe('formatUrl', () => {
  it('formats simple path', () => {
    expect(formatUrl('Home')).toBe('/');
    expect(formatUrl('Search')).toBe('/search');
    expect(formatUrl('Playground')).toBe('/playground');
  });

  it('substitutes path parameters', () => {
    expect(formatUrl('Ranklist', { id: 'abc' })).toBe('/ranklist/abc');
    expect(formatUrl('Collection', { id: 'official' })).toBe('/collection/official');
    expect(formatUrl('Live', { id: 'L1' })).toBe('/live/L1');
  });

  it('appends extra params as query string', () => {
    const url = formatUrl('Collection', { id: 'official', rankId: 'foo' });
    expect(url).toBe('/collection/official?rankId=foo');
  });

  it('throws when route name does not exist', () => {
    expect(() => formatUrl('Unknown')).toThrow(/Route Unknown not found/);
  });
});

describe('getFullUrl', () => {
  it('prepends the global site origin by default', () => {
    expect(getFullUrl('/ranklist/x')).toBe('https://rl.algoux.org/ranklist/x');
  });

  it('adds a leading slash when the path is missing one', () => {
    expect(getFullUrl('search')).toBe('https://rl.algoux.org/search');
  });
});

describe('extractQueryParams', () => {
  it('passes through a plain record', () => {
    expect(extractQueryParams({ kw: 'foo', page: '1' })).toEqual({ kw: 'foo', page: '1' });
  });

  it('converts URLSearchParams to a record', () => {
    const params = new URLSearchParams('a=1&b=2');
    expect(extractQueryParams(params)).toEqual({ a: '1', b: '2' });
  });

  it('returns an empty object when given undefined-ish input', () => {
    expect(extractQueryParams(undefined as unknown as Record<string, any>)).toEqual({});
    expect(extractQueryParams(null as unknown as Record<string, any>)).toEqual({});
  });
});

describe('getRoutes', () => {
  it('exposes all main routes with required fields', () => {
    const routes = getRoutes();
    expect(routes.length).toBeGreaterThanOrEqual(6);
    for (const r of routes) {
      expect(r).toHaveProperty('path');
      expect(r).toHaveProperty('component');
    }
    const paths = routes.map((r) => r.path);
    expect(paths).toEqual(
      expect.arrayContaining(['/', '/search', '/ranklist/:id', '/collection/:id', '/playground', '/live/:id']),
    );
  });
});
