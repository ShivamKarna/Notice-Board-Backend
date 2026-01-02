import { pgTable,timestamp,text, uuid,boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth.schema";
import { groups } from "./groups.schema";

//id, groupId, authorId, title,subtitle, content,status,visibility,createdAt 
//submittedAt,publishedAt, updatedAt,

export const posts = pgTable('posts',{
  id : uuid('id').primaryKey().defaultRandom(),
  groupId : uuid('group_id').references(()=>groups.id,{onDelete:"cascade"}).notNull(),
  authorId : uuid('author_id').references(()=>usersTable.id,{onDelete:"cascade"}).notNull(),
  title : text('title').notNull(),
  subTitle : text('sub_title'),
  content : text('content').notNull(),
  status : text('status').notNull().default('draft'),
  visibility : text('visibility').default('public').notNull(),
  createdAt  : timestamp('created_at').defaultNow().notNull(),
  submittedAt : timestamp('submitted_at'),
  publishedAt : timestamp('published_at'),
  updatedAt : timestamp('udpated_at').defaultNow().notNull(),
})

// id , postId, requestedBy, status,
// reviewedBy, reviewdAt, rejectionReason,
// created_at

export const postApprovals = pgTable("post_approvals",{
  id : uuid('id').primaryKey().defaultRandom(),
  postId : uuid('post_id').references(()=>posts.id,{onDelete:"cascade"}).notNull().unique(),
  requestedBy : uuid('requested_by').notNull().references(()=>usersTable.id,{onDelete:"cascade"}),
  status  : text('status').default('pending').notNull(),
  reviewedBy : uuid('reviewed_by').references(()=>usersTable.id,{onDelete:"set null"}).notNull(),
  reviewAt : timestamp('review_at'),
  rejectionReason : text('rejection_reason'),
  createdAt : timestamp('created_at').defaultNow().notNull(),
})
