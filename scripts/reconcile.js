// Read-only integrity audit. Run after any manual data correction, restore or migration.
//
// Usage: npm run reconcile            -> human-readable summary
//        npm run reconcile -- --json  -> machine-readable report
// Exit code 0 = consistent, 2 = issues found, 1 = the audit itself failed.
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { reconciliationService } from '../src/services/reconciliation.service.js';

let exitCode = 0;
try {
  await connectDatabase();
  const report = await reconciliationService.run();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Checked: ${JSON.stringify(report.checked)}`);
    if (report.ok) {
      console.log('OK - no historical negative stock, no over-delivered POs, all amounts consistent.');
    } else {
      console.log(`${report.issues.length} issue(s) found:`);
      console.table(report.issues);
    }
  }
  exitCode = report.ok ? 0 : 2;
} catch (err) {
  console.error('Reconciliation failed:', err.message);
  exitCode = 1;
} finally {
  await disconnectDatabase().catch(() => {});
}
process.exit(exitCode);
