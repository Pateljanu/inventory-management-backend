import { beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { useTestDatabase } from '../helpers/db.js';
import { app, authedClient, createUser, login, request, PASSWORD } from '../helpers/api.js';
import { User } from '../../src/models/User.js';
import { RefreshSession } from '../../src/models/RefreshSession.js';
import { ROLES } from '../../src/constants/roles.js';

const clearDatabase = useTestDatabase();
beforeEach(clearDatabase);

const post = (url, body) => request(app).post(url).send(body);

describe('POST /auth/login', () => {
  it('returns access + refresh tokens and the user', async () => {
    await createUser({ email: 'Owner@Example.com' });
    const res = await post('/api/v1/auth/login', { email: 'OWNER@example.com', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ tokenType: 'Bearer', user: { email: 'owner@example.com', role: 'OWNER' } });
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken.length).toBeGreaterThanOrEqual(32);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await createUser();
    const wrong = await post('/api/v1/auth/login', { email: 'owner@example.com', password: 'wrong-password' });
    const unknown = await post('/api/v1/auth/login', { email: 'nobody@example.com', password: 'wrong-password' });
    for (const res of [wrong, unknown]) {
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    }
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('rejects inactive users', async () => {
    await createUser({ isActive: false });
    const res = await post('/api/v1/auth/login', { email: 'owner@example.com', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('validates the payload', async () => {
    const res = await post('/api/v1/auth/login', { email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.issues.map((i) => i.path)).toEqual(
      expect.arrayContaining(['body.email', 'body.password'])
    );
  });

  it('stores only a hash of the refresh token', async () => {
    await createUser();
    const { refreshToken } = await login();
    const sessions = await RefreshSession.find().lean();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).not.toBe(refreshToken);
    expect(sessions[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('access tokens', () => {
  it('GET /auth/me returns the current user', async () => {
    const client = await authedClient();
    const res = await client.get('/api/v1/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: 'owner@example.com', role: 'OWNER' });
    expect(res.body.data.id).toMatch(/^[a-f0-9]{24}$/);
  });

  it('rejects missing, malformed, forged and expired tokens', async () => {
    const user = await createUser();
    const sub = user._id.toString();
    const cases = {
      missing: undefined,
      garbage: 'Bearer not-a-jwt',
      wrongScheme: 'Basic abc',
      forged: `Bearer ${jwt.sign({ role: 'OWNER' }, 'x'.repeat(40), { subject: sub, issuer: 'metal-scrap-api' })}`,
      wrongIssuer: `Bearer ${jwt.sign({ role: 'OWNER' }, process.env.JWT_ACCESS_SECRET, { subject: sub, issuer: 'someone-else' })}`,
      unsigned: `Bearer ${jwt.sign({ role: 'OWNER', sub, iss: 'metal-scrap-api' }, null, { algorithm: 'none' })}`
    };
    for (const [name, header] of Object.entries(cases)) {
      const req = request(app).get('/api/v1/auth/me');
      const res = await (header ? req.set('Authorization', header) : req);
      expect(res.status, name).toBe(401);
    }

    const expired = jwt.sign({ role: 'OWNER' }, process.env.JWT_ACCESS_SECRET, {
      subject: sub,
      issuer: 'metal-scrap-api',
      expiresIn: -10
    });
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('stops accepting a token as soon as the user is deactivated', async () => {
    const client = await authedClient();
    await User.updateOne({ _id: client.user._id }, { isActive: false });
    const res = await client.get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('protects every business route', async () => {
    for (const url of ['/api/v1/companies', '/api/v1/materials']) {
      const res = await request(app).get(url);
      expect(res.status, url).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    }
  });
});

describe('refresh and logout', () => {
  it('rotates refresh tokens: the old one cannot be reused', async () => {
    await createUser();
    const first = await login();
    const rotated = await post('/api/v1/auth/refresh', { refreshToken: first.refreshToken });
    expect(rotated.status).toBe(200);
    expect(rotated.body.data.refreshToken).not.toBe(first.refreshToken);

    const reused = await post('/api/v1/auth/refresh', { refreshToken: first.refreshToken });
    expect(reused.status).toBe(401);
    expect(reused.body.error.code).toBe('INVALID_REFRESH_TOKEN');

    const next = await post('/api/v1/auth/refresh', { refreshToken: rotated.body.data.refreshToken });
    expect(next.status).toBe(200);
    expect(await RefreshSession.countDocuments()).toBe(1);
  });

  it('rejects expired refresh sessions', async () => {
    await createUser();
    const { refreshToken } = await login();
    await RefreshSession.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    const res = await post('/api/v1/auth/refresh', { refreshToken });
    expect(res.status).toBe(401);
  });

  it('revokes all sessions of a deactivated user on refresh', async () => {
    const user = await createUser();
    const a = await login();
    await login();
    await User.updateOne({ _id: user._id }, { isActive: false });
    const res = await post('/api/v1/auth/refresh', { refreshToken: a.refreshToken });
    expect(res.status).toBe(401);
    expect(await RefreshSession.countDocuments({ userId: user._id })).toBe(0);
  });

  it('logout revokes the refresh session', async () => {
    await createUser();
    const { refreshToken } = await login();
    const out = await post('/api/v1/auth/logout', { refreshToken });
    expect(out.status).toBe(200);
    const res = await post('/api/v1/auth/refresh', { refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('role-based access', () => {
  it('VIEWER can read but not write', async () => {
    const viewer = await authedClient({ email: 'viewer@example.com', role: ROLES.VIEWER });
    expect((await viewer.get('/api/v1/companies')).status).toBe(200);
    expect((await viewer.get('/api/v1/materials')).status).toBe(200);

    const create = await viewer.post('/api/v1/companies', { name: 'Blocked Co', type: 'SALE' });
    expect(create.status).toBe(403);
    expect(create.body.error.code).toBe('FORBIDDEN');
    expect((await viewer.post('/api/v1/materials', { name: 'Blocked' })).status).toBe(403);
  });
});
