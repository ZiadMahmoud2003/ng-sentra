/**
 * Revert UBA endpoint to VirtualBox IP in the database
 */
import { createPool } from 'mysql2/promise';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!match) { console.error('DATABASE_URL not found'); process.exit(1); }

const dbUrl = new URL(match[1]);
const pool = createPool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ''),
  ssl: { rejectUnauthorized: true },
});

const updates = [
  { slug: 'uba', endpointUrl: 'http://192.168.1.14:5000/detect', desc: 'UBA Service (VirtualBox)' },
];

for (const u of updates) {
  const [result] = await pool.execute(
    'UPDATE ai_models SET endpointUrl = ? WHERE slug = ?',
    [u.endpointUrl, u.slug]
  );
  console.log(`  ✅ ${u.slug} → ${u.endpointUrl}`);
}

await pool.end();
