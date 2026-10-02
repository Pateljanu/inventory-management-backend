import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  // Optional: database to use instead of the one named in MONGODB_URI. Set it only on a
  // developer machine (e.g. metal_scrap_dev) so local testing never touches live data, even
  // with the same Atlas connection string. Never set it on the live server.
  MONGODB_DB_NAME: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{1,63}$/, 'Letters, digits, _ and - only')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: z.coerce.number().int().nonnegative().default(0),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(300),
  // Optional: folder of the built frontend (Frontend/dist) to serve from this same address.
  WEB_DIST_DIR: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined),
  // Share an order's deliveries may go beyond its ordered tons when the order sets none itself
  // (an order of 20 t at 10% takes up to 22 t).
  DEFAULT_PO_TOLERANCE_PERCENT: z.coerce.number().min(0).max(50).default(10),
  // Calendar used to decide what "today" is (report defaults, current stock).
  BUSINESS_TIMEZONE: z
    .string()
    .default('Asia/Kolkata')
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('en-CA', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, 'Unknown IANA time zone')
});

const parsed = schema.safeParse(process.env);

// Fail fast: a misconfigured process must never start serving traffic.
if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_ACCESS_SECRET.startsWith('replace-with')) {
  console.error('JWT_ACCESS_SECRET still has the placeholder value from .env.example');
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
});
