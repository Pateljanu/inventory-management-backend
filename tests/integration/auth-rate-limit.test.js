import { describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/db.js';
import { app, createUser, request, PASSWORD } from '../helpers/api.js';

// Separate file: the login limiter's in-memory counter is per module instance, so this test
// must not share it with the other auth tests.
useTestDatabase();

describe('login rate limiting', () => {
  it('blocks after 10 failed attempts but does not count successful logins', async () => {
    await createUser();
    const attempt = (password) =>
      request(app).post('/api/v1/auth/login').send({ email: 'owner@example.com', password });

    for (let i = 0; i < 5; i++) expect((await attempt(PASSWORD)).status).toBe(200);
    for (let i = 0; i < 10; i++) expect((await attempt('wrong-password')).status).toBe(401);

    const blocked = await attempt(PASSWORD);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_AUTH_ATTEMPTS');
    expect(blocked.body.error.requestId).toBeTruthy();
  });
});
