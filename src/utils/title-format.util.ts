const siteName = 'RankLand';

export function formatTitle(title?: string) {
  return title ? `${title} | ${siteName}` : siteName;
}
