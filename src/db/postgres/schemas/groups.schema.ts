import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth.schema";
import { roles } from "./rbac.schema";
// id, name,, ownerId, avatarImage , bannerImage, description, requiresApproval,createAt
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  avatarImage: text("avatar_image"),
  bannerImage: text("banner_image"), // might changet to coverImage later
  description: text("description"),
  requiresApproval: boolean("requires_approval"),
  createdAt: timestamp("created_at"),
});
//id, groupId,userId,roleId,joinedAt
export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  roleId: uuid("role_id")
    .references(() => roles.id, { onDelete: "cascade" })
    .notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

//userId, groupId, createdAt
export const groupLikes = pgTable(
  "group_likes",
  {
    userId: uuid("user_id").references(() => usersTable.id, {
      onDelete: "cascade",
    }),
    groupId: uuid("group_id").references(() => groups.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.groupId] }),
  })
);
