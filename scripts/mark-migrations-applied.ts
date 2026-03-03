/**
 * One-time script to mark all existing Drizzle migrations as applied
 * in the __drizzle_migrations table without re-running them.
 *
 * Use this when tables already exist in the DB but the migration
 * history table is empty or out of sync.
 *
 * Run with: bun run db:mark-applied
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const MIGRATIONS_FOLDER = path.resolve("drizzle");
const JOURNAL_PATH = path.join(MIGRATIONS_FOLDER, "meta", "_journal.json");

const DATABASE_URL = process.env.POSTGRES_DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  POSTGRES_DATABASE_URL env variable is not set.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function main() {
  const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf-8"));

  console.log(`Found ${journal.entries.length} migration(s) in journal.\n`);

  // Ensure the drizzle migrations table exists
  await sql`
    CREATE SCHEMA IF NOT EXISTS drizzle;
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id        SERIAL PRIMARY KEY,
      hash      text NOT NULL,
      created_at bigint
    );
  `;

  for (const entry of journal.entries) {
    const filePath = path.join(MIGRATIONS_FOLDER, `${entry.tag}.sql`);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Migration file not found, skipping: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const hash = crypto.createHash("sha256").update(content).digest("hex");

    // Check if already recorded
    const existing = await sql`
      SELECT id FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
    `;

    if (existing.length > 0) {
      console.log(`⏭️  Already applied: ${entry.tag}`);
      continue;
    }

    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${entry.when})
    `;

    console.log(`✅  Marked as applied: ${entry.tag}`);
  }

  console.log("\nDone. You can now run db:migrate safely.");
  await sql.end();
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
