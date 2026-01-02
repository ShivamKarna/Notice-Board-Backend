import { pgTable, text, integer, uuid } from 'drizzle-orm/pg-core';
import { posts } from './posts.schema';

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  url: text('url').notNull(),
  order: integer('order').notNull().default(1),
});
