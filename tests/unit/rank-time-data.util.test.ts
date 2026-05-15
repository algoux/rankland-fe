import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import type { CalculatedSolutionTetrad, StaticRanklist } from '@algoux/standard-ranklist-utils';
import {
  getAllRankTimeData,
  getProperRankTimeChunkUnit,
  selectUserMainRankTimeData,
} from '@/utils/rank-time-data.util';
import type { IRankTimeDataSet, IRankTimePoint, IRankTimeSeriesSegment } from '@/utils/rank-time-data.util';

function makeContest(duration: srk.TimeDuration): srk.Contest {
  return {
    title: 'Rank Time Test',
    startAt: '2024-04-01T10:00:00+08:00',
    duration,
  } as srk.Contest;
}

function makeProblem(alias: string): srk.Problem {
  return {
    title: `Problem ${alias}`,
    alias,
  } as srk.Problem;
}

function makeMarker(id: string): srk.Marker {
  return { id, label: id, style: 'gold' } as srk.Marker;
}

function makeICPCSeries(
  title: string,
  options: srk.RankSeriesRulePresetICPC['options'],
  segments: srk.RankSeriesSegment[] = [
    { title: 'Gold', style: 'gold' } as srk.RankSeriesSegment,
    { title: 'Silver', style: 'silver' } as srk.RankSeriesSegment,
  ],
): srk.RankSeries {
  return {
    title,
    segments,
    rule: {
      preset: 'ICPC',
      options,
    },
  } as srk.RankSeries;
}

function makeNormalSeries(title = 'Normal'): srk.RankSeries {
  return {
    title,
    segments: [],
    rule: {
      preset: 'Normal',
      options: {},
    } as any,
  } as srk.RankSeries;
}

function makeRow(id: string, markers?: string[]): srk.RanklistRow {
  return {
    user: {
      id,
      name: id,
      markers,
    },
    score: { value: 0, time: [0, 'ms'] },
    statuses: [
      { result: null, solutions: [] },
      { result: null, solutions: [] },
    ],
  } as srk.RanklistRow;
}

function makeRanklist(series?: srk.RankSeries[]): srk.Ranklist {
  return {
    type: 'general',
    version: '0.3.12',
    contest: makeContest([5, 'min']),
    problems: [makeProblem('A'), makeProblem('B')],
    series:
      series ||
      [
        makeICPCSeries('Overall', { count: { value: [1, 1] } }),
        makeICPCSeries('Fixed', { count: { value: [1, 2], noTied: true } }),
      ],
    rows: [makeRow('alpha'), makeRow('beta'), makeRow('gamma')],
    sorter: {
      algorithm: 'ICPC',
      config: {},
    },
  };
}

function getUserPoints(dataSet: IRankTimeDataSet, userId: string, seriesIndex = 0): IRankTimePoint[] {
  return dataSet.userRankTimePointsList.get(userId)?.[seriesIndex] || [];
}

function makeSegment(title: string): IRankTimeSeriesSegment {
  return {
    title,
    resolvedColor: 'transparent',
    points: [],
  };
}

describe('rank time chunk unit', () => {
  it('chooses the expected chunk unit from contest duration boundaries', () => {
    expect(getProperRankTimeChunkUnit(makeContest([5, 'h']))).toEqual([1, 'min']);
    expect(getProperRankTimeChunkUnit(makeContest([6, 'h']))).toEqual([5, 'min']);
    expect(getProperRankTimeChunkUnit(makeContest([24, 'h']))).toEqual([5, 'min']);
    expect(getProperRankTimeChunkUnit(makeContest([25, 'h']))).toEqual([1, 'h']);
    expect(getProperRankTimeChunkUnit(makeContest([7, 'd']))).toEqual([1, 'h']);
    expect(getProperRankTimeChunkUnit(makeContest([8, 'd']))).toEqual([1, 'd']);
  });
});

describe('getAllRankTimeData', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'time').mockImplementation(() => undefined);
    vi.spyOn(console, 'timeEnd').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds rank slices and solved events from the submission timeline', () => {
    const ranklist = makeRanklist();
    const solutions: CalculatedSolutionTetrad[] = [
      ['alpha', 0, 'AC', [1, 'min']],
      ['beta', 0, 'RJ', [1, 'min']],
      ['beta', 1, 'FB', [2, 'min']],
      ['gamma', 0, 'AC', [4, 'min']],
    ];

    const dataSet = getAllRankTimeData(ranklist, solutions, [1, 'min']);

    expect(dataSet.unit).toBe('min');
    expect(dataSet.totalUsers).toBe(3);
    expect(getUserPoints(dataSet, 'alpha')).toEqual([
      { time: 0, rank: 1, solved: 0 },
      { time: 1, rank: 1, solved: 1 },
      { time: 2, rank: 1, solved: 1 },
      { time: 3, rank: 1, solved: 1 },
      { time: 4, rank: 1, solved: 1 },
      { time: 5, rank: 1, solved: 1 },
    ]);
    expect(getUserPoints(dataSet, 'beta')).toEqual([
      { time: 0, rank: 1, solved: 0 },
      { time: 1, rank: 2, solved: 0 },
      { time: 2, rank: 2, solved: 1 },
      { time: 3, rank: 2, solved: 1 },
      { time: 4, rank: 2, solved: 1 },
      { time: 5, rank: 2, solved: 1 },
    ]);
    expect(getUserPoints(dataSet, 'gamma')).toEqual([
      { time: 0, rank: 1, solved: 0 },
      { time: 1, rank: 2, solved: 0 },
      { time: 2, rank: 3, solved: 0 },
      { time: 3, rank: 3, solved: 0 },
      { time: 4, rank: 3, solved: 1 },
      { time: 5, rank: 3, solved: 1 },
    ]);

    expect(dataSet.userRankTimeSolvedEventPointsList.get('alpha')?.[0]).toEqual([
      { time: 1, rank: 1, problemAlias: 'A', solvedTime: [1, 'min'], fb: false },
    ]);
    expect(dataSet.userRankTimeSolvedEventPointsList.get('beta')?.[0]).toEqual([
      { time: 2, rank: 2, problemAlias: 'B', solvedTime: [2, 'min'], fb: true },
    ]);
    expect(dataSet.userRankTimeSolvedEventPointsList.get('gamma')?.[0]).toEqual([
      { time: 4, rank: 3, problemAlias: 'A', solvedTime: [4, 'min'], fb: false },
    ]);
  });

  it('builds dynamic segment ranges and fixed noTied segment ranges', () => {
    const ranklist = makeRanklist();
    const solutions: CalculatedSolutionTetrad[] = [
      ['alpha', 0, 'AC', [1, 'min']],
      ['beta', 1, 'FB', [2, 'min']],
      ['gamma', 0, 'AC', [4, 'min']],
    ];

    const dataSet = getAllRankTimeData(ranklist, solutions, [1, 'min']);

    expect(dataSet.seriesSegmentsList[0][0]).toMatchObject({
      title: 'Gold',
      resolvedColor: '#f8bf29',
    });
    expect(dataSet.seriesSegmentsList[0][0].points).toEqual([
      { time: 1, start: 1, end: 1 },
      { time: 2, start: 1, end: 1 },
      { time: 3, start: 1, end: 1 },
      { time: 4, start: 1, end: 1 },
      { time: 5, start: 1, end: 1 },
    ]);
    expect(dataSet.seriesSegmentsList[0][1].points).toEqual([
      { time: 1, start: 2, end: 2 },
      { time: 2, start: 2, end: 2 },
      { time: 3, start: 2, end: 2 },
      { time: 4, start: 2, end: 2 },
      { time: 5, start: 2, end: 2 },
    ]);
    expect(dataSet.seriesSegmentsList[1][0].points).toEqual([
      { time: 0, start: 1, end: 1 },
      { time: 1, start: 1, end: 1 },
      { time: 2, start: 1, end: 1 },
      { time: 3, start: 1, end: 1 },
      { time: 4, start: 1, end: 1 },
      { time: 5, start: 1, end: 1 },
    ]);
    expect(dataSet.seriesSegmentsList[1][1].points).toEqual([
      { time: 0, start: 2, end: 3 },
      { time: 1, start: 2, end: 3 },
      { time: 2, start: 2, end: 3 },
      { time: 3, start: 2, end: 3 },
      { time: 4, start: 2, end: 3 },
      { time: 5, start: 2, end: 3 },
    ]);
  });
});

describe('selectUserMainRankTimeData', () => {
  function makeSelectionFixture() {
    const overallSeries = makeICPCSeries('Overall', { count: { value: [3] } }, []);
    const girlSeries = makeICPCSeries('Girls', { filter: { byMarker: 'girl' }, count: { value: [3] } }, []);
    const rookieSeries = makeICPCSeries('Rookies', { filter: { byMarker: 'rookie' }, count: { value: [3] } }, []);
    const staticSeries = [makeNormalSeries(), overallSeries, girlSeries, rookieSeries] as StaticRanklist['series'];
    const staticRows = [
      {
        ...makeRow('alpha', ['girl', 'rookie']),
        rankValues: [],
      },
      {
        ...makeRow('beta', ['girl']),
        rankValues: [],
      },
      {
        ...makeRow('gamma'),
        rankValues: [],
      },
      {
        ...makeRow('empty-rookie', ['rookie']),
        rankValues: [],
      },
    ] as StaticRanklist['rows'];
    const markers = [makeMarker('girl'), makeMarker('rookie')];

    const overallPoints = [{ time: 0, rank: 11, solved: 0 }];
    const girlPoints = [{ time: 0, rank: 22, solved: 0 }];
    const rookiePoints = [{ time: 0, rank: 33, solved: 0 }];
    const betaOverallPoints = [{ time: 0, rank: 44, solved: 0 }];
    const betaGirlPoints = [{ time: 0, rank: 55, solved: 0 }];
    const gammaOverallPoints = [{ time: 0, rank: 66, solved: 0 }];

    const overallSegments = [makeSegment('overall')];
    const girlSegments = [makeSegment('girl')];
    const rookieSegments = [makeSegment('rookie')];
    const dataSet: IRankTimeDataSet = {
      unit: 'min',
      totalUsers: 3,
      userRankTimePointsList: new Map([
        ['alpha', [overallPoints, girlPoints, rookiePoints]],
        ['beta', [betaOverallPoints, betaGirlPoints, []]],
        ['gamma', [gammaOverallPoints, [], []]],
        ['empty-rookie', [[], [], []]],
      ]),
      userRankTimeSolvedEventPointsList: new Map([
        ['alpha', [[], [{ time: 0, rank: 22, problemAlias: 'A', solvedTime: [0, 'min'] }], []]],
      ]),
      seriesSegmentsList: [overallSegments, girlSegments, rookieSegments],
    };

    return {
      dataSet,
      staticRows,
      staticSeries,
      markers,
      overallPoints,
      girlPoints,
      rookiePoints,
      betaGirlPoints,
      gammaOverallPoints,
      overallSegments,
      girlSegments,
      rookieSegments,
    };
  }

  it('selects the first marker-filtered ICPC series matching the user marker', () => {
    const fixture = makeSelectionFixture();

    const selected = selectUserMainRankTimeData({
      rankTimeDataSet: fixture.dataSet,
      staticRows: fixture.staticRows,
      staticSeries: fixture.staticSeries,
      staticMarkers: fixture.markers,
      userId: 'alpha',
    });

    expect(selected?.points).toBe(fixture.girlPoints);
    expect(selected?.seriesSegments).toBe(fixture.girlSegments);
    expect(selected?.solvedEventPoints).toEqual([
      { time: 0, rank: 22, problemAlias: 'A', solvedTime: [0, 'min'] },
    ]);
    expect(selected?.unit).toBe('min');
    expect(selected?.totalUsers).toBe(3);
  });

  it('uses fixed marker selection and ICPC-only index mapping for filtered views', () => {
    const fixture = makeSelectionFixture();

    const selected = selectUserMainRankTimeData({
      rankTimeDataSet: fixture.dataSet,
      staticRows: fixture.staticRows,
      staticSeries: fixture.staticSeries,
      staticMarkers: fixture.markers,
      userId: 'alpha',
      fixedMarker: 'rookie',
    });

    expect(selected?.points).toBe(fixture.rookiePoints);
    expect(selected?.seriesSegments).toBe(fixture.rookieSegments);
  });

  it('returns null when fixed marker is selected but the user does not have that marker', () => {
    const fixture = makeSelectionFixture();

    const selected = selectUserMainRankTimeData({
      rankTimeDataSet: fixture.dataSet,
      staticRows: fixture.staticRows,
      staticSeries: fixture.staticSeries,
      staticMarkers: fixture.markers,
      userId: 'beta',
      fixedMarker: 'rookie',
    });

    expect(selected).toBeNull();
  });

  it('falls back to the first unfiltered ICPC series for users without marker-specific series', () => {
    const fixture = makeSelectionFixture();

    const selected = selectUserMainRankTimeData({
      rankTimeDataSet: fixture.dataSet,
      staticRows: fixture.staticRows,
      staticSeries: fixture.staticSeries,
      staticMarkers: fixture.markers,
      userId: 'gamma',
    });

    expect(selected?.points).toBe(fixture.gammaOverallPoints);
    expect(selected?.seriesSegments).toBe(fixture.overallSegments);
  });

  it('returns null for missing users or users with no selected rank points', () => {
    const fixture = makeSelectionFixture();

    expect(
      selectUserMainRankTimeData({
        rankTimeDataSet: fixture.dataSet,
        staticRows: fixture.staticRows,
        staticSeries: fixture.staticSeries,
        staticMarkers: fixture.markers,
        userId: 'missing',
      }),
    ).toBeNull();
    expect(
      selectUserMainRankTimeData({
        rankTimeDataSet: fixture.dataSet,
        staticRows: fixture.staticRows,
        staticSeries: fixture.staticSeries,
        staticMarkers: fixture.markers,
        userId: 'empty-rookie',
      }),
    ).toBeNull();
  });
});
