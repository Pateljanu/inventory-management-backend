import mongoose from 'mongoose';
import { Migration } from '../models/Migration.js';
import { migrations as allMigrations } from './migrations/index.js';

const LOCK_ID = '__lock__';
// A lock older than this is assumed to belong to a crashed run and may be taken over.
const STALE_LOCK_MS = 15 * 60 * 1000;

async function acquireLock() {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS);
  await Migration.deleteOne({ _id: LOCK_ID, appliedAt: { $lt: staleBefore } });
  try {
    await Migration.create({ _id: LOCK_ID, appliedAt: new Date() });
  } catch (err) {
    if (err?.code === 11000) throw new Error('Another migration run holds the lock; retry after it finishes');
    throw err;
  }
}

async function releaseLock() {
  await Migration.deleteOne({ _id: LOCK_ID });
}

/**
 * Applies each pending migration exactly once, in order, and records it. Never runs as part
 * of application startup: it is an explicit deployment step (npm run migrate).
 */
export async function runMigrations({ logger, migrations = allMigrations } = {}) {
  if (mongoose.connection.readyState !== 1) throw new Error('Connect to MongoDB before running migrations');
  await Migration.createCollection();
  await acquireLock();
  const applied = [];
  try {
    for (const migration of migrations) {
      if (await Migration.exists({ _id: migration.id })) continue;
      logger?.info({ migration: migration.id }, 'Applying migration');
      const started = Date.now();
      await migration.up();
      await Migration.create({ _id: migration.id, appliedAt: new Date(), durationMs: Date.now() - started });
      applied.push(migration.id);
    }
  } finally {
    await releaseLock();
  }
  logger?.info(
    { applied, total: migrations.length },
    applied.length ? 'Migrations applied' : 'Database already up to date'
  );
  return applied;
}

export async function migrationStatus(migrations = allMigrations) {
  const done = await Migration.find({ _id: { $ne: LOCK_ID } }).lean();
  const doneIds = new Map(done.map((m) => [m._id, m.appliedAt]));
  return migrations.map((m) => ({ id: m.id, appliedAt: doneIds.get(m.id) ?? null }));
}
