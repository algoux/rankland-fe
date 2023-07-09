/* eslint-disable complexity */
import type * as srk from '@algoux/standard-ranklist';
import {
  regenerateRanklistBySolutions,
  formatTimeDuration,
  regenerateRowsByIncrementalSolutions,
  convertToStaticRanklist,
  resolveThemeColor,
  EnumTheme,
} from '@algoux/standard-ranklist-utils';
import type { CalculatedSolutionTetrad, StaticRanklist } from '@algoux/standard-ranklist-utils';

export function getProperRankTimeChunkUnit(contest: srk.Contest): srk.TimeDuration {
  const duration = contest.duration;
  const durationInHour = formatTimeDuration(duration, 'h');
  if (durationInHour <= 5) {
    return [1, 'min'];
  } else if (durationInHour <= 24) {
    return [5, 'min'];
  } else if (durationInHour <= 24 * 7) {
    return [1, 'h'];
  } else {
    return [1, 'd'];
  }
}

export interface IRankTimePoint {
  time: number;
  rank: number;
  solved: number;
}

export interface IRankTimeSolvedEventPoint {
  time: number;
  rank: number;
  problemAlias: string;
  fb?: boolean;
}

export interface IRankTimeSeriesSegment {
  title: string;
  resolvedColor: string;
  points: {
    time: number;
    start: number;
    end: number;
  }[];
}

export interface IRankTimeDataSet {
  unit: srk.TimeUnit;
  userRankTimePoints: Map<string, IRankTimePoint[]>;
  userRankTimeSolvedEventPoints: Map<string, IRankTimeSolvedEventPoint[]>;
  seriesSegments: IRankTimeSeriesSegment[];
  totalUsers: number;
}

function resolveSegmentStyle(style: srk.RankSeriesSegment['style']): srk.Color {
  if (typeof style === 'string') {
    switch (style) {
      case 'gold':
        return '#f8bf29';
      case 'silver':
        return '#c0c0c0';
      case 'bronze':
        return '#d69872';
      case 'iron':
        return '#a94442';
      default:
        return 'transparent';
    }
  } else if (style?.backgroundColor) {
    return resolveThemeColor(style.backgroundColor)[EnumTheme.light]!;
  }
  return 'transparent';
}

export function getAllRankTimeData(
  ranklist: srk.Ranklist,
  solutions: CalculatedSolutionTetrad[],
  unit: srk.TimeDuration,
): IRankTimeDataSet {
  console.time('[RankTimeData] getAllRankTimeData');
  let icpcSeries = ranklist.series.find((s) => s.rule?.preset === 'ICPC');
  if (
    !icpcSeries ||
    (!(icpcSeries.rule as srk.RankSeriesRulePresetICPC)?.options?.ratio?.value.some((v) => v > 0) &&
      !(icpcSeries.rule as srk.RankSeriesRulePresetICPC)?.options?.count?.value.some((v) => v > 0))
  ) {
    icpcSeries = {
      title: '#',
      segments: [],
      rule: { preset: 'ICPC', options: { count: { value: [] } } },
    };
  }
  const icpcSeriesOptions = (icpcSeries.rule as srk.RankSeriesRulePresetICPC).options!;
  const seriesSegmentRanges: IRankTimeSeriesSegment[] = [];
  const duration = ranklist.contest.duration;
  const durationInTargetUnit = formatTimeDuration(duration, unit[1]);
  let ts = 0;
  const timePoints: srk.TimeDuration[] = [[ts, unit[1]]];
  while (ts < durationInTargetUnit) {
    ts = Math.min(ts + unit[0], durationInTargetUnit);
    timePoints.push([ts, unit[1]]);
  }
  const segments = icpcSeries!.segments || [];
  seriesSegmentRanges.push(
    ...segments.map((s) => ({
      title: s.title!,
      resolvedColor: resolveSegmentStyle(s.style),
      points: [],
    })),
  );
  // TODO ratio noTied support
  const fixedSeriesSegmentRanges: { start: number; end: number }[] = [];
  if (icpcSeriesOptions.count?.noTied) {
    let start = 1;
    icpcSeriesOptions.count.value.forEach((v) => {
      fixedSeriesSegmentRanges.push({
        start,
        end: start + v - 1,
      });
      start += v;
    });
  }

  const rowsGroupByTimePoints: StaticRanklist['rows'][] = [];
  const userRankTimeSolvedEventPoints = new Map<string, IRankTimeSolvedEventPoint[]>();
  let sIndex = 0;
  let lastRows = regenerateRanklistBySolutions(ranklist, []).rows;
  let lastRanklist: srk.Ranklist = {
    ...ranklist,
    series: [icpcSeries],
    rows: lastRows,
  };
  for (const tp of timePoints) {
    // console.log('doing tp', tp);
    if (fixedSeriesSegmentRanges.length > 0) {
      seriesSegmentRanges.forEach((s, index) => {
        s.points.push({
          time: tp[0],
          ...fixedSeriesSegmentRanges[index],
        });
      });
    }
    const timeValue = formatTimeDuration(tp);
    const check = (tetrad: CalculatedSolutionTetrad) => formatTimeDuration(tetrad[3]) <= timeValue;
    const incrementalSolutions: CalculatedSolutionTetrad[] = [];
    while (sIndex < solutions.length) {
      const solution = solutions[sIndex];
      if (check(solution)) {
        incrementalSolutions.push(solution);
        sIndex++;
      } else {
        break;
      }
    }
    if (incrementalSolutions.length) {
      for (const solution of incrementalSolutions) {
        const [userId, problemIndex, result, time] = solution;
        if (!userRankTimeSolvedEventPoints.has(userId)) {
          userRankTimeSolvedEventPoints.set(userId, []);
        }
        if (result !== 'AC' && result !== 'FB') {
          continue;
        }
        const solvedEventPoints = userRankTimeSolvedEventPoints.get(userId)!;
        const problemAlias = ranklist.problems[problemIndex].alias!;
        const solvedEventPoint: IRankTimeSolvedEventPoint = {
          time: tp[0],
          rank: -1,
          problemAlias,
          fb: result === 'FB',
        };
        solvedEventPoints.push(solvedEventPoint);
      }
      // console.log('new solutions', incrementalSolutions);
      lastRanklist.rows = regenerateRowsByIncrementalSolutions(lastRanklist, incrementalSolutions);
      // console.log('new rows', JSON.stringify(lastRanklist.rows, null, 2));
      const staticRows = convertToStaticRanklist(lastRanklist).rows;
      rowsGroupByTimePoints.push(staticRows);

      // calculate seriesSegmentRanges
      const rankValueList = staticRows.map((r) => r.rankValues[0]);
      const ranges = new Array(seriesSegmentRanges.length).fill(0).map(() => ({
        time: tp[0],
        start: -1,
        end: -1,
      }));
      if (fixedSeriesSegmentRanges.length === 0) {
        let segmentIndex = -1;
        let cursor = 0;
        while (segmentIndex < seriesSegmentRanges.length && cursor < rankValueList.length) {
          const cur = rankValueList[cursor];
          if (!cur.rank) {
            cursor++;
            continue;
          }
          if (typeof cur.segmentIndex !== 'number') {
            break;
          }
          if (cur.segmentIndex > segmentIndex) {
            segmentIndex = cur.segmentIndex;
            ranges[segmentIndex].start = cur.rank;
          } else if (cur.segmentIndex === segmentIndex) {
            ranges[segmentIndex].end = cur.rank;
          }
          cursor++;
        }
      }
      // fix ranges
      for (let i = 0; i < ranges.length; ++i) {
        const r = ranges[i];
        if (r.start !== -1 && r.end !== -1) {
          if (i + 1 < ranges.length && ranges[i + 1].start !== -1 && ranges[i + 1].start > r.end) {
            r.end = ranges[i + 1].start - 1;
          }
          seriesSegmentRanges[i].points.push(r);
        } else {
          break;
        }
      }
    } else {
      if (rowsGroupByTimePoints.length) {
        rowsGroupByTimePoints.push(rowsGroupByTimePoints[rowsGroupByTimePoints.length - 1]);
      } else {
        rowsGroupByTimePoints.push(convertToStaticRanklist(lastRanklist).rows);
      }
      seriesSegmentRanges.forEach((r) => {
        if (r.points.length) {
          r.points.push(r.points[r.points.length - 1]);
        }
      });
    }
  }

  const userRankTimePoints = new Map<string, IRankTimePoint[]>();
  for (let i = 0; i < timePoints.length; i++) {
    const tp = timePoints[i];
    const rows = rowsGroupByTimePoints[i];
    for (const row of rows) {
      const user = row.user;
      if (!userRankTimePoints.has(user.id)) {
        userRankTimePoints.set(user.id, []);
      }
      if (typeof row.rankValues[0].rank !== 'number') {
        continue;
      }
      const rankTimePoints = userRankTimePoints.get(user.id)!;
      const rankTimePoint: IRankTimePoint = {
        time: tp[0],
        rank: row.rankValues[0].rank,
        solved: row.score.value,
      };
      rankTimePoints.push(rankTimePoint);
    }
  }
  for (const [userId, solvedEventPoints] of userRankTimeSolvedEventPoints) {
    const rankTimePoints = userRankTimePoints.get(userId)!;
    for (const solvedEventPoint of solvedEventPoints) {
      const rankTimePoint = rankTimePoints.find((r) => r.time === solvedEventPoint.time);
      if (rankTimePoint) {
        solvedEventPoint.rank = rankTimePoint.rank;
      }
    }
  }
  // console.log('rowsGroupByTimePoints', rowsGroupByTimePoints);
  // console.log('seriesSegmentRanges', seriesSegmentRanges);
  // console.log('userRankTimePoints', userRankTimePoints);
  // console.log('userRankTimeSolvedEventPoints', userRankTimeSolvedEventPoints);

  console.timeEnd('[RankTimeData] getAllRankTimeData');
  return {
    unit: unit[1],
    userRankTimePoints,
    userRankTimeSolvedEventPoints,
    seriesSegments: seriesSegmentRanges,
    totalUsers: ranklist.rows.length,
  };
}
