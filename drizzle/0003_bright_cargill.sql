ALTER TABLE "group_members" ADD COLUMN "can_post" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "group_members" ADD COLUMN "can_comment" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "group_members" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "role_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_user_id_unique" UNIQUE("group_id","user_id");