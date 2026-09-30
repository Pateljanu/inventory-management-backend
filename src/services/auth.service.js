import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { userRepository } from '../repositories/user.repository.js';

export const JWT_ISSUER = 'metal-scrap-api';
export const JWT_ALGORITHM = 'HS256';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

// Verifying against a fixed dummy hash when the email is unknown keeps response time the same
// for "no such user" and "wrong password", so login timing cannot be used to discover accounts.
let dummyHashPromise;
const dummyHash = () => (dummyHashPromise ??= argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id }));

const publicUser = (user) => ({ id: user._id, email: user.email, name: user.name, role: user.role });

function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: user._id.toString(),
    expiresIn: env.JWT_ACCESS_TTL,
    issuer: JWT_ISSUER,
    algorithm: JWT_ALGORITHM
  });
}

/** Refresh tokens are opaque random values; only their SHA-256 hash is stored. */
async function issueRefreshToken(userId, context = {}) {
  const token = randomBytes(48).toString('base64url');
  await RefreshSession.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
    userAgent: context.userAgent?.slice(0, 300),
    ip: context.ip
  });
  return token;
}

export const authService = {
  async login(email, password, context) {
    const user = await userRepository.findActiveByEmailWithPassword(email);
    const valid = user
      ? await argon2.verify(user.passwordHash, password)
      : await argon2.verify(await dummyHash(), password);
    if (!user || !valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

    return {
      accessToken: signAccessToken(user),
      refreshToken: await issueRefreshToken(user._id, context),
      tokenType: 'Bearer',
      expiresIn: env.JWT_ACCESS_TTL,
      user: publicUser(user)
    };
  },

  /** Rotating refresh: the presented session is consumed atomically and replaced by a new one. */
  async refresh(rawToken, context) {
    const session = await RefreshSession.findOneAndDelete({
      tokenHash: hashToken(rawToken),
      expiresAt: { $gt: new Date() }
    });
    if (!session) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');

    const user = await userRepository.findById(session.userId, { lean: true });
    if (!user?.isActive) {
      await RefreshSession.deleteMany({ userId: session.userId });
      throw new AppError(401, 'UNAUTHENTICATED', 'User is inactive');
    }

    return {
      accessToken: signAccessToken(user),
      refreshToken: await issueRefreshToken(user._id, context),
      tokenType: 'Bearer',
      expiresIn: env.JWT_ACCESS_TTL
    };
  },

  async logout(rawToken) {
    await RefreshSession.deleteOne({ tokenHash: hashToken(rawToken) });
  },

  async me(userId) {
    const user = await userRepository.findById(userId, { lean: true });
    if (!user?.isActive) throw new AppError(401, 'UNAUTHENTICATED', 'User is inactive or missing');
    return publicUser(user);
  }
};
