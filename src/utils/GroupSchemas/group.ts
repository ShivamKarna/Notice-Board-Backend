import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 characters")
    .max(100, "Group name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
  bannerUrl: z.string().url("Invalid banner URL").optional(),
  requiresApproval: z.boolean().default(true),
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 characters")
    .max(100, "Group name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
  bannerUrl: z.string().url("Invalid banner URL").optional(),
  requiresApproval: z.boolean().optional(),
});

export const inviteMemberSchema = z.object({
  inviteeEmail: z.string().email("Invalid email address"),
  roleId: z.string().uuid("Invalid role ID"),
});

export const updateMemberRoleSchema = z.object({
  roleId: z.string().uuid("Invalid role ID"),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
