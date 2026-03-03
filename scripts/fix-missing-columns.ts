/**
 * One-time fix: manually applies the SQL from 0004_fixed_genesis.sql
 * that was skipped because the migration was incorrectly marked as applied.
 *
 * Run with: bun run scripts/fix-missing-columns.ts
 */
import postgres from "postgres";

const DATABASE_URL = process.env.POSTGRES_DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  POSTGRES_DATABASE_URL env variable is not set.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function main() {
  console.log("Applying missing columns from migration 0004...\n");

  // Create notification_preferences table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS "notification_preferences" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL,
      "post_approval_needed" boolean DEFAULT true NOT NULL,
      "post_approved" boolean DEFAULT true NOT NULL,
      "post_rejected" boolean DEFAULT true NOT NULL,
      "post_liked" boolean DEFAULT true NOT NULL,
      "post_commented" boolean DEFAULT true NOT NULL,
      "comment_replied" boolean DEFAULT true NOT NULL,
      "group_invite" boolean DEFAULT true NOT NULL,
      "member_joined" boolean DEFAULT false NOT NULL,
      "member_removed" boolean DEFAULT true NOT NULL,
      "role_changed" boolean DEFAULT true NOT NULL,
      "system_announcements" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
    )
  `;
  console.log("✅  notification_preferences table ready");

  // Add profile_image column if missing
  await sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image" text
  `;
  console.log("✅  profile_image column added");

  // Add cover_image column if missing
  await sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cover_image" text
  `;
  console.log("✅  cover_image column added");

  // Add bio column if missing
  await sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text
  `;
  console.log("✅  bio column added");

  // Add foreign key constraint if missing
  try {
    await sql`
      ALTER TABLE "notification_preferences"
        ADD CONSTRAINT "notification_preferences_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action
    `;
    console.log("✅  Foreign key constraint added");
  } catch (e: any) {
    if (e.code === "42710") {
      console.log("⏭️  Foreign key constraint already exists, skipping");
    } else {
      throw e;
    }
  }

  console.log("\nDone! Redeploy your app on Render now.");
  await sql.end();
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
