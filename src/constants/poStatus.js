// Persisted lifecycle state of a Sales PO.
export const PO_LIFECYCLE = Object.freeze({ ACTIVE: 'ACTIVE', CANCELLED: 'CANCELLED' });

// Display status is derived from lifecycle + delivered quantity; it is never stored.
export const PO_DISPLAY_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PARTIALLY_SUPPLIED: 'PARTIALLY_SUPPLIED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
});
