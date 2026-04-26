import { createPool } from "mysql2/promise";

async function main() {
  console.log("Starting...");
  const url = process.env.DATABASE_URL;
  if (!url) { console.log("NO URL"); return; }
  
  const parsed = new URL(url);
  const pool = createPool({
    host: parsed.hostname,
    port: Number(parsed.port),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: true },
    connectTimeout: 5000
  });

  try {
    console.log("Getting connection...");
    const conn = await pool.getConnection();
    console.log("Connected!");
    const [rows] = await conn.query("SELECT COUNT(*) FROM components");
    console.log("Rows:", rows);
    conn.release();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
    console.log("Done");
  }
}
main();
