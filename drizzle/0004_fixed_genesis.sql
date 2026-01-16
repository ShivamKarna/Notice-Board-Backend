CREATE TABLE "notification_preferences" (
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
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cover_image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;