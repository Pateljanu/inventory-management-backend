import { z } from 'zod';
import {
  businessDate,
  empty,
  idParams,
  nonEmptyPatch,
  objectId,
  optionalCode,
  optionalText,
  paginationQuery,
  quantityTons,
  ratePerTon,
  withDateRange
} from './common.js';

// totalAmount is deliberately absent: the backend always calculates it.
const body = z.object({
  purchaseDate: businessDate,
  companyId: objectId,
  materialId: objectId,
  quantityTons,
  ratePerTon,
  vehicleNumber: optionalCode(30),
  invoiceNumber: optionalCode(80),
  notes: optionalText(1000)
});

export const purchaseCreateSchema = z.object({ body, params: empty, query: empty });

export const purchaseUpdateSchema = z.object({ body: nonEmptyPatch(body), params: idParams, query: empty });

export const purchaseGetSchema = z.object({ body: empty, params: idParams, query: empty });

export const purchaseListSchema = z.object({
  body: empty,
  params: empty,
  query: withDateRange(
    paginationQuery.extend({
      companyId: objectId.optional(),
      materialId: objectId.optional(),
      from: businessDate.optional(),
      to: businessDate.optional(),
      search: z.string().trim().max(100).optional()
    })
  )
});

/** One supplier stock pool: the purchase company and the material. */
const pool = z.object({ companyId: objectId, materialId: objectId });

export const purchaseSettlePreviewSchema = z.object({ body: empty, params: empty, query: pool });

export const purchaseSettleSchema = z.object({ body: pool, params: empty, query: empty });
