import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting drizzle test...");
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
    const db = drizzle({ client: pool });
    console.log("Drizzle db created. Querying...");
    const result = await db.execute(sql`SELECT COUNT(*) FROM components`);
    console.log("Result:", result);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
    console.log("Done");
  }
}
main();
