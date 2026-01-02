import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { groups } from './groups.schema';
import { usersTable } from './auth.schema';

// id string 
//groupId  
//inviterId 
//inviteeId
//token 
//status  // "pending", "accepted", "declined"
//createdAt 
//expiresAt 


export const invitations  = pgTable('invitations',{
  id : uuid('id').primaryKey().defaultRandom(),
  groupId : uuid('group_id').notNull().references(()=>groups.id,{onDelete:"cascade"}),
  inviterId : uuid('inviter_id').notNull().references(()=>usersTable.id,{onDelete:"cascade"}),
  inviteeId : uuid('invitee_id').notNull().references(()=>usersTable.id,{onDelete:"cascade"}),
  token : text('token').notNull().unique(),
  status : text('status').notNull().default('pending'),
  createdAt : timestamp('created_at').notNull().defaultNow(),
  expiresAt : timestamp('expires_at').notNull(),
})
