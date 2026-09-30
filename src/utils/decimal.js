import Decimal from 'decimal.js';
import mongoose from 'mongoose';

// 34 significant digits matches Decimal128 precision.
Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

export const QTY_SCALE = 3;
export const RATE_SCALE = 2;
export const MONEY_SCALE = 2;

/** Converts string | number | Decimal128 | Decimal | null into a Decimal. */
export function D(value = 0) {
  if (value == null) return new Decimal(0);
  if (Decimal.isDecimal(value)) return value;
  return new Decimal(typeof value === 'object' ? value.toString() : value);
}

export const qty = (value) => D(value).toDecimalPlaces(QTY_SCALE).toFixed(QTY_SCALE);
export const money = (value) => D(value).toDecimalPlaces(MONEY_SCALE).toFixed(MONEY_SCALE);
export const rate = (value) => D(value).toDecimalPlaces(RATE_SCALE).toFixed(RATE_SCALE);

/** quantity x rate, rounded half-up to money scale. */
export const amountFrom = (quantityTons, ratePerTon) => money(D(quantityTons).mul(D(ratePerTon)));

/** Builds a Decimal128 with a fixed scale so stored values are uniform (e.g. "30.250"). */
export const d128 = (value, scale = QTY_SCALE) => mongoose.Types.Decimal128.fromString(D(value).toFixed(scale));

export const maxZero = (value) => (D(value).isNegative() ? D(0) : D(value));

export { Decimal };
