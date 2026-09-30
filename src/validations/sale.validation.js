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
  withDateRange
} from './common.js';

// Customer companyId, materialId, selling rate and totalAmount are deliberately absent: the
// backend derives them from the selected PO. Unknown fields are stripped, never trusted.
const body = z.object({
  saleDate: businessDate,
  poId: objectId,
  // Purchase-side company whose Company + Material stock pool this delivery consumes.
  sourceCompanyId: objectId,
  quantityTons,
  vehicleNumber: optionalCode(30),
  challanNumber: optionalCode(80),
  notes: optionalText(1000)
});

export const saleCreateSchema = z.object({ body, params: empty, query: empty });

export const saleUpdateSchema = z.object({ body: nonEmptyPatch(body), params: idParams, query: empty });

export const saleGetSchema = z.object({ body: empty, params: idParams, query: empty });

export const saleListSchema = z.object({
  body: empty,
  params: empty,
  query: withDateRange(
    paginationQuery.extend({
      companyId: objectId.optional(),
      sourceCompanyId: objectId.optional(),
      materialId: objectId.optional(),
      poId: objectId.optional(),
      from: businessDate.optional(),
      to: businessDate.optional(),
      search: z.string().trim().max(100).optional()
    })
  )
});

/** Live limits for the delivery form; excludeSaleId is the delivery being edited. */
export const saleCapacitySchema = z.object({
  body: empty,
  params: empty,
  query: z.object({
    poId: objectId,
    saleDate: businessDate,
    sourceCompanyId: objectId.optional(),
    excludeSaleId: objectId.optional()
  })
});
