import { pgTable, text, primaryKey, integer, uuid } from "drizzle-orm/pg-core";
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(), // "Owner", "Admin", "Member"
  level: integer("level").notNull(), // 3, 2, 1
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: text("action").notNull().unique(), // "post:create", "post:approve"
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id")
    .references(() => roles.id, { onDelete: "cascade" })
    .notNull()
    .primaryKey(),
  permissionId: uuid("permission_id")
    .references(() => permissions.id, { onDelete: "cascade" })
    .notNull()
    .primaryKey(),
});
