import { D, Decimal, QTY_SCALE } from './decimal.js';

/**
 * The most that may be delivered against an order: its tons plus its tolerance, rounded down to
 * the quantity scale so the limit never exceeds what the percentage allows. A missing tolerance
 * means none, so orders saved before tolerance existed keep their exact limit.
 */
export function maxDeliverableTons(quantityTons, tolerancePercent) {
  return D(quantityTons)
    .mul(D(1).plus(D(tolerancePercent).div(100)))
    .toDecimalPlaces(QTY_SCALE, Decimal.ROUND_DOWN);
}
