import { describe, expect, it } from 'vitest';
import { formatTitle } from '@/utils/title-format.util';

describe('formatTitle', () => {
  it('returns only the site name when no title is provided', () => {
    expect(formatTitle()).toBe('RankLand');
    expect(formatTitle(undefined)).toBe('RankLand');
  });

  it('returns only the site name when title is empty string', () => {
    expect(formatTitle('')).toBe('RankLand');
  });

  it('joins title with site name using a separator', () => {
    expect(formatTitle('Foo')).toBe('Foo | RankLand');
    expect(formatTitle('Live: ICPC 2024')).toBe('Live: ICPC 2024 | RankLand');
  });
});
