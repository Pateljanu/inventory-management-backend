import { describe, expect, it } from 'vitest';
import { autoBucket, bucketRanges, parseBusinessDate, toDateOnlyString } from '../../src/utils/date.js';

const d = parseBusinessDate;
const show = (buckets) => buckets.map((b) => `${toDateOnlyString(b.start)}..${toDateOnlyString(b.end)}`);

describe('bucketRanges', () => {
  it('splits a month into Monday-Sunday weeks clipped to the range', () => {
    // 1 Sep 2026 is a Tuesday.
    expect(show(bucketRanges(d('2026-09-01'), d('2026-09-27'), 'week'))).toEqual([
      '2026-09-01..2026-09-06',
      '2026-09-07..2026-09-13',
      '2026-09-14..2026-09-20',
      '2026-09-21..2026-09-27'
    ]);
  });

  it('makes one bucket per day, and calendar months clipped at both ends', () => {
    expect(show(bucketRanges(d('2026-09-28'), d('2026-09-30'), 'day'))).toEqual([
      '2026-09-28..2026-09-28',
      '2026-09-29..2026-09-29',
      '2026-09-30..2026-09-30'
    ]);
    expect(show(bucketRanges(d('2026-04-15'), d('2026-06-10'), 'month'))).toEqual([
      '2026-04-15..2026-04-30',
      '2026-05-01..2026-05-31',
      '2026-06-01..2026-06-10'
    ]);
  });

  it('handles a single day and a week that ends on Sunday', () => {
    expect(show(bucketRanges(d('2026-09-28'), d('2026-09-28'), 'week'))).toEqual(['2026-09-28..2026-09-28']);
    expect(show(bucketRanges(d('2026-09-21'), d('2026-09-27'), 'week'))).toEqual(['2026-09-21..2026-09-27']);
  });
});

describe('autoBucket', () => {
  it('uses days up to two weeks, weeks up to ~3 months, then months', () => {
    expect(autoBucket(d('2026-09-21'), d('2026-09-27'))).toBe('day');
    expect(autoBucket(d('2026-09-01'), d('2026-09-30'))).toBe('week');
    expect(autoBucket(d('2026-04-01'), d('2027-03-31'))).toBe('month');
  });
});
