import { AppError } from '../errors/AppError.js';

export function notFound(req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
}
