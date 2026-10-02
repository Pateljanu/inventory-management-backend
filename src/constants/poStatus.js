// Persisted lifecycle state of a Sales PO.
export const PO_LIFECYCLE = Object.freeze({ ACTIVE: 'ACTIVE', CANCELLED: 'CANCELLED' });

// Display status is derived from lifecycle + delivered quantity; it is never stored.
export const PO_DISPLAY_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PARTIALLY_SUPPLIED: 'PARTIALLY_SUPPLIED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
});

// Share of an order's tons that may be delivered beyond it (an order of 30 t at 5% takes up to
// 31.5 t). Orders saved without one, or created without one through the API, allow none.
export const MAX_PO_TOLERANCE_PERCENT = 50;
