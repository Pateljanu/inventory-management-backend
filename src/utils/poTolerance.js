import { env } from '../config/env.js';
import { D, Decimal, QTY_SCALE } from './decimal.js';

/**
 * The tolerance an order uses: its own when it has one, otherwise DEFAULT_PO_TOLERANCE_PERCENT.
 * Orders saved before tolerance existed have none stored, so they follow the default.
 */
export function tolerancePercentOf(stored, fallback = env.DEFAULT_PO_TOLERANCE_PERCENT) {
  return D(stored ?? fallback);
}

/**
 * The most that may be delivered against an order: its tons plus its tolerance, rounded down to
 * the quantity scale so the limit never exceeds what the percentage allows.
 */
export function maxDeliverableTons(quantityTons, tolerancePercent, fallback) {
  return D(quantityTons)
    .mul(D(1).plus(tolerancePercentOf(tolerancePercent, fallback).div(100)))
    .toDecimalPlaces(QTY_SCALE, Decimal.ROUND_DOWN);
}
