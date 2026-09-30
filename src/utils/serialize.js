import Decimal from 'decimal.js';

// Internal fields that must never leave the API, even if a query forgets to project them out.
const HIDDEN_KEYS = new Set(['passwordHash', 'lockVersion']);

/**
 * Converts documents into JSON-safe values:
 *  - Decimal128 / Decimal.js -> exact decimal string (never a float)
 *  - ObjectId -> 24-char hex string
 *  - Date -> ISO string
 */
export function serialize(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(serialize);
  if (value instanceof Date) return value.toISOString();
  if (Decimal.isDecimal(value)) return value.toString();
  if (typeof value !== 'object') return value;

  const bsonType = value._bsontype;
  if (bsonType === 'Decimal128') return value.toString();
  if (bsonType === 'ObjectId' || bsonType === 'ObjectID') return value.toHexString();

  const source = typeof value.toObject === 'function' ? value.toObject() : value;
  const out = {};
  for (const [key, val] of Object.entries(source)) {
    if (HIDDEN_KEYS.has(key)) continue;
    out[key] = serialize(val);
  }
  return out;
}
