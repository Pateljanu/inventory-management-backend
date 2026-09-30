import mongoose from 'mongoose';

/**
 * Runs `work(session)` in a MongoDB transaction and returns its result. The driver retries the
 * whole callback on transient errors (including write conflicts from lockVersion), so `work`
 * must be idempotent with respect to anything outside the database - keep it DB-only and short.
 */
export async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
