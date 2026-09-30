import { afterAll, beforeAll, inject } from 'vitest';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { connectDatabase } from '../../src/config/database.js';
import { runMigrations } from '../../src/db/migrator.js';

/**
 * Connects the test file to a fresh, fully migrated database and drops it afterwards.
 * Returns a function that empties every business collection (indexes are kept).
 */
export function useTestDatabase() {
  beforeAll(async () => {
    await connectDatabase(inject('mongoUri'), { dbName: `test_${randomUUID().slice(0, 8)}` });
    await runMigrations();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  return async function clearDatabase() {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.filter((c) => c.collectionName !== 'migrations').map((c) => c.deleteMany({})));
  };
}
