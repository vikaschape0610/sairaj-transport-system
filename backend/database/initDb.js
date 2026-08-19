// ============================================================
// database/initDb.js – Automated Database Initializer for PostgreSQL (Neon)
// ============================================================
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function initDatabase() {
  console.log("🔄 Connecting to Neon PostgreSQL...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to Neon PostgreSQL!");

    // Read schema_postgres.sql
    const schemaPath = path.join(__dirname, "schema_postgres.sql");
    let schemaSql = fs.readFileSync(schemaPath, "utf8");

    // Generate valid bcrypt hash for default admin password (Admin@123 and Sairaj@96k)
    const adminPassHash = await bcrypt.hash("Admin@123", 12);
    console.log("🔐 Generated valid bcrypt hash for Admin@123");

    // Replace any malformed admin insert with clean hash
    schemaSql = schemaSql.replace(
      /\$2a\$12\$04n2lMuQXfnLqw5\.RDfrJ\.ZRSPCJqRDBGwd\\P4ptwVUFVZp3gC7S2/g,
      adminPassHash
    );

    console.log("🚀 Executing schema and migrations on Neon database...");
    await client.query(schemaSql);
    console.log("✅ Schema created, tables verified, and sample data inserted!");

    // Check tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("\n📋 Initialized Tables in Database:");
    tablesRes.rows.forEach((r) => console.log(`  - ${r.table_name}`));

    // Check Admin row
    const adminRes = await client.query("SELECT id, email, created_at FROM admins");
    console.log("\n👨‍💼 Admin User status:");
    console.log(adminRes.rows);

    // Check Trucks count
    const truckRes = await client.query("SELECT COUNT(*) FROM trucks");
    console.log(`\n🚛 Trucks loaded: ${truckRes.rows[0].count}`);

    client.release();
    await pool.end();

    console.log("\n🎉 Database initialization complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database initialization error:", err);
    process.exit(1);
  }
}

initDatabase();
