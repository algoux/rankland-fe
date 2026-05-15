import { describe, expect, it, vi } from 'vitest';
import { formatSrkAssetUrl } from '@/utils/srk-asset.util';

describe('formatSrkAssetUrl', () => {
  it('returns protocol-relative URLs as-is', () => {
    expect(formatSrkAssetUrl('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png');
  });

  it('returns http/https/data URLs unchanged', () => {
    expect(formatSrkAssetUrl('http://example.com/x.png')).toBe('http://example.com/x.png');
    expect(formatSrkAssetUrl('https://example.com/x.png')).toBe('https://example.com/x.png');
    expect(formatSrkAssetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(formatSrkAssetUrl('HTTPS://EXAMPLE.com/x.png')).toBe('HTTPS://EXAMPLE.com/x.png');
  });

  it('returns empty string for unsupported protocols (and warns)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(formatSrkAssetUrl('ftp://example.com/x.png')).toBe('');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('joins relative path with SRK_STORAGE_BASE and assetIdScope', () => {
    const result = formatSrkAssetUrl('logo.png', 'scope-1');
    expect(result).toBe(`${process.env.SRK_STORAGE_BASE}/scope-1/logo.png`);
  });

  it('handles relative paths starting with / without double slash', () => {
    const result = formatSrkAssetUrl('/logo.png', 'scope-1');
    expect(result).toBe(`${process.env.SRK_STORAGE_BASE}/scope-1/logo.png`);
  });

  it('returns empty string when assetIdScope is missing for relative path', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(formatSrkAssetUrl('logo.png')).toBe('');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
