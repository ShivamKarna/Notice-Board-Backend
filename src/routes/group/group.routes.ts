import { groupController } from "../../controllers/group.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { Router } from "express";
import {
  createGroupSchema,
  updateGroupSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "../../utils/GroupSchemas/group.ts";

import { z } from "zod";

const groupRouter = Router();

groupRouter.post(
  "/create",
  authenticate,
  validate(createGroupSchema),
  groupController.createGroup
);

// Public routes
groupRouter.get("/public", groupController.getPublicGroups);

groupRouter.get("/:groupId", groupController.getGroupById);

// Protected routes
groupRouter.get("/", authenticate, groupController.getUserGroups);

groupRouter.get(
  "/my-invitations",
  authenticate,
  groupController.getUserInvitations
);

groupRouter.post(
  "/invitations/:token/accept",
  authenticate,
  groupController.acceptInvitation
);

groupRouter.post(
  "/invitations/:token/decline",
  authenticate,
  groupController.declineInvitation
);

groupRouter.get(
  "/:groupId/members",
  authenticate,
  groupController.getGroupMember
);

groupRouter.patch(
  "/:groupId",
  authenticate,
  validate(z.object({ body: updateGroupSchema })),
  groupController.updateGroup
);

groupRouter.delete("/:groupId", authenticate, groupController.deleteGroup);

groupRouter.post(
  "/:groupId/members/invite",
  authenticate,
  validate(z.object({ body: inviteMemberSchema })),
  groupController.inviteMember
);

groupRouter.delete(
  "/:groupId/members/:memberId",
  authenticate,
  groupController.removeMember
);

groupRouter.post("/:groupId/leave", authenticate, groupController.leaveGroup);

groupRouter.patch(
  "/:groupId/members/:memberId/role",
  authenticate,
  validate(z.object({ body: updateMemberRoleSchema })),
  groupController.updateMemberRole
);

export { groupRouter };
