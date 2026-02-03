export function formatSrkAssetUrl(url: string, assetIdScope?: string): string {
  if (url.startsWith('//')) {
    return url;
  }
  const protocolMatch = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (protocolMatch) {
    const protocol = protocolMatch[1].toLowerCase();
    if (protocol === 'http' || protocol === 'https' || protocol === 'data') {
      return url;
    }
    throw new Error(`Unsupported protocol: ${protocol}`);
  }

  // use srk storage relative path
  if (!assetIdScope) {
    throw new Error('assetIdScope is required for relative srk asset url');
  }
  return `${process.env.SRK_STORAGE_BASE}/${assetIdScope}${url.startsWith('/') ? '' : '/'}${url}`;
}
