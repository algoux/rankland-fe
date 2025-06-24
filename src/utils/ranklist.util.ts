import type * as srk from '@algoux/standard-ranklist';

/**
 * 为用户选择合适的 ICPC main series
 */
export function findUserMatchedMainICPCSeries(
  seriesList: srk.RankSeries[],
  userMarkers: srk.Marker[],
  fixedMarker?: string,
): srk.RankSeries | undefined {
  const icpcSeries = seriesList.filter((s) => s.rule?.preset === 'ICPC');
  if (icpcSeries.length === 0) {
    return undefined;
  }
  // 1. 已指定固定 marker，则一定使用这个 filter 对应的 series
  // 2. 根据 icpc 的 series 遍历，选择第一个在 userMarkers 中出现的 series
  // 3. fallback：选择第一个没有限定 `filter.byMarker` 的 series
  if (fixedMarker) {
    if (!userMarkers.find((um) => um.id === fixedMarker)) {
      return undefined;
    }
    return icpcSeries.find((s) => (s.rule as srk.RankSeriesRulePresetICPC).options?.filter?.byMarker === fixedMarker);
  } else {
    const series = icpcSeries.find((s) => {
      const seriesFilterMarker = (s.rule as srk.RankSeriesRulePresetICPC).options?.filter?.byMarker;
      return !!(seriesFilterMarker && userMarkers.find((um) => um.id === seriesFilterMarker));
    });
    if (series) {
      return series;
    }
  }
  return icpcSeries.find((s) => {
    return !(s.rule as srk.RankSeriesRulePresetICPC).options?.filter?.byMarker;
  });
}
