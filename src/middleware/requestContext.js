import { randomUUID } from 'node:crypto';

// Only accept a caller-supplied id if it is short and log-safe; otherwise generate one.
const SAFE_REQUEST_ID = /^[\w.-]{1,100}$/;

export function requestContext(req, res, next) {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
}
