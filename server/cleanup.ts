import { drizzle } from "drizzle-orm/mysql2";
import { components } from "../drizzle/schema";
import { inArray } from "drizzle-orm";

async function cleanup() {
  const db = drizzle(process.env.DATABASE_URL!);

  // Remove old component rows no longer in the real infrastructure
  const slugsToRemove = [
    "anomaly-detection",
    "alert-classification",
    "uba-ai",
    "local-ti-api",
    "digital-forensics",
  ];

  await db.delete(components).where(inArray(components.slug, slugsToRemove));
  console.log("✅ Removed old component rows:", slugsToRemove.join(", "));

  // Verify remaining
  const remaining = await db
    .select({ name: components.name, slug: components.slug, url: components.url, port: components.port })
    .from(components);

  console.log("\n📋 Remaining components in database:");
  remaining.forEach(c =>
    console.log(`  - ${c.name} (${c.slug}) → ${c.url ?? "CLI only"} | port: ${c.port ?? "N/A"}`)
  );

  process.exit(0);
}

cleanup().catch(e => {
  console.error("Cleanup failed:", e);
  process.exit(1);
});
