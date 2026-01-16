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
import { groupPostRouter } from "../group.post.routes.ts";

const groupRouter = Router();

/**
 * @swagger
 * /api/group/create:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tech Team
 *               description:
 *                 type: string
 *                 example: Discussion group for tech topics
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 */
groupRouter.post(
  "/create",
  authenticate,
  validate(createGroupSchema),
  groupController.createGroup
);

// Public routes
/**
 * @swagger
 * /api/group/public:
 *   get:
 *     summary: Get all public groups
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: Public groups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 */
groupRouter.get("/public", groupController.getPublicGroups);

/**
 * @swagger
 * /api/group/{groupId}:
 *   get:
 *     summary: Get group by ID
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       404:
 *         description: Group not found
 */
groupRouter.get("/:groupId", groupController.getGroupById);

// Protected routes
/**
 * @swagger
 * /api/group:
 *   get:
 *     summary: Get user's groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User groups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 */
groupRouter.get("/", authenticate, groupController.getUserGroups);

/**
 * @swagger
 * /api/group/my-invitations:
 *   get:
 *     summary: Get user's group invitations
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
 */
groupRouter.get(
  "/my-invitations",
  authenticate,
  groupController.getUserInvitations
);

/**
 * @swagger
 * /api/group/invitations/{token}/accept:
 *   post:
 *     summary: Accept group invitation
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 */
groupRouter.post(
  "/invitations/:token/accept",
  authenticate,
  groupController.acceptInvitation
);

/**
 * @swagger
 * /api/group/invitations/{token}/decline:
 *   post:
 *     summary: Decline group invitation
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Invitation declined successfully
 */
groupRouter.post(
  "/invitations/:token/decline",
  authenticate,
  groupController.declineInvitation
);

/**
 * @swagger
 * /api/group/{groupId}/members:
 *   get:
 *     summary: Get group members
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Members retrieved successfully
 */
groupRouter.get(
  "/:groupId/members",
  authenticate,
  groupController.getGroupMember
);

/**
 * @swagger
 * /api/group/{groupId}:
 *   patch:
 *     summary: Update group details
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Group updated successfully
 */
groupRouter.patch(
  "/:groupId",
  authenticate,
  validate(z.object({ body: updateGroupSchema })),
  groupController.updateGroup
);

/**
 * @swagger
 * /api/group/{groupId}:
 *   delete:
 *     summary: Delete group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 */
groupRouter.delete("/:groupId", authenticate, groupController.deleteGroup);

/**
 * @swagger
 * /api/group/{groupId}/members/invite:
 *   post:
 *     summary: Invite member to group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newmember@example.com
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 */
groupRouter.post(
  "/:groupId/members/invite",
  authenticate,
  validate(z.object({ body: inviteMemberSchema })),
  groupController.inviteMember
);

/**
 * @swagger
 * /api/group/{groupId}/members/{memberId}:
 *   delete:
 *     summary: Remove member from group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
groupRouter.delete(
  "/:groupId/members/:memberId",
  authenticate,
  groupController.removeMember
);

/**
 * @swagger
 * /api/group/{groupId}/leave:
 *   post:
 *     summary: Leave group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Left group successfully
 */
groupRouter.post("/:groupId/leave", authenticate, groupController.leaveGroup);

/**
 * @swagger
 * /api/group/{groupId}/members/{memberId}/role:
 *   patch:
 *     summary: Update member role in group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, moderator, member]
 *                 example: moderator
 *     responses:
 *       200:
 *         description: Member role updated successfully
 */
groupRouter.patch(
  "/:groupId/members/:memberId/role",
  authenticate,
  validate(z.object({ body: updateMemberRoleSchema })),
  groupController.updateMemberRole
);

// linked groupRouter to use groupPostRouter
groupRouter.use("/:groupId/posts", groupPostRouter);

export { groupRouter };
