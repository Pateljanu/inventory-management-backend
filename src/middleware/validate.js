import { AppError } from '../errors/AppError.js';

/**
 * Validates body/params/query against a Zod schema shaped { body, params, query }.
 * Controllers read only req.validated, so unvalidated input never reaches services.
 */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({ body: req.body ?? {}, params: req.params ?? {}, query: req.query ?? {} });
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
    return next(new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', { issues }));
  }
  req.validated = result.data;
  next();
};
