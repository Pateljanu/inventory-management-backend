import { z } from 'zod';
import { PO_DISPLAY_STATUS, PO_LIFECYCLE } from '../constants/poStatus.js';
import {
  businessDate,
  empty,
  idParams,
  nonEmptyPatch,
  objectId,
  optionalText,
  paginationQuery,
  quantityTons,
  ratePerTon,
  tolerancePercent,
  withDateRange
} from './common.js';

const body = z.object({
  poNumber: z.string().trim().min(1).max(80),
  poDate: businessDate,
  companyId: objectId,
  materialId: objectId,
  quantityTons,
  ratePerTon,
  tolerancePercent: tolerancePercent.optional(),
  lifecycleStatus: z.enum(Object.values(PO_LIFECYCLE)).optional(),
  notes: optionalText(1000)
});

export const salesPOCreateSchema = z.object({ body, params: empty, query: empty });

export const salesPOUpdateSchema = z.object({ body: nonEmptyPatch(body), params: idParams, query: empty });

export const salesPOSettleSchema = z.object({ body: empty, params: idParams, query: empty });

export const salesPOGetSchema = z.object({ body: empty, params: idParams, query: empty });

export const salesPOListSchema = z.object({
  body: empty,
  params: empty,
  query: withDateRange(
    paginationQuery.extend({
      companyId: objectId.optional(),
      materialId: objectId.optional(),
      lifecycleStatus: z.enum(Object.values(PO_LIFECYCLE)).optional(),
      // Derived status; one value or a comma-separated list, e.g. status=PENDING,PARTIALLY_SUPPLIED
      // for "open orders". Returned as a de-duplicated array.
      status: z
        .string()
        .transform((v) => [
          ...new Set(
            v
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          )
        ])
        .pipe(z.array(z.enum(Object.values(PO_DISPLAY_STATUS))).min(1))
        .optional(),
      from: businessDate.optional(),
      to: businessDate.optional(),
      search: z.string().trim().max(100).optional()
    })
  )
});
