import mongoose from 'mongoose';
import { AppError } from '../errors/AppError.js';
import { logger } from '../config/logger.js';

function translate(err) {
  if (err instanceof AppError) return err;
  if (err?.code === 11000) {
    return new AppError(409, 'DUPLICATE_VALUE', 'A record with the same unique value already exists', {
      fields: Object.keys(err.keyValue || err.keyPattern || {})
    });
  }
  if (err instanceof mongoose.Error.CastError) return new AppError(400, 'INVALID_ID', `Invalid value for ${err.path}`);
  if (err instanceof mongoose.Error.ValidationError) {
    const issues = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return new AppError(422, 'VALIDATION_ERROR', 'Document validation failed', { issues });
  }
  if (err?.type === 'entity.parse.failed') return new AppError(400, 'INVALID_JSON', 'Request body is not valid JSON');
  if (err?.type === 'entity.too.large') return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds 1 MB');
  return null;
}

export function errorHandler(err, req, res, _next) {
  const error = translate(err);
  const status = error ? error.statusCode : 500;
  const code = error ? error.code : 'INTERNAL_ERROR';
  const message = error ? error.message : 'Unexpected server error';

  // 4xx outcomes are already captured by the request log (with errorCode); only unexpected
  // failures get a dedicated entry with the full stack.
  res.locals.errorCode = code;
  if (status >= 500) logger.error({ requestId: req.id, method: req.method, url: req.originalUrl, err }, message);

  res.status(status).json({
    success: false,
    error: { code, message, ...(error?.details ? { details: error.details } : {}), requestId: req.id }
  });
}
