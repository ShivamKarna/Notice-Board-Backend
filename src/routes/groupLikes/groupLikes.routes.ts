import { groupLikesController } from "../../controllers/groupLikes.controller";
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  createGroupSchema,
  updateGroupSchema,
  updateMemberRoleSchema,
  inviteMemberSchema,
} from "../../utils/GroupSchemas/group";
import { z } from "zod";
import { groupController } from "../../controllers/group.controller";
import { groupPostRouter } from "../group.post.routes";

const groupLikeRouter = Router();

/**
 * @swagger
 * /api/groups:
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
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Group created successfully
 */
groupLikeRouter.post(
  "/",
  authenticate,
  validate(z.object({ body: createGroupSchema })),
  groupController.createGroup
);

/**
 * @swagger
 * /api/groups/my-groups:
 *   get:
 *     summary: Get current user's groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User groups retrieved
 */
groupLikeRouter.get("/my-groups", authenticate, groupController.getUserGroups);

/**
 * @swagger
 * /api/groups/favorites:
 *   get:
 *     summary: Get user's favorite groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Favorite groups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groups:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
groupLikeRouter.get(
  "/favorites",
  authenticate,
  groupLikesController.getUserFavouriteGroup
);

/**
 * @swagger
 * /api/groups/public:
 *   get:
 *     summary: Get all public groups
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: Public groups retrieved
 */
groupLikeRouter.get("/public", groupController.getPublicGroups);

/**
 * @swagger
 * /api/groups/invitations:
 *   get:
 *     summary: Get user's group invitations
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Invitations retrieved
 */
groupLikeRouter.get(
  "/invitations",
  authenticate,
  groupController.getUserInvitations
);

/**
 * @swagger
 * /api/groups/invitations/{token}/accept:
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
 *     responses:
 *       200:
 *         description: Invitation accepted
 */
groupLikeRouter.post(
  "/invitations/:token/accept",
  authenticate,
  groupController.acceptInvitation
);

/**
 * @swagger
 * /api/groups/invitations/{token}/decline:
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
 *     responses:
 *       200:
 *         description: Invitation declined
 */
groupLikeRouter.post(
  "/invitations/:token/decline",
  authenticate,
  groupController.declineInvitation
);

/**
 * @swagger
 * /api/groups/{groupId}:
 *   get:
 *     summary: Get group by ID
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group retrieved
 *       404:
 *         description: Group not found
 */
groupLikeRouter.get("/:groupId", groupController.getGroupById);

/**
 * @swagger
 * /api/groups/{groupId}/members:
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
 *     responses:
 *       200:
 *         description: Members retrieved
 */
groupLikeRouter.get(
  "/:groupId/members",
  authenticate,
  groupController.getGroupMember
);

/**
 * @swagger
 * /api/groups/{groupId}/favorites/count:
 *   get:
 *     summary: Get count of users who favorited this group
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
 *         description: Favorite count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 42
 *       404:
 *         description: Group not found
 */
groupLikeRouter.get(
  "/:groupId/favorites/count",
  groupLikesController.getGroupFavouriteCount
);

/**
 * @swagger
 * /api/groups/{groupId}/favorited:
 *   get:
 *     summary: Check if current user has favorited a group
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
 *         description: Favorite status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorited:
 *                   type: boolean
 *                   example: true
 */
groupLikeRouter.get("/:groupId/favorited", groupLikesController.hasUserLiked);

/**
 * @swagger
 * /api/groups/{groupId}/favorite:
 *   post:
 *     summary: Favorite a group
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
 *         description: Group favorited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Group favorited successfully
 *                 favoritesCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
groupLikeRouter.post(
  "/:groupId/favorite",
  authenticate,
  groupLikesController.likeGroup
);

/**
 * @swagger
 * /api/groups/{groupId}/favorite:
 *   delete:
 *     summary: Unfavorite a group
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
 *         description: Group unfavorited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Group unfavorited successfully
 *                 favoritesCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found or not favorited
 */
groupLikeRouter.delete(
  "/:groupId/favorite",
  authenticate,
  groupLikesController.unlikeGroup
);

/**
 * @swagger
 * /api/groups/{groupId}:
 *   patch:
 *     summary: Update group
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
 *     requestBody:
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
 *         description: Group updated
 */
groupLikeRouter.patch(
  "/:groupId",
  authenticate,
  validate(z.object({ body: updateGroupSchema })),
  groupController.updateGroup
);

groupLikeRouter.delete("/:groupId", authenticate, groupController.deleteGroup);

groupLikeRouter.post(
  "/:groupId/members/invite",
  authenticate,
  validate(z.object({ body: inviteMemberSchema })),
  groupController.inviteMember
);
groupLikeRouter.delete(
  "/:groupId/members/:memberId",
  authenticate,
  groupController.removeMember
);

groupLikeRouter.post(
  "/:groupId/leave",
  authenticate,
  groupController.leaveGroup
);

groupLikeRouter.patch(
  "/:groupId/members/:memberId/role",
  authenticate,
  validate(z.object({ body: updateMemberRoleSchema })),
  groupController.updateMemberRole
);

groupLikeRouter.use("/:groupId/posts", groupPostRouter);

export { groupLikeRouter };
