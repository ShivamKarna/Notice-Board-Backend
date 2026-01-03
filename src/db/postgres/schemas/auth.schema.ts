import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  email : text('email').notNull().unique(),
  password : text('password').notNull(),
  createdAt : timestamp('created_at').defaultNow().notNull(),
  lastLoginAt : timestamp('last_login_at'),
});


export const userSessions = pgTable('user_sessions',{
  id : uuid('id').primaryKey().defaultRandom(),
  sessionToken :text('session_token').notNull().unique(),
  isGuest: boolean('is_guest').default(true).notNull(),
  userId : uuid('user_id').references(()=>usersTable.id,{onDelete:"cascade"}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
})



export const refreshTokens = pgTable('refresh_tokens',{
  id : uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull(),
  userId : uuid('user_id').notNull().references(()=>usersTable.id, {onDelete:"cascade"}),
  expiresAt : timestamp('expires_at').notNull(),
  createdAt : timestamp('created_at').notNull().defaultNow(),
  replacedBy : uuid('replaced_by'), // for token rotation
  revokedAt : timestamp('revoked_at'),
  revokedReason : text('revoked_reason'),
  isRevoked : boolean('is_revoked').notNull().default(false)

})
