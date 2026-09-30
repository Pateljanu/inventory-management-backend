import { serialize } from './serialize.js';

export function ok(res, data, meta = undefined, status = 200) {
  return res.status(status).json({ success: true, data: serialize(data), ...(meta ? { meta: serialize(meta) } : {}) });
}

export function created(res, data) {
  return ok(res, data, undefined, 201);
}
