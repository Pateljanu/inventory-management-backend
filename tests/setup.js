// Runs before every test file (before src/config/env.js is imported), so tests never depend on a local .env.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.TEST_LOG_LEVEL || 'silent';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/metal_scrap_test';
process.env.JWT_ACCESS_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_ACCESS_TTL = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '7';
process.env.CORS_ORIGINS = 'http://localhost:5173';
// Scenario-heavy test files legitimately exceed the production per-IP budget.
process.env.RATE_LIMIT_PER_MINUTE = '100000';
// Exact order limits, as the scenario tests were written; tolerance has its own tests.
process.env.DEFAULT_PO_TOLERANCE_PERCENT = '0';
