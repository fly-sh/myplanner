const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id        SERIAL PRIMARY KEY,
      title     TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      due_date  TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notes (
      id        SERIAL PRIMARY KEY,
      title     TEXT NOT NULL,
      content   TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id        SERIAL PRIMARY KEY,
      endpoint  TEXT UNIQUE NOT NULL,
      p256dh    TEXT NOT NULL,
      auth      TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('[DB] PostgreSQL 테이블 초기화 완료');
}

module.exports = { pool, initDB };
