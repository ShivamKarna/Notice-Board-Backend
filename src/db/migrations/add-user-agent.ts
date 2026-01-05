import { db } from "../postgres/db.postgres";
import { sql } from "drizzle-orm";

async function addUserAgentColumn() {
  try {
    console.log("Adding user_agent column to refresh_tokens table...");

    await db.execute(
      sql`ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "user_agent" text`
    );

    console.log("✓ Successfully added user_agent column");
  } catch (error) {
    console.error("Error adding user_agent column:", error);
    throw error;
  }
}

addUserAgentColumn()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
