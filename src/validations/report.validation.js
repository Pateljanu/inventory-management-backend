import { z } from 'zod';
import { businessDate, empty, idParams, objectId, withDateRange } from './common.js';

// from/to: activity period. `to` (default: today in the business time zone) is also the as-of
// cutoff for stock and PO positions.
const periodQuery = z.object({
  from: businessDate.optional(),
  to: businessDate.optional(),
  materialId: objectId.optional()
});

export const reportQuerySchema = z.object({
  body: empty,
  params: empty,
  query: withDateRange(periodQuery.extend({ companyId: objectId.optional() }))
});

export const companyReportSchema = z.object({
  body: empty,
  params: idParams,
  query: withDateRange(periodQuery)
});

export const sourceStockQuerySchema = z.object({
  body: empty,
  params: empty,
  query: z.object({
    asOf: businessDate.optional(),
    sourceCompanyId: objectId.optional(),
    materialId: objectId.optional()
  })
});

// A trend needs both ends; about ten years of months is the most a chart can show usefully.
export const trendQuerySchema = z.object({
  body: empty,
  params: empty,
  query: z
    .object({
      from: businessDate,
      to: businessDate,
      materialId: objectId.optional(),
      companyId: objectId.optional(),
      bucket: z.enum(['day', 'week', 'month']).optional()
    })
    .refine((q) => q.from <= q.to, { message: '`from` must be on or before `to`', path: ['to'] })
    .refine((q) => q.to - q.from <= 3660 * 86_400_000, {
      message: 'Choose a range of ten years or less',
      path: ['from']
    })
    .refine((q) => q.bucket !== 'day' || q.to - q.from <= 400 * 86_400_000, {
      message: 'Daily buckets need a range of 400 days or less',
      path: ['bucket']
    })
});
