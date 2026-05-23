// Diagnostic script for PostgreSQL connection issues
/* eslint-disable @typescript-eslint/no-require-imports */
const net = require("net");
const { Pool } = require("pg");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_NAME = process.env.DB_NAME || "certificate_queue";
const DB_USER = process.env.DB_USER || "cert_admin";
const DB_PASSWORD = process.env.DB_PASSWORD;

// Test 1: Check if port is reachable
async function testPortConnection() {
  console.log("=================================");
  console.log("TEST 1: Port Reachability");
  console.log("=================================\n");

  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 5000;

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      console.log(`✅ Port ${DB_PORT} is REACHABLE on ${DB_HOST}`);
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      console.log("❌ Connection TIMEOUT (port not responding)");
      console.log("   Firewall might be blocking the connection");
      socket.destroy();
      resolve(false);
    });

    socket.on("error", (err) => {
      console.log("❌ Connection REFUSED");
      console.log("   Error:", err.message);
      console.log("\nPossible reasons:");
      console.log("   1. PostgreSQL is not running");
      console.log("   2. PostgreSQL is only listening on localhost");
      console.log("   3. Firewall is blocking port 5432");
      resolve(false);
    });

    console.log(`Attempting to connect to ${DB_HOST}:${DB_PORT}...`);
    socket.connect(DB_PORT, DB_HOST);
  });
}

// Test 2: Try PostgreSQL authentication
async function testPostgreSQLAuth() {
  console.log("\n=================================");
  console.log("TEST 2: PostgreSQL Authentication");
  console.log("=================================\n");

  if (!DB_PASSWORD) {
    console.log("❌ DB_PASSWORD is not set; skipping authentication test");
    return false;
  }

  const configs = [
    {
      name: "Configured database",
      config: {
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASSWORD,
        ssl: false,
        connectionTimeoutMillis: 5000,
      },
    },
  ];

  for (const { name, config } of configs) {
    console.log(`\nTrying ${name} (${config.host}:${config.port})...`);

    const pool = new Pool(config);

    try {
      const client = await pool.connect();
      console.log(`✅ SUCCESS: Connected to ${name}!`);

      const result = await client.query("SELECT version()");
      console.log(
        `   PostgreSQL Version: ${result.rows[0].version.split(",")[0]}`
      );

      client.release();
      await pool.end();
      return true;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      await pool.end();
    }
  }

  return false;
}

// Test 3: Check environment variable
function testEnvironmentVariable() {
  console.log("\n=================================");
  console.log("TEST 3: Environment Variable");
  console.log("=================================\n");

  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    console.log("✅ DATABASE_URL is set");
    console.log("   Value:", dbUrl.replace(/:[^:@]+@/, ":****@")); // Hide password
  } else {
    console.log("❌ DATABASE_URL is NOT set");
    console.log("   Make sure .env.local exists and is loaded");
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log("\n🔍 PostgreSQL Connection Diagnostics");
  console.log("=====================================\n");

  testEnvironmentVariable();

  const portReachable = await testPortConnection();

  if (portReachable) {
    await testPostgreSQLAuth();
  } else {
    console.log("\n⚠️ Skipping authentication test (port not reachable)");
  }

  console.log("\n=================================");
  console.log("RECOMMENDATIONS");
  console.log("=================================\n");

  console.log("If connection failed, check on your VPS:");
  console.log("");
  console.log("1. Is PostgreSQL running?");
  console.log("   sudo systemctl status postgresql");
  console.log("");
  console.log("2. Is PostgreSQL listening on all interfaces?");
  console.log("   sudo nano /etc/postgresql/*/main/postgresql.conf");
  console.log("   Check: listen_addresses = '*'");
  console.log("");
  console.log("3. Does firewall allow port 5432?");
  console.log("   sudo ufw status");
  console.log("   sudo ufw allow 5432/tcp");
  console.log("");
  console.log("4. Does pg_hba.conf allow remote connections?");
  console.log("   sudo nano /etc/postgresql/*/main/pg_hba.conf");
  console.log("   Add: host all all 0.0.0.0/0 md5");
  console.log("");
  console.log("5. Restart PostgreSQL after changes:");
  console.log("   sudo systemctl restart postgresql");
  console.log("");

  process.exit(0);
}

runDiagnostics();
