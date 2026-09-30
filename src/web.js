import fs from 'node:fs';
import path from 'node:path';
import express from 'express';

const IMMUTABLE = 'public, max-age=31536000, immutable';

/**
 * Serves the built frontend (the Frontend's `dist/` folder) from the API's own origin, so one
 * process and one address run the whole app and the browser needs no CORS.
 *  - `assets/*` files carry a content hash in their names, so browsers may keep them for a year.
 *  - Everything else, index.html above all, is revalidated on every load, so a new release shows
 *    up on the next page load.
 *  - Unknown page paths ("/sales-orders/…") get index.html; the app's router takes over there.
 *    Paths with a file extension and /api or /health paths fall through to the JSON 404.
 */
export function webApp(distDir) {
  const root = path.resolve(distDir);
  const indexFile = path.join(root, 'index.html');
  if (!fs.existsSync(indexFile)) {
    throw new Error(`WEB_DIST_DIR has no index.html (${root}). Run "npm run build" in the Frontend first.`);
  }
  const assetsDir = path.join(root, 'assets') + path.sep;

  const router = express.Router();
  router.use(
    express.static(root, {
      index: false,
      setHeaders: (res, file) => {
        res.setHeader('Cache-Control', file.startsWith(assetsDir) ? IMMUTABLE : 'no-cache');
      }
    })
  );
  router.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api/') || req.path.startsWith('/health')) return next();
    if (path.extname(req.path) || !req.accepts('html')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });
  return router;
}
