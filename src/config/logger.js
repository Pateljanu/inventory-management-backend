import pino from 'pino';
import { env } from './env.js';

// Pretty output is a local convenience only; production emits raw JSON for log shipping.
const transport =
  env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined;

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'metal-scrap-api', env: env.NODE_ENV },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'refreshToken',
      'accessToken',
      '*.password',
      '*.passwordHash',
      '*.refreshToken',
      '*.accessToken'
    ],
    censor: '[REDACTED]'
  },
  transport
});
