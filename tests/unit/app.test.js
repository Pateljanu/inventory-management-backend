import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('application shell', () => {
  it('serves the liveness probe', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('reports not-ready when the database is not connected', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
  });

  it('assigns a request id and returns the standard error envelope for unknown routes', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.headers['x-request-id']).toBeTruthy();
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND', requestId: res.headers['x-request-id'] }
    });
  });

  it('reuses a safe caller-supplied request id and replaces an unsafe one', async () => {
    const safe = await request(app).get('/health/live').set('x-request-id', 'abc-123');
    expect(safe.headers['x-request-id']).toBe('abc-123');
    const unsafe = await request(app).get('/health/live').set('x-request-id', 'bad id <script>');
    expect(unsafe.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects malformed JSON with INVALID_JSON', async () => {
    const res = await request(app).post('/api/v1/anything').set('content-type', 'application/json').send('{"broken"');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('allows only allow-listed CORS origins (never a wildcard)', async () => {
    const allowed = await request(app)
      .options('/api/v1/companies')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const denied = await request(app)
      .options('/api/v1/companies')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/health/live');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
