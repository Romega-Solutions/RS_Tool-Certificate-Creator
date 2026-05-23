// Simple test script to verify PostgreSQL connection
/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require("pg");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_NAME = process.env.DB_NAME || "certificate_queue";
const DB_USER = process.env.DB_USER || "cert_admin";
const DB_PASSWORD = process.env.DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error("DB_PASSWORD is required. Copy .env.example to .env.local and set database values.");
  process.exit(1);
}

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: false,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  console.log("Testing PostgreSQL connection...");
  console.log(`Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`Database: ${DB_NAME}`);
  console.log(`User: ${DB_USER}\n`);

  try {
    const client = await pool.connect();
    console.log("SUCCESS: Connected to PostgreSQL!\n");

    // Test query
    const result = await client.query("SELECT NOW() as current_time");
    console.log("Current server time:", result.rows[0].current_time);

    // Test table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'email_queue'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('SUCCESS: Table "email_queue" exists!\n');

      // Get row count
      const count = await client.query("SELECT COUNT(*) FROM email_queue");
      console.log("Current queue items:", count.rows[0].count);

      // Get table structure
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'email_queue'
        ORDER BY ordinal_position
      `);

      console.log("\nTable structure:");
      columns.rows.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('ERROR: Table "email_queue" not found!');
    }

    client.release();
    await pool.end();

    console.log("\n=================================");
    console.log("All tests passed! Database is ready.");
    console.log("=================================\n");
    process.exit(0);
  } catch (error) {
    console.error("\n=================================");
    console.error("ERROR: Connection failed!");
    console.error("=================================");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("\nPlease check:");
    console.error("1. Database host and port are correct");
    console.error("2. PostgreSQL is running on the VPS");
    console.error("3. Firewall allows port 5432");
    console.error("4. pg_hba.conf allows remote connections");
    console.error("5. Password is correct\n");

    await pool.end();
    process.exit(1);
  }
}

testConnection();
