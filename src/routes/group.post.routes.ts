import { Router } from "express";
import { postController } from "../controllers/post.controller";
import { authenticate } from "../middlewares/auth.middleware";

const groupPostRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/group/{groupId}/posts:
 *   get:
 *     summary: Get all posts from a specific group
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Posts per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, approved, rejected]
 *         description: Filter by post status
 *     responses:
 *       200:
 *         description: Group posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       404:
 *         description: Group not found
 */
groupPostRouter.get("/", postController.getGroupPosts);

/**
 * @swagger
 * /api/group/{groupId}/posts/pending:
 *   get:
 *     summary: Get pending posts in a group (requires authentication)
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
 *         description: Pending posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
groupPostRouter.get("/pending", authenticate, postController.getPendingPosts);

export { groupPostRouter };
