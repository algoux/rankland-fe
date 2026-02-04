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
    console.warn(`unsupported protocol "${protocol}" in srk asset url:`, url);
    return '';
  }

  // use srk storage relative path
  if (!assetIdScope) {
    console.warn('assetIdScope is required for srk asset url:', url);
    return '';
  }
  return `${process.env.SRK_STORAGE_BASE}/${assetIdScope}${url.startsWith('/') ? '' : '/'}${url}`;
}
