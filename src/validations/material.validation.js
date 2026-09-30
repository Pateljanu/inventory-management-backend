import { z } from 'zod';
import {
  empty,
  idParams,
  nonEmptyPatch,
  nonNegativeQuantityTons,
  optionalText,
  paginationQuery,
  queryBoolean
} from './common.js';

const body = z.object({
  name: z.string().trim().min(2).max(120),
  openingStockTons: nonNegativeQuantityTons.optional(),
  notes: optionalText(1000),
  isActive: z.boolean().optional()
});

export const materialCreateSchema = z.object({ body, params: empty, query: empty });

export const materialUpdateSchema = z.object({ body: nonEmptyPatch(body), params: idParams, query: empty });

export const materialGetSchema = z.object({ body: empty, params: idParams, query: empty });

export const materialListSchema = z.object({
  body: empty,
  params: empty,
  query: paginationQuery.extend({
    search: z.string().trim().max(100).optional(),
    isActive: queryBoolean.optional()
  })
});
