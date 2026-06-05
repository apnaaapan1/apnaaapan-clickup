const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  /** Supabase pooler drops idle connections; release them before that happens. */
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  max: 10,
});
 
/** Without this, a dropped idle connection crashes the whole Node process. */
pool.on('error', (err) => {
  console.error('Database pool idle connection error:', err.message);
});

module.exports = pool;
