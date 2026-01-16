-- Add profile image, cover image, and bio fields to users table
ALTER TABLE "users" ADD COLUMN "profile_image" text;
ALTER TABLE "users" ADD COLUMN "cover_image" text;
ALTER TABLE "users" ADD COLUMN "bio" text;
