/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable max-depth */
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
import { cloneDeep } from 'lodash-es';

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
  solvedTime: srk.TimeDuration; // 具体的 AC 时间
  fb?: boolean;
}

export interface IRankTimeSeriesSegment {
  title: string;
  resolvedColor: string;
  points: {
    time: number; // 时间点，单位为给定的时间单位
    start: number; // 段起始排名
    end: number; // 段结束排名
  }[];
}

export interface IRankTimeDataSet {
  unit: srk.TimeUnit;
  /** User ID -> 其在每个 icpc series 的时间点的rank+当前总分数据 */
  userRankTimePointsList: Map<string, IRankTimePoint[][]>;
  /** User ID -> 其在每个时间点的rank+解题事件数据 */
  userRankTimeSolvedEventPointsList: Map<string, IRankTimeSolvedEventPoint[][]>;
  /** 每个 icpc series 的段数据，包含每个时间点的段内排名范围 */
  seriesSegmentsList: IRankTimeSeriesSegment[][];
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
  const unitTimeValue = formatTimeDuration(unit);
  // 按传入单位切割的时间点数组，如：[[0, 'min'], [1, 'min'], [2, 'min'], ..., [300, 'min]]
  const timePoints: srk.TimeDuration[] = [];
  {
    const duration = ranklist.contest.duration;
    const durationInTargetUnit = formatTimeDuration(duration, unit[1]);
    let ts = 0;
    timePoints.push([ts, unit[1]]);
    while (ts < durationInTargetUnit) {
      ts = Math.min(ts + unit[0], durationInTargetUnit);
      timePoints.push([ts, unit[1]]);
    }
  }

  const icpcSeriesList: srk.RankSeries[] = ranklist.series
    .filter((s) => s.rule?.preset === 'ICPC')
    .map((icpcSeries) => {
      if (
        !icpcSeries ||
        (!(icpcSeries.rule as srk.RankSeriesRulePresetICPC)?.options?.ratio?.value.some((v) => v > 0) &&
          !(icpcSeries.rule as srk.RankSeriesRulePresetICPC)?.options?.count?.value.some((v) => v > 0))
      ) {
        return {
          title: '#',
          segments: [],
          rule: { preset: 'ICPC', options: { count: { value: [] } } },
        };
      }
      return icpcSeries;
    });

  const seriesSegmentRangesList: IRankTimeSeriesSegment[][] = [];
  const fixedSeriesSegmentRangesList: { start: number; end: number }[][] = []; // 对应每一个 icpcSeries，当使用 noTied 时，标记每个段的开始到结束的排名范围
  for (const icpcSeries of icpcSeriesList) {
    const seriesSegmentRanges: IRankTimeSeriesSegment[] = [];
    const fixedSeriesSegmentRanges: { start: number; end: number }[] = [];
    const icpcSeriesOptions = (icpcSeries.rule as srk.RankSeriesRulePresetICPC).options!;

    const segments = icpcSeries!.segments || [];
    seriesSegmentRanges.push(
      ...segments.map((s) => ({
        title: s.title!,
        resolvedColor: resolveSegmentStyle(s.style),
        points: [],
      })),
    );
    // TODO ratio noTied support
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
    seriesSegmentRangesList.push(seriesSegmentRanges);
    fixedSeriesSegmentRangesList.push(fixedSeriesSegmentRanges);
  }
  console.log('fixedSeriesSegmentRangesList:', fixedSeriesSegmentRangesList);

  // 计算每个时间点的 ranklist 快照
  const rowsGroupByTimePoints: StaticRanklist['rows'][] = [];
  const userRankTimeSolvedEventPointsComm = new Map<string, IRankTimeSolvedEventPoint[]>();
  {
    let sIndex = 0;
    let lastRows = regenerateRanklistBySolutions(ranklist, []).rows;
    let lastRanklist: srk.Ranklist = {
      ...ranklist,
      series: icpcSeriesList,
      rows: lastRows,
    };
    for (let tpIndex = 0; tpIndex < timePoints.length; tpIndex++) {
      const tp = timePoints[tpIndex];
      for (let i = 0; i < icpcSeriesList.length; i++) {
        const fixedSeriesSegmentRanges = fixedSeriesSegmentRangesList[i];
        if (fixedSeriesSegmentRanges.length > 0) {
          seriesSegmentRangesList[i].forEach((s, index) => {
            s.points.push({
              time: tp[0],
              ...fixedSeriesSegmentRanges[index],
            });
          });
        }
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
          if (!userRankTimeSolvedEventPointsComm.has(userId)) {
            userRankTimeSolvedEventPointsComm.set(userId, []);
          }
          if (result !== 'AC' && result !== 'FB') {
            continue;
          }
          const solvedEventPoints = userRankTimeSolvedEventPointsComm.get(userId)!;
          const problemAlias = ranklist.problems[problemIndex].alias!;
          let solvedTimePointValue = tp[0];
          // if (formatTimeDuration(time, unit[1]) < tp[0] && tpIndex > 0) {
          //   // 如果解题时间小于当前时间点，则使用解题时间作为时间点
          //   solvedTimePointValue = timePoints[tpIndex - 1][0];
          // }
          const solvedEventPoint: IRankTimeSolvedEventPoint = {
            time: solvedTimePointValue,
            rank: -1,
            problemAlias,
            solvedTime: time,
            fb: result === 'FB',
          };
          solvedEventPoints.push(solvedEventPoint);
        }
        // console.log('new solutions', incrementalSolutions);
        lastRanklist.rows = regenerateRowsByIncrementalSolutions(lastRanklist, incrementalSolutions);
        // console.log('new rows', JSON.stringify(lastRanklist.rows, null, 2));
        // static rows 中的 rankValues 和 icpcSeriesList 对应，不会包含非 ICPC 系列的 series
        const staticRows = convertToStaticRanklist(lastRanklist).rows;
        rowsGroupByTimePoints.push(staticRows);

        // 对于每个 series，计算这个时间点的段内排名范围
        for (let i = 0; i < icpcSeriesList.length; i++) {
          const seriesSegmentRanges = seriesSegmentRangesList[i];
          const fixedSeriesSegmentRanges = fixedSeriesSegmentRangesList[i];
          const rankValueList = staticRows.map((r) => r.rankValues[i]);
          // calculate seriesSegmentRanges
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
                ranges[segmentIndex].start = ranges[segmentIndex].end = cur.rank;
              } else if (cur.segmentIndex === segmentIndex) {
                ranges[segmentIndex].end = cur.rank;
              }
              cursor++;
            }
          }
          // fix ranges
          for (let j = 0; j < ranges.length; ++j) {
            const r = ranges[j];
            if (r.start !== -1 && r.end !== -1) {
              if (j + 1 < ranges.length && ranges[j + 1].start !== -1 && ranges[j + 1].start > r.end) {
                r.end = ranges[j + 1].start - 1;
              }
              seriesSegmentRanges[j].points.push(r);
            } else {
              break;
            }
          }
        }
      } else {
        if (rowsGroupByTimePoints.length) {
          rowsGroupByTimePoints.push(rowsGroupByTimePoints[rowsGroupByTimePoints.length - 1]);
        } else {
          rowsGroupByTimePoints.push(convertToStaticRanklist(lastRanklist).rows);
        }
        // 对于每个 series，计算这个时间点的段内排名范围
        seriesSegmentRangesList.forEach((seriesSegmentRanges, index) => {
          // 与上一个时间点相比没有新增提交，直接复用
          if (fixedSeriesSegmentRangesList[index].length === 0) {
            seriesSegmentRanges.forEach((r) => {
              if (r.points.length) {
                r.points.push(cloneDeep(r.points[r.points.length - 1]));
                r.points[r.points.length - 1].time = tp[0];
              }
            });
          }
        });
      }
    }
  }

  const userRankTimePointsList = new Map<string, IRankTimePoint[][]>();
  const userRankTimeSolvedEventPointsList = new Map<string, IRankTimeSolvedEventPoint[][]>();
  for (let i = 0; i < timePoints.length; i++) {
    const tp = timePoints[i];
    const rows = rowsGroupByTimePoints[i];
    for (const row of rows) {
      const user = row.user;
      if (!userRankTimePointsList.has(user.id)) {
        userRankTimePointsList.set(user.id, []);
      }
      const rankTimePointsList = userRankTimePointsList.get(user.id)!;
      while (rankTimePointsList.length < icpcSeriesList.length) {
        rankTimePointsList.push([]);
      }
      for (let j = 0; j < icpcSeriesList.length; j++) {
        const rankTimePoints = rankTimePointsList[j];
        const rank = row.rankValues[j].rank;
        if (typeof rank !== 'number') {
          continue;
        }
        const rankTimePoint: IRankTimePoint = {
          time: tp[0],
          rank,
          solved: row.score.value,
        };
        rankTimePoints.push(rankTimePoint);
      }
    }
  }
  for (const [userId, solvedEventPointsComm] of userRankTimeSolvedEventPointsComm) {
    const rankTimePointsList = userRankTimePointsList.get(userId)!;
    const rankTimeSolvedEventPointsList: IRankTimeSolvedEventPoint[][] = [];
    for (let i = 0; i < icpcSeriesList.length; i++) {
      const rankTimePoints = rankTimePointsList[i];
      const rankTimeSolvedEventPoints: IRankTimeSolvedEventPoint[] = cloneDeep(solvedEventPointsComm);
      for (const solvedEventPoint of rankTimeSolvedEventPoints) {
        const rankTimePoint = rankTimePoints.find((r) => r.time === solvedEventPoint.time);
        if (rankTimePoint) {
          solvedEventPoint.rank = rankTimePoint.rank;
        }
      }
      rankTimeSolvedEventPointsList.push(rankTimeSolvedEventPoints);
    }
    userRankTimeSolvedEventPointsList.set(userId, rankTimeSolvedEventPointsList);
  }
  // console.log('rowsGroupByTimePoints', rowsGroupByTimePoints);
  console.log('seriesSegmentRangesList', seriesSegmentRangesList);
  console.log('userRankTimePointsList', userRankTimePointsList);
  console.log('userRankTimeSolvedEventPointsList', userRankTimeSolvedEventPointsList);

  console.timeEnd('[RankTimeData] getAllRankTimeData');
  return {
    unit: unit[1],
    userRankTimePointsList,
    userRankTimeSolvedEventPointsList,
    seriesSegmentsList: seriesSegmentRangesList,
    totalUsers: ranklist.rows.length,
  };
}
