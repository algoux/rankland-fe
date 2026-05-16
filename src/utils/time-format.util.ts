import type * as srk from '@algoux/standard-ranklist';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const EXPLICIT_NUMERIC_TIMEZONE_REGEXP = /([+-])([01]\d|2[0-3]):?([0-5]\d)$/;

export interface IFormattedSrkContestTimeRange {
  startText: string;
  endText: string;
  timezoneSource: 'srk-offset' | 'browser';
  sourceOffset?: string;
}

export function formatSrkTimeDuration(
  time: srk.TimeDuration,
  targetUnit: srk.TimeUnit = 'ms',
  fmt: (num: number) => number = (num) => num,
) {
  let ms = -1;
  switch (time[1]) {
    case 'ms':
      ms = time[0];
      break;
    case 's':
      ms = time[0] * 1000;
      break;
    case 'min':
      ms = time[0] * 1000 * 60;
      break;
    case 'h':
      ms = time[0] * 1000 * 60 * 60;
      break;
    case 'd':
      ms = time[0] * 1000 * 60 * 60 * 24;
      break;
  }
  switch (targetUnit) {
    case 'ms':
      return ms;
    case 's':
      return fmt(ms / 1000);
    case 'min':
      return fmt(ms / 1000 / 60);
    case 'h':
      return fmt(ms / 1000 / 60 / 60);
    case 'd':
      return fmt(ms / 1000 / 60 / 60 / 24);
  }
  return -1;
}

function normalizeUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffsetMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absOffsetMinutes / 60);
  const minutes = absOffsetMinutes % 60;
  return `${sign}${preZeroFill(hours, 2)}:${preZeroFill(minutes, 2)}`;
}

function parseExplicitNumericUtcOffset(dateTime: string): number | null {
  const match = dateTime.match(EXPLICIT_NUMERIC_TIMEZONE_REGEXP);
  if (!match) {
    return null;
  }
  const [, sign, hourText, minuteText] = match;
  const offsetMinutes = Number(hourText) * 60 + Number(minuteText);
  return sign === '-' ? -offsetMinutes : offsetMinutes;
}

export function formatSrkContestTimeRange(
  startAt: srk.Contest['startAt'],
  duration: srk.Contest['duration'],
): IFormattedSrkContestTimeRange {
  const startAtMs = new Date(startAt).getTime();
  const durationMs = formatSrkTimeDuration(duration, 'ms');
  const endAtMs = startAtMs + durationMs;
  const offsetMinutes = parseExplicitNumericUtcOffset(startAt);
  const startDate = offsetMinutes === null ? dayjs(startAtMs) : dayjs(startAtMs).utcOffset(offsetMinutes);
  const endDate = offsetMinutes === null ? dayjs(endAtMs) : dayjs(endAtMs).utcOffset(offsetMinutes);

  return {
    startText: startDate.format('YYYY-MM-DD HH:mm:ss'),
    endText: endDate.format('YYYY-MM-DD HH:mm:ss Z'),
    timezoneSource: offsetMinutes === null ? 'browser' : 'srk-offset',
    sourceOffset: offsetMinutes === null ? undefined : normalizeUtcOffset(offsetMinutes),
  };
}

export function preZeroFill(num: number, size: number): string {
  if (num >= Math.pow(10, size)) {
    return num.toString();
  } else {
    let str = Array(size + 1).join('0') + num;
    return str.slice(str.length - size);
  }
}

/**
 * format seconds to time string
 * @param {number} second
 * @param {boolean} showDay
 * @returns {string}
 */
export function secToTimeStr(second: number, showDay = false): string {
  let sec = second;
  let d = 0;
  if (showDay) {
    d = Math.floor(sec / 86400);
    sec %= 86400;
  }
  let h = Math.floor(sec / 3600);
  sec %= 3600;
  let m = Math.floor(sec / 60);
  sec %= 60;
  let s = Math.floor(sec);
  let str_d = '';
  if (showDay && d >= 1) {
    str_d = d + 'D ';
  }
  if (sec < 0) {
    return '--';
  }
  return str_d + preZeroFill(h, 2) + ':' + preZeroFill(m, 2) + ':' + preZeroFill(s, 2);
}
