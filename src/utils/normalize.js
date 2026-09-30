/** Trims and collapses internal whitespace; used for display values. */
export function normalizeText(value = '') {
  return String(value).trim().replace(/\s+/g, ' ');
}

/** Case-insensitive identity key for names (company/material uniqueness). */
export function normalizeKey(value = '') {
  return normalizeText(value).toLowerCase();
}

/** Uppercase, whitespace-free key for codes (invoice/PO/challan/vehicle/GST numbers). */
export function normalizeCode(value = '') {
  return normalizeText(value).replace(/\s+/g, '').toUpperCase();
}

/** Escapes user input before it is used inside a MongoDB $regex. */
export function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function searchRegex(value) {
  return { $regex: escapeRegex(normalizeText(value)), $options: 'i' };
}
