import postgres from "postgres";

const DB_URL = process.env.POSTGRES_DATABASE_URL;
if (!DB_URL) throw new Error("POSTGRES_DATABASE_URL not set");

const sql = postgres(DB_URL);

async function main() {
  // Check which columns actually exist
  const rows = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position
  `;
  const existing = rows.map((r) => r.column_name as string);
  console.log("Existing users columns:", existing.join(", "));

  const toAdd: { name: string; sql: string }[] = [
    { name: "deleted_at", sql: `ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp` },
    { name: "is_deleted", sql: `ALTER TABLE "users" ADD COLUMN "is_deleted" boolean NOT NULL DEFAULT false` },
    { name: "profile_image", sql: `ALTER TABLE "users" ADD COLUMN "profile_image" text` },
    { name: "cover_image", sql: `ALTER TABLE "users" ADD COLUMN "cover_image" text` },
    { name: "bio", sql: `ALTER TABLE "users" ADD COLUMN "bio" text` },
  ];

  for (const col of toAdd) {
    if (!existing.includes(col.name)) {
      console.log(`Adding column: ${col.name}`);
      await sql.unsafe(col.sql);
      console.log(`  ✓ Added ${col.name}`);
    } else {
      console.log(`  ✓ ${col.name} already exists`);
    }
  }

  // Also ensure notification_preferences table exists
  const tables = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_preferences'
  `;
  if (tables.length === 0) {
    console.log("Creating notification_preferences table...");
    await sql.unsafe(`
      CREATE TABLE "notification_preferences" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL UNIQUE,
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
        CONSTRAINT "notification_preferences_user_id_users_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
      )
    `);
    console.log("  ✓ Created notification_preferences");
  } else {
    console.log("  ✓ notification_preferences already exists");
  }

  console.log("Done!");
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
