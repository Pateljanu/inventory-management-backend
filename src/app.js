import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { isDatabaseReady } from './config/database.js';
import routes from './routes/index.js';
import { requestContext } from './middleware/requestContext.js';
import { rateLimitHandler } from './middleware/rateLimitHandler.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { webApp } from './web.js';

/** @param {{ webDistDir?: string }} [options] serve the built frontend from this folder too */
export function createApp({ webDistDir = env.WEB_DIST_DIR } = {}) {
  const app = express();
  app.set('trust proxy', env.TRUST_PROXY);
  app.disable('x-powered-by');

  app.use(requestContext);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      autoLogging: { ignore: (req) => req.url.startsWith('/health') },
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      // errorHandler records the stable error code so each request produces one compact log line.
      customProps: (_req, res) => (res.locals?.errorCode ? { errorCode: res.locals.errorCode } : {}),
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url, remoteAddress: req.remoteAddress }),
        res: (res) => ({ statusCode: res.statusCode })
      }
    })
  );
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Helmet's default would force https for every file, which breaks the app when it is
          // opened over plain http on a local network. HTTPS deployments are unaffected.
          'upgrade-insecure-requests': null
        }
      }
    })
  );
  app.use(cors({ origin: env.corsOrigins, credentials: false, exposedHeaders: ['x-request-id'] }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));

  // Health endpoints sit before the rate limiter so orchestrator probes are never throttled.
  app.get('/health/live', (_req, res) => res.json({ ok: true }));
  app.get('/health/ready', (_req, res) => {
    const ready = isDatabaseReady();
    res.status(ready ? 200 : 503).json({ ok: ready, database: ready ? 'connected' : 'unavailable' });
  });

  // The web app's files are not API calls, so they sit before the rate limiter too.
  if (webDistDir) app.use(webApp(webDistDir));

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: env.RATE_LIMIT_PER_MINUTE,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: rateLimitHandler('TOO_MANY_REQUESTS', 'Too many requests. Slow down and try again shortly.')
    })
  );

  app.use('/api/v1', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
