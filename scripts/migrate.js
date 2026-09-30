// Usage: npm run migrate            -> apply pending migrations
//        npm run migrate -- --status -> list migrations and when they were applied
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import { runMigrations, migrationStatus } from '../src/db/migrator.js';

let exitCode = 0;
try {
  await connectDatabase();
  if (process.argv.includes('--status')) {
    console.table(await migrationStatus());
  } else {
    await runMigrations({ logger });
  }
} catch (err) {
  logger.error({ err }, 'Migration failed');
  exitCode = 1;
} finally {
  await disconnectDatabase().catch(() => {});
}
process.exit(exitCode);
