import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import {  usersTable } from './auth.schema';

// id , userid, type,relatedEntityType string
// relatedEntityId 
// message 
// isRead 
// createdAt 

export const notifications  =pgTable('notifications',{
  id : uuid('id').primaryKey().defaultRandom(),
  userId  : uuid('user_id').notNull().references(()=>usersTable.id,{onDelete:'cascade'}),
  type : text('type').notNull(),      // post_approval,post_approved, post_rejected, group_invite
  relatedEntityType : text('related_entity_type').notNull(),    // post, comment, invitation
  relatedEntityId : uuid('related_entity_id').notNull(),
  message : text('message').notNull(),
  isRead : boolean('is_read').default(false).notNull(),
  createdAt : timestamp('created_at').notNull().defaultNow()
})


