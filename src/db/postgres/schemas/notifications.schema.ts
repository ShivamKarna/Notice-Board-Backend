import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./auth.schema";

// id , userid, type,relatedEntityType string
// relatedEntityId
// message
// isRead
// createdAt

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // post_approval,post_approved, post_rejected, group_invite
  relatedEntityType: text("related_entity_type").notNull(), // post, comment, invitation
  relatedEntityId: uuid("related_entity_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull()
    .unique(),

  // Post-related notifications
  postApprovalNeeded: boolean("post_approval_needed").default(true).notNull(),
  postApproved: boolean("post_approved").default(true).notNull(),
  postRejected: boolean("post_rejected").default(true).notNull(),

  // Interaction notifications
  postLiked: boolean("post_liked").default(true).notNull(),
  postCommented: boolean("post_commented").default(true).notNull(),
  commentReplied: boolean("comment_replied").default(true).notNull(),

  // Group notifications
  groupInvite: boolean("group_invite").default(true).notNull(),
  memberJoined: boolean("member_joined").default(false).notNull(),
  memberRemoved: boolean("member_removed").default(true).notNull(),
  roleChanged: boolean("role_changed").default(true).notNull(),

  // System notifications
  systemAnnouncements: boolean("system_announcements").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
