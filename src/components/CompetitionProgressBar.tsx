import React, { useEffect, useState } from 'react';
import { Progress } from 'antd';
import { useRafInterval } from 'ahooks';
import { secToTimeStr } from '@/utils/time-format.util';

export interface ICompetitionProgressBarProps {
  /** start time ms */
  startAt: number;
  /** end time ms */
  endAt: number;
  /** frozen length ms (default: 0) */
  frozenLength?: number;
  /** time diff ms, calculated by `localTime - serverTime` (default: 0)  */
  td?: number;
}

export default function CompetitionProgressBar(props: ICompetitionProgressBarProps) {
  const { startAt, endAt, frozenLength = 0, td = 0 } = props;
  const [localTime, setLocalTime] = useState(Date.now());
  const length = endAt - startAt;
  const currentTime = localTime - td;
  const elapsed = Math.min(Math.max(currentTime - startAt, 0), length);
  const remaining = length - elapsed;
  const frozenAt = endAt - frozenLength;
  const percent = length ? (elapsed / length) * 100 : 0;
  const normalPercent = length ? (Math.max(Math.min(currentTime, frozenAt) - startAt, 0) / length) * 100 : 0;

  useRafInterval(() => {
    setLocalTime(Date.now());
  }, 1000);

  return (
    <>
      <Progress percent={percent} success={{ percent: normalPercent }} showInfo={false} />
      <div className="flex justify-between">
        <div>Elapsed: {secToTimeStr(Math.round(elapsed / 1000))}</div>
        <div>Remaining: {secToTimeStr(Math.round(remaining / 1000))}</div>
      </div>
    </>
  );
}
