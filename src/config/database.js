import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

let listenersAttached = false;
// Distinguishes a deliberate shutdown from a dropped connection, which is worth alerting on.
let closing = false;

function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  mongoose.connection.on('disconnected', () => {
    if (!closing) logger.warn('MongoDB disconnected unexpectedly');
  });
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
}

/**
 * Indexes are created by versioned migrations (npm run migrate), never implicitly in production,
 * so an application restart can never trigger an unexpected expensive index build.
 */
export async function connectDatabase(uri = env.MONGODB_URI, { dbName = env.MONGODB_DB_NAME } = {}) {
  attachListeners();
  closing = false;
  await mongoose.connect(uri, {
    ...(dbName ? { dbName } : {}),
    // Local development convenience only. Tests and production rely on migrations, so the
    // migration path is exactly what the test suite exercises.
    autoIndex: env.NODE_ENV === 'development',
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000
  });
  await assertReplicaSet();
  logger.info({ db: mongoose.connection.name }, 'MongoDB connected');
}

// Multi-document transactions are a hard requirement of this design; a standalone mongod would
// silently break every stock/PO invariant, so refuse to start against one.
async function assertReplicaSet() {
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    throw new Error('MongoDB must run as a replica set (or sharded cluster) because transactions are required');
  }
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  closing = true;
  await mongoose.disconnect();
  logger.info('MongoDB connection closed');
}
