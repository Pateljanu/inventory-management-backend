import rateLimit from 'express-rate-limit';
import { rateLimitHandler } from './rateLimitHandler.js';

// Only failed attempts count, so a legitimate user logging in repeatedly is never locked out,
// while password guessing is capped at 10 failures per 15 minutes per client IP.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler('TOO_MANY_AUTH_ATTEMPTS', 'Too many authentication attempts. Try again later.')
});
