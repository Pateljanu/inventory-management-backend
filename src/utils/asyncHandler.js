// Express 5 forwards rejected promises natively; this wrapper keeps the contract explicit and
// portable if a handler is ever mounted somewhere that does not.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
