import { describe, expect, it } from 'vitest';
import { D } from '../../src/utils/decimal.js';
import { parseBusinessDate } from '../../src/utils/date.js';
import { headroomFrom } from '../../src/services/stock.service.js';

const day = (value) => parseBusinessDate(value);
const moves = (...rows) => rows.map(([date, total]) => ({ date: day(date), total: D(total) }));

describe('headroomFrom', () => {
  it('is the stock as of the date when nothing happens later', () => {
    const inflows = moves(['2026-09-01', '20'], ['2026-09-05', '10']);
    const outflows = moves(['2026-09-03', '4']);
    expect(headroomFrom('0', inflows, outflows, day('2026-09-10')).toFixed(3)).toBe('26.000');
  });

  it('is capped by the lowest later balance, so a backdated delivery cannot starve a later one', () => {
    // 20 in on the 1st, 15 out on the 20th: on the 10th there are 20 t, but only 5 t can go.
    const inflows = moves(['2026-09-01', '20']);
    const outflows = moves(['2026-09-20', '15']);
    expect(headroomFrom('0', inflows, outflows, day('2026-09-10')).toFixed(3)).toBe('5.000');
  });

  it('lets later purchases lift the limit again only for days after them', () => {
    const inflows = moves(['2026-09-01', '20'], ['2026-09-25', '50']);
    const outflows = moves(['2026-09-20', '15'], ['2026-09-26', '40']);
    // After the 10th: 20 -> 5 (20th) -> 55 (25th) -> 15 (26th). Lowest is 5.
    expect(headroomFrom('0', inflows, outflows, day('2026-09-10')).toFixed(3)).toBe('5.000');
    // After the 22nd: 5 -> 55 -> 15. Lowest is 5 (the balance on the 22nd itself).
    expect(headroomFrom('0', inflows, outflows, day('2026-09-22')).toFixed(3)).toBe('5.000');
    // After the 25th: 55 -> 15.
    expect(headroomFrom('0', inflows, outflows, day('2026-09-25')).toFixed(3)).toBe('15.000');
  });

  it('counts movements on the date itself and includes opening stock', () => {
    const inflows = moves(['2026-09-10', '8']);
    const outflows = moves(['2026-09-10', '3']);
    expect(headroomFrom('2.5', inflows, outflows, day('2026-09-10')).toFixed(3)).toBe('7.500');
    expect(headroomFrom('2.5', inflows, outflows, day('2026-09-09')).toFixed(3)).toBe('2.500');
  });
});
