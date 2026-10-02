import { z } from 'zod';
import { parseBusinessDate } from '../utils/date.js';
import { QTY_SCALE, RATE_SCALE } from '../utils/decimal.js';
import { MAX_PO_TOLERANCE_PERCENT } from '../constants/poStatus.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/** Calendar date "YYYY-MM-DD", converted to a UTC-midnight Date. */
export const businessDate = z.string().transform((value, ctx) => {
  const date = parseBusinessDate(value);
  if (!date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Date must be a valid YYYY-MM-DD calendar date' });
    return z.NEVER;
  }
  return date;
});

/**
 * Exact decimal input. Accepts a string ("30.250") or a JSON number (30.25) but never
 * lets it pass through floating point arithmetic: the value is kept as a string for Decimal.js.
 */
function decimal(scale, { allowZero }) {
  const pattern = new RegExp(`^\\d{1,12}(\\.\\d{1,${scale}})?$`);
  return z
    .union([z.string().trim(), z.number()])
    .transform(String)
    .refine((v) => pattern.test(v), `Must be a non-negative number with at most ${scale} decimal places`)
    .refine((v) => allowZero || Number(v) > 0, 'Must be greater than zero');
}

export const quantityTons = decimal(QTY_SCALE, { allowZero: false });
export const nonNegativeQuantityTons = decimal(QTY_SCALE, { allowZero: true });
export const ratePerTon = decimal(RATE_SCALE, { allowZero: false });
/** Order tolerance in percent, 0 to MAX_PO_TOLERANCE_PERCENT, at most 2 decimals. */
export const tolerancePercent = decimal(RATE_SCALE, { allowZero: true }).refine(
  (v) => Number(v) <= MAX_PO_TOLERANCE_PERCENT,
  `Must be ${MAX_PO_TOLERANCE_PERCENT}% or less`
);

export const optionalText = (max = 1000) => z.string().trim().max(max).optional();

/** Query-string boolean: only "true"/"false" (z.coerce.boolean would turn "false" into true). */
export const queryBoolean = z.enum(['true', 'false']).transform((v) => v === 'true');

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

export const empty = z.object({});
export const idParams = z.object({ id: objectId });

/** Optional code-like text; an empty string means "clear this value" on update. */
export const optionalCode = (max) => z.string().trim().max(max).optional();

/** Adds the from <= to rule to a query schema that has optional `from`/`to` business dates. */
export const withDateRange = (querySchema) =>
  querySchema.refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '`from` must be on or before `to`',
    path: ['to']
  });

/** A PATCH body must change at least one field. */
export const nonEmptyPatch = (schema) =>
  schema.partial().refine((v) => Object.keys(v).length > 0, 'At least one field must be provided');
