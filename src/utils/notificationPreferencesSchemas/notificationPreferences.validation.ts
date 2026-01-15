import { z } from "zod";

export const updateNotificationPreferencesSchema = z.object({
  postApprovalNeeded: z.boolean().optional(),
  postApproved: z.boolean().optional(),
  postRejected: z.boolean().optional(),
  postLiked: z.boolean().optional(),
  postCommented: z.boolean().optional(),
  commentReplied: z.boolean().optional(),
  groupInvite: z.boolean().optional(),
  memberJoined: z.boolean().optional(),
  memberRemoved: z.boolean().optional(),
  roleChanged: z.boolean().optional(),
  systemAnnouncements: z.boolean().optional(),
});

export type UpdateNotificationPreferencesSchema = z.infer<
  typeof updateNotificationPreferencesSchema
>;
