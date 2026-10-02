import { describe, expect, it } from 'vitest';
import { maxDeliverableTons, tolerancePercentOf } from '../../src/utils/poTolerance.js';

describe('order tolerance', () => {
  it("uses the order's own tolerance when it has one", () => {
    expect(tolerancePercentOf('5.00', 10).toFixed(2)).toBe('5.00');
    expect(tolerancePercentOf('0.00', 10).toFixed(2)).toBe('0.00');
  });

  it('falls back to the default for orders saved without one', () => {
    expect(tolerancePercentOf(undefined, 10).toFixed(2)).toBe('10.00');
    expect(tolerancePercentOf(null, 10).toFixed(2)).toBe('10.00');
  });

  it('allows ordered + tolerance, rounded down to 3 decimals', () => {
    expect(maxDeliverableTons('20', undefined, 10).toFixed(3)).toBe('22.000');
    expect(maxDeliverableTons('30', '5', 10).toFixed(3)).toBe('31.500');
    expect(maxDeliverableTons('10.333', '5', 10).toFixed(3)).toBe('10.849');
  });
});
