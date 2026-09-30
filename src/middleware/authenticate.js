import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { userRepository } from '../repositories/user.repository.js';
import { JWT_ALGORITHM, JWT_ISSUER } from '../services/auth.service.js';

/**
 * Verifies the Bearer access token and attaches req.user. The user is re-read on every request so
 * deactivating an account or changing its role takes effect immediately, not at token expiry.
 */
export async function authenticate(req, _res, next) {
  try {
    const [type, token] = (req.headers.authorization || '').split(' ');
    if (type !== 'Bearer' || !token) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: [JWT_ALGORITHM], issuer: JWT_ISSUER });
    const user = await userRepository.findById(payload.sub, { lean: true, select: '_id email name role isActive' });
    if (!user?.isActive) throw new AppError(401, 'UNAUTHENTICATED', 'User is inactive or missing');

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    const expired = error instanceof jwt.TokenExpiredError;
    next(
      new AppError(
        401,
        expired ? 'TOKEN_EXPIRED' : 'UNAUTHENTICATED',
        expired ? 'Access token has expired' : 'Invalid access token'
      )
    );
  }
}
