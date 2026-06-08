const { Pool } = require('pg');

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 150;

const RETRYABLE_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE',
  '57P01',
  '08006',
  '08003',
  '08001',
]);

function isRetryableError(err) {
  if (!err) return false;
  if (RETRYABLE_CODES.has(err.code)) return true;

  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('connection terminated') ||
    msg.includes('connection timeout') ||
    msg.includes('connection error') ||
    msg.includes('server closed the connection') ||
    msg.includes('connection refused')
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const isLocal =
    connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const isServerless = Boolean(process.env.VERCEL);

  return {
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    /** Release idle clients before Supabase pooler drops them. */
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 20_000,
    /** One client per serverless instance; more for long-running servers. */
    max: isServerless ? 1 : 10,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    allowExitOnIdle: isServerless,
  };
}

const pool = new Pool(buildPoolConfig());

/** Stale pooled connections can be dropped by Supabase; log and continue. */
pool.on('error', (err) => {
  console.error('Database pool idle connection error:', err.message);
});

async function withRetry(operation, label) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const shouldRetry = attempt < MAX_RETRIES && isRetryableError(err);
      if (!shouldRetry) throw err;

      console.warn(
        `${label} failed (${err.message}); retrying (${attempt + 1}/${MAX_RETRIES})...`
      );
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError;
}

const originalQuery = pool.query.bind(pool);
const originalConnect = pool.connect.bind(pool);

pool.query = (...args) => withRetry(() => originalQuery(...args), 'Database query');
pool.connect = (...args) => withRetry(() => originalConnect(...args), 'Database connect');

module.exports = pool;
