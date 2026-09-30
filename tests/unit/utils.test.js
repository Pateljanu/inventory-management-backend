import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { D, amountFrom, d128, qty, maxZero } from '../../src/utils/decimal.js';
import { parseBusinessDate, endOfDayUTC, dateFilter, businessToday } from '../../src/utils/date.js';
import { normalizeKey, normalizeCode, normalizeText, escapeRegex } from '../../src/utils/normalize.js';
import { serialize } from '../../src/utils/serialize.js';
import { pagination } from '../../src/utils/pagination.js';

describe('decimal utilities', () => {
  it('calculates amount with exact half-up rounding', () => {
    expect(amountFrom('30.250', '39269.23')).toBe('1187894.21');
    expect(amountFrom('0.1', '0.2')).toBe('0.02');
    expect(amountFrom('1.005', '1')).toBe('1.01');
  });

  it('never goes through floating point', () => {
    expect(D('0.1').plus('0.2').toString()).toBe('0.3');
  });

  it('reads Decimal128 values and stores a fixed scale', () => {
    const stored = d128('30.25', 3);
    expect(stored.toString()).toBe('30.250');
    expect(D(stored).toFixed(3)).toBe('30.250');
    expect(qty(null)).toBe('0.000');
  });

  it('clamps negatives to zero', () => {
    expect(maxZero('-5').toFixed(3)).toBe('0.000');
    expect(maxZero('5').toFixed(3)).toBe('5.000');
  });
});

describe('date utilities', () => {
  it('parses calendar dates as UTC midnight', () => {
    expect(parseBusinessDate('2026-09-20').toISOString()).toBe('2026-09-20T00:00:00.000Z');
  });

  it('rejects impossible or malformed dates', () => {
    expect(parseBusinessDate('2026-02-30')).toBeNull();
    expect(parseBusinessDate('20-09-2026')).toBeNull();
    expect(parseBusinessDate('2026-09-20T10:00:00Z')).toBeNull();
  });

  it('uses the business time zone for "today"', () => {
    // 01:30 IST on Sept 27 is still Sept 26 in UTC.
    const now = new Date('2026-09-26T20:00:00Z');
    expect(businessToday('Asia/Kolkata', now).toISOString()).toBe('2026-09-27T00:00:00.000Z');
    expect(businessToday('UTC', now).toISOString()).toBe('2026-09-26T00:00:00.000Z');
  });

  it('builds inclusive day ranges', () => {
    const filter = dateFilter(new Date('2026-09-01'), new Date('2026-09-30'), 'saleDate');
    expect(filter.saleDate.$gte.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(filter.saleDate.$lte.toISOString()).toBe('2026-09-30T23:59:59.999Z');
    expect(endOfDayUTC('2026-09-30').toISOString()).toBe('2026-09-30T23:59:59.999Z');
  });
});

describe('normalization', () => {
  it('normalizes names, codes and text', () => {
    expect(normalizeText('  MS   Scrap  ')).toBe('MS Scrap');
    expect(normalizeKey('  MS   Scrap  ')).toBe('ms scrap');
    expect(normalizeCode(' inv - 102 ')).toBe('INV-102');
    expect(normalizeCode('gj01 ab 1234')).toBe('GJ01AB1234');
  });

  it('escapes regex metacharacters from search input', () => {
    expect(escapeRegex('a.b*(c)')).toBe('a\\.b\\*\\(c\\)');
  });
});

describe('serialize', () => {
  it('converts ObjectId, Decimal128, Date and Decimal to JSON-safe strings', () => {
    const id = new mongoose.Types.ObjectId();
    const out = serialize({
      _id: id,
      nested: { ref: id },
      quantityTons: d128('12.5', 3),
      when: new Date('2026-09-20T00:00:00Z'),
      computed: D('1.50'),
      list: [id]
    });
    expect(out).toEqual({
      _id: id.toHexString(),
      nested: { ref: id.toHexString() },
      quantityTons: '12.500',
      when: '2026-09-20T00:00:00.000Z',
      computed: '1.5',
      list: [id.toHexString()]
    });
  });

  it('never leaks internal fields', () => {
    expect(serialize({ email: 'a@b.c', passwordHash: 'x', lockVersion: 3 })).toEqual({ email: 'a@b.c' });
  });
});

describe('pagination', () => {
  it('defaults and caps page size', () => {
    expect(pagination({})).toEqual({ page: 1, limit: 25, skip: 0 });
    expect(pagination({ page: 3, limit: 500 })).toEqual({ page: 3, limit: 100, skip: 200 });
  });
});
