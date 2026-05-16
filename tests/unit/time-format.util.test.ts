import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import dayjs from 'dayjs';
import {
  formatSrkContestTimeRange,
  formatSrkTimeDuration,
  preZeroFill,
  secToTimeStr,
} from '@/utils/time-format.util';

describe('formatSrkTimeDuration', () => {
  it('passes through ms when targetUnit=ms', () => {
    expect(formatSrkTimeDuration([1500, 'ms'])).toBe(1500);
  });

  it('converts s -> ms by default', () => {
    expect(formatSrkTimeDuration([2, 's'])).toBe(2000);
  });

  it('converts min -> ms', () => {
    expect(formatSrkTimeDuration([3, 'min'])).toBe(3 * 60 * 1000);
  });

  it('converts h -> ms', () => {
    expect(formatSrkTimeDuration([1, 'h'])).toBe(60 * 60 * 1000);
  });

  it('converts d -> ms', () => {
    expect(formatSrkTimeDuration([1, 'd'])).toBe(24 * 60 * 60 * 1000);
  });

  it('converts h -> min', () => {
    expect(formatSrkTimeDuration([2, 'h'], 'min')).toBe(120);
  });

  it('converts min -> s', () => {
    expect(formatSrkTimeDuration([2, 'min'], 's')).toBe(120);
  });

  it('converts ms -> s with custom fmt (rounding)', () => {
    expect(formatSrkTimeDuration([1234, 'ms'], 's', Math.round)).toBe(1);
  });

  it('converts h -> d', () => {
    expect(formatSrkTimeDuration([24, 'h'], 'd')).toBe(1);
  });

  it('returns -1 for invalid input unit', () => {
    expect(formatSrkTimeDuration([1, 'unknown' as srk.TimeUnit])).toBe(-1);
  });
});

describe('preZeroFill', () => {
  it('pads numbers shorter than the size', () => {
    expect(preZeroFill(3, 2)).toBe('03');
    expect(preZeroFill(7, 4)).toBe('0007');
  });

  it('returns the raw string when number is at or larger than size', () => {
    expect(preZeroFill(12, 2)).toBe('12');
    expect(preZeroFill(123, 2)).toBe('123');
    expect(preZeroFill(12345, 3)).toBe('12345');
  });

  it('handles zero', () => {
    expect(preZeroFill(0, 2)).toBe('00');
  });
});

describe('secToTimeStr', () => {
  it('formats h:mm:ss for positive values', () => {
    expect(secToTimeStr(3661)).toBe('01:01:01');
    expect(secToTimeStr(0)).toBe('00:00:00');
  });

  it('truncates seconds via Math.floor', () => {
    expect(secToTimeStr(59.9)).toBe('00:00:59');
  });

  it('shows day prefix when showDay=true and >=1 day', () => {
    expect(secToTimeStr(2 * 86400 + 3 * 3600 + 4 * 60 + 5, true)).toBe('2D 03:04:05');
  });

  it('omits day prefix when showDay=true but <1 day', () => {
    expect(secToTimeStr(3661, true)).toBe('01:01:01');
  });

  it('returns -- for negative seconds', () => {
    expect(secToTimeStr(-1)).toBe('--');
  });
});

describe('formatSrkContestTimeRange', () => {
  it('uses the explicit numeric offset declared by the srk startAt value', () => {
    const range = formatSrkContestTimeRange('2026-05-10T11:00:00+08:00', [5, 'h']);

    expect(range.timezoneSource).toBe('srk-offset');
    expect(range.sourceOffset).toBe('+08:00');
    expect(range.startText).toBe('2026-05-10 11:00:00');
    expect(range.endText).toBe('2026-05-10 16:00:00 +08:00');
  });

  it('treats Z suffix as unspecified and keeps browser-local formatting semantics', () => {
    const startAt = '2026-05-10T03:00:00Z';
    const startAtMs = new Date(startAt).getTime();
    const endAtMs = startAtMs + 5 * 60 * 60 * 1000;
    const range = formatSrkContestTimeRange(startAt, [5, 'h']);

    expect(range.timezoneSource).toBe('browser');
    expect(range.sourceOffset).toBeUndefined();
    expect(range.startText).toBe(dayjs(startAtMs).format('YYYY-MM-DD HH:mm:ss'));
    expect(range.endText).toBe(dayjs(endAtMs).format('YYYY-MM-DD HH:mm:ss Z'));
  });
});
