import request from 'supertest';
import argon2 from 'argon2';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { ROLES } from '../../src/constants/roles.js';

export const app = createApp();
export const PASSWORD = 'Test-Password-2026';

export async function createUser({
  email = 'owner@example.com',
  role = ROLES.OWNER,
  isActive = true,
  password = PASSWORD
} = {}) {
  return User.create({ email, role, isActive, passwordHash: await argon2.hash(password) });
}

export async function login(email = 'owner@example.com', password = PASSWORD) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data;
}

/** Creates a user, logs in, and returns a tiny authenticated client. */
export async function authedClient(options = {}) {
  const user = await createUser(options);
  const { accessToken } = await login(user.email, options.password);
  const withAuth = (req) => req.set('Authorization', `Bearer ${accessToken}`);
  return {
    user,
    accessToken,
    get: (url) => withAuth(request(app).get(url)),
    post: (url, body) => withAuth(request(app).post(url)).send(body),
    patch: (url, body) => withAuth(request(app).patch(url)).send(body)
  };
}

export { request };
