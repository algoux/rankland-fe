const siteName = process.env.SITE_ALIAS === 'cn' ? 'RankLand · 榜单大陆' : 'RankLand';

export function formatTitle(title?: string) {
  return title ? `${title} | ${siteName}` : siteName;
}
