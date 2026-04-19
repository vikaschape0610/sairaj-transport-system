// ============================================================
// config/db.js – PostgreSQL connection (Railway + local)
// Replaces: mysql2/promise  →  pg
// ============================================================

const { Pool } = require("pg");
require("dotenv").config();

// ── Build pool config ─────────────────────────────────────────
// Railway provides DATABASE_URL — prefer it over individual vars.
// Individual vars (DB_HOST etc.) are the fallback for custom setups.
let poolConfig;

if (process.env.DATABASE_URL) {
  // Railway / Heroku style — single connection string
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // ✅ Required for Railway TLS
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else {
  // Individual env vars (Render custom config / local dev)
  const isLocal =
    !process.env.DB_HOST ||
    process.env.DB_HOST === "localhost" ||
    process.env.DB_HOST === "127.0.0.1";

  poolConfig = {
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:     parseInt(process.env.DB_PORT, 10) || 5432,

    // SSL required for remote (Railway/Render) — disabled locally
    ssl: isLocal ? false : { rejectUnauthorized: false },

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const pool = new Pool(poolConfig);

// ── Pool-level error handler ─────────────────────────────────
// Prevents unhandled promise rejections on idle client errors
pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL pool error:", err.message);
});

// ── Compatibility helper ──────────────────────────────────────
// Converts MySQL2-style ? placeholders → PostgreSQL $1, $2, $3
// (Only active for any remaining legacy queries — new queries use $N directly)
function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// ── execute() — drop-in replacement for mysql2 pool.execute() ─
// Returns [ rows, meta ] where:
//   rows       = result.rows  (array of row objects)
//   meta       = { affectedRows, insertId, rowCount }
//   insertId   = rows[0]?.id  (requires RETURNING id in SQL)
// ─────────────────────────────────────────────────────────────
pool.execute = async function pgExecute(sql, params = []) {
  const pgSql = convertPlaceholders(sql);
  const result = await pool.query(pgSql, params);

  const meta = {
    affectedRows: result.rowCount,
    insertId:     result.rows[0]?.id ?? null,
    rowCount:     result.rowCount,
  };

  return [result.rows, meta];
};

// ── Startup connection test ─────────────────────────────────
(async () => {
  try {
    const client = await pool.connect();
    const { rows } = await client.query("SELECT current_database() AS db");
    console.log(`✅ PostgreSQL connected → database: "${rows[0].db}"`);
    client.release();
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    // Do NOT process.exit() — let server stay up for health checks
  }
})();

module.exports = pool;
