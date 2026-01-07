import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { groups } from "./groups.schema";
import { usersTable } from "./auth.schema";
import { roles } from "./rbac.schema";
// id string
//groupId
//inviterId
//inviteeId
//roleId
//token
//status  // "pending", "accepted", "declined"
//createdAt
//expiresAt

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  inviterId: uuid("inviter_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  inviteeId: uuid("invitee_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  roleId: uuid("role_id")
    .references(() => roles.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});
