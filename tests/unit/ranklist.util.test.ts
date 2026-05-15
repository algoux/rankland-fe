import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import { findUserMatchedMainICPCSeries } from '@/utils/ranklist.util';

function makeICPCSeries(byMarker?: string, title?: string): srk.RankSeries {
  return {
    title: title || (byMarker ? `ICPC-${byMarker}` : 'ICPC'),
    segments: [],
    rule: {
      preset: 'ICPC',
      options: byMarker
        ? {
            filter: { byMarker },
            count: { value: [1] },
          }
        : { count: { value: [1] } },
    },
  } as srk.RankSeries;
}

function makeMarker(id: string): srk.Marker {
  return { id, label: id, style: 'gold' } as srk.Marker;
}

describe('findUserMatchedMainICPCSeries', () => {
  it('returns undefined when there is no ICPC series', () => {
    const series: srk.RankSeries[] = [
      {
        title: 'NonICPC',
        segments: [],
        rule: { preset: 'NOP' as any, options: {} as any },
      } as unknown as srk.RankSeries,
    ];
    expect(findUserMatchedMainICPCSeries(series, [])).toBeUndefined();
  });

  it('returns the series matching the fixed marker when user has that marker', () => {
    const series = [
      makeICPCSeries(),
      makeICPCSeries('girl'),
      makeICPCSeries('rookie'),
    ];
    const markers = [makeMarker('girl'), makeMarker('rookie')];
    const result = findUserMatchedMainICPCSeries(series, markers, 'rookie');
    expect(result).toBe(series[2]);
  });

  it('returns undefined when fixed marker is set but user lacks it', () => {
    const series = [makeICPCSeries(), makeICPCSeries('girl')];
    const markers = [makeMarker('boy')];
    expect(findUserMatchedMainICPCSeries(series, markers, 'girl')).toBeUndefined();
  });

  it('picks the first marker-filtered series matching a user marker when no fixed marker', () => {
    const noMarker = makeICPCSeries();
    const girlSeries = makeICPCSeries('girl');
    const rookieSeries = makeICPCSeries('rookie');
    const series = [noMarker, girlSeries, rookieSeries];
    const markers = [makeMarker('rookie')];
    expect(findUserMatchedMainICPCSeries(series, markers)).toBe(rookieSeries);
  });

  it('falls back to the first series without byMarker filter', () => {
    const noMarker = makeICPCSeries();
    const girlSeries = makeICPCSeries('girl');
    const series = [girlSeries, noMarker];
    const markers: srk.Marker[] = [];
    expect(findUserMatchedMainICPCSeries(series, markers)).toBe(noMarker);
  });

  it('falls back to the first unfiltered ICPC series when multiple ordinary ICPC series exist', () => {
    const firstOverall = makeICPCSeries(undefined, 'Overall');
    const secondOverall = makeICPCSeries(undefined, 'Official');
    const girlSeries = makeICPCSeries('girl');
    const series = [girlSeries, firstOverall, secondOverall];
    const markers: srk.Marker[] = [];
    expect(findUserMatchedMainICPCSeries(series, markers)).toBe(firstOverall);
  });

  it('returns undefined when no series matches user markers and all have byMarker filter', () => {
    const series = [makeICPCSeries('girl'), makeICPCSeries('rookie')];
    expect(findUserMatchedMainICPCSeries(series, [])).toBeUndefined();
  });
});
