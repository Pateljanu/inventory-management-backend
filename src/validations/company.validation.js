import { z } from 'zod';
import { COMPANY_TYPES } from '../constants/companyTypes.js';
import { empty, idParams, nonEmptyPatch, optionalText, paginationQuery, queryBoolean } from './common.js';
import { normalizeCode } from '../utils/normalize.js';

// Indian GSTIN: 2-digit state code, PAN (5 letters, 4 digits, 1 letter), entity code, 'Z', checksum.
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// Empty string means "clear this value" on update.
const gstNumber = z
  .string()
  .transform((v) => normalizeCode(v))
  .refine((v) => v === '' || GSTIN.test(v), 'Invalid GST number format (expected e.g. 24AAACA1234A1Z5)');

const contact = z.object({
  person: optionalText(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[\d\s+()-]*$/, 'Phone may contain digits, spaces and + ( ) - only')
    .optional(),
  email: z.union([z.string().trim().email(), z.literal('')]).optional()
});

const body = z.object({
  name: z.string().trim().min(2).max(120),
  contact: contact.optional(),
  address: optionalText(500),
  gstNumber: gstNumber.optional(),
  type: z.enum(Object.values(COMPANY_TYPES)),
  isActive: z.boolean().optional()
});

export const companyCreateSchema = z.object({ body, params: empty, query: empty });

export const companyUpdateSchema = z.object({ body: nonEmptyPatch(body), params: idParams, query: empty });

export const companyGetSchema = z.object({ body: empty, params: idParams, query: empty });

export const companyListSchema = z.object({
  body: empty,
  params: empty,
  query: paginationQuery.extend({
    search: z.string().trim().max(100).optional(),
    type: z.enum(Object.values(COMPANY_TYPES)).optional(),
    // Convenience for dropdowns: "purchase" => PURCHASE+BOTH, "sale" => SALE+BOTH.
    usage: z.enum(['purchase', 'sale']).optional(),
    isActive: queryBoolean.optional()
  })
});
