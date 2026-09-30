import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'metalix-web-'));
fs.mkdirSync(path.join(dist, 'assets'));
fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>Metalix</title>');
fs.writeFileSync(path.join(dist, 'assets', 'index-abc123.js'), 'console.log(1)');
fs.writeFileSync(path.join(dist, 'theme-init.js'), '/* theme */');

const app = createApp({ webDistDir: dist });

afterAll(() => fs.rmSync(dist, { recursive: true, force: true }));

describe('serving the built frontend', () => {
  it('serves index.html for the app root and for deep links, never cached', async () => {
    for (const url of ['/', '/sales-orders/64f000000000000000000001?edit=true']) {
      const res = await request(app).get(url).set('Accept', 'text/html');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.headers['cache-control']).toBe('no-cache');
      expect(res.text).toContain('<title>Metalix</title>');
    }
  });

  it('caches hashed assets for a year and revalidates other files', async () => {
    const asset = await request(app).get('/assets/index-abc123.js');
    expect(asset.status).toBe(200);
    expect(asset.headers['cache-control']).toBe('public, max-age=31536000, immutable');

    const theme = await request(app).get('/theme-init.js');
    expect(theme.status).toBe(200);
    expect(theme.headers['cache-control']).toBe('no-cache');
  });

  it('keeps the JSON 404 for missing files, API and health paths', async () => {
    const missing = await request(app).get('/assets/old-999.js').set('Accept', '*/*');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');

    // API paths are never answered with the page (this one needs a login first).
    const api = await request(app).get('/api/v1/nope').set('Accept', 'text/html');
    expect(api.headers['content-type']).toMatch(/application\/json/);
    expect(api.body.success).toBe(false);

    const live = await request(app).get('/health/live');
    expect(live.body).toEqual({ ok: true });
  });

  it('sends a script policy that allows only its own files and keeps plain-http LAN use working', async () => {
    const res = await request(app).get('/').set('Accept', 'text/html');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('refuses to start with a folder that has no build in it', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'metalix-empty-'));
    try {
      expect(() => createApp({ webDistDir: empty })).toThrow(/no index.html/);
    } finally {
      fs.rmSync(empty, { recursive: true, force: true });
    }
  });
});
