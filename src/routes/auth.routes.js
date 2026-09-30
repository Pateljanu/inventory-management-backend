import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/authRateLimiter.js';
import { loginSchema, refreshSchema } from '../validations/auth.validation.js';
import { login, refresh, logout, me } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(login));
router.post('/refresh', authRateLimiter, validate(refreshSchema), asyncHandler(refresh));
router.post('/logout', validate(refreshSchema), asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(me));

export default router;
