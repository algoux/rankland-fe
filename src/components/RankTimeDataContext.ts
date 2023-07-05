import React, { createContext } from 'react';
import type * as srk from '@algoux/standard-ranklist';
import type { IRankTimePoint, IRankTimeSolvedEventPoint, IRankTimeSeriesSegment } from '@/utils/rank-time-data.util';

export interface IRankTimeData {
  key: string;
  initialized: boolean;
  unit: srk.TimeUnit;
  points: IRankTimePoint[];
  solvedEventPoints: IRankTimeSolvedEventPoint[];
  seriesSegments: IRankTimeSeriesSegment[];
  totalUsers: number;
}

export const RankTimeDataContext = createContext<IRankTimeData>({
  key: '',
  initialized: false,
  unit: 'min',
  points: [],
  solvedEventPoints: [],
  seriesSegments: [],
  totalUsers: 0,
});
