/**
 * NG-SENTRA — Set custom SSH commands for SOC components
 * 
 * Edit the commands below, then run:
 *   node setup-custom-commands.mjs
 */

import mysql from "mysql2/promise";
import { config } from "dotenv";

config();
config({ path: ".env.local", override: true });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EDIT YOUR COMMANDS HERE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const COMMANDS = {
  // Snort IDS — enter the running Snort container
  "snort": "docker exec -it snort /bin/bash",

  // UFW Firewall — open a shell to manage firewall rules
  "ufw": "sudo ufw status verbose && bash",

  // Filebeat Log Shipper — check status and open config
  "filebeat": "sudo systemctl status filebeat && bash",

  // Digital Forensics (SIFT Workstation) — start or attach to SIFT container
  "digital-forensics": "docker start sift 2>/dev/null; docker exec -it sift /bin/bash",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: true },
  });

  console.log("🔗 Connected to database\n");

  for (const [slug, command] of Object.entries(COMMANDS)) {
    const [result] = await conn.query(
      "UPDATE components SET customCommand = ? WHERE slug = ?",
      [command, slug]
    );
    const affected = result.affectedRows;
    if (affected > 0) {
      console.log(`  ✅  ${slug.padEnd(20)} → ${command}`);
    } else {
      console.log(`  ⚠️  ${slug.padEnd(20)} → NOT FOUND in database (skipped)`);
    }
  }

  console.log("\n✨ Done! Refresh your dashboard to see the changes.");
  await conn.end();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
