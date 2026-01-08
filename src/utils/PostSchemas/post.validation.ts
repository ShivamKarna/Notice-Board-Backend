import {z} from 'zod';



// create post
export const createPostSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  subtitle: z
    .string()
    .max(300, 'Subtitle must be less than 300 characters')
    .optional(),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10,000 characters'),
  groupId: z.string().uuid('Invalid group ID'),
  visibility: z.enum(['public', 'members_only']).default('public'),
});

// update post
export const updatePostSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  subtitle: z
    .string()
    .max(300, 'Subtitle must be less than 300 characters')
    .optional(),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10,000 characters')
    .optional(),
  visibility: z.enum(['public', 'members_only']).optional(),
});


// reject post
export const rejectPostSchema = z.object({
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters'),
});


export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type RejectPostInput = z.infer<typeof rejectPostSchema>;
