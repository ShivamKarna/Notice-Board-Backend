import { Router } from "express";
import { guestController } from "../../controllers/guest.controller";
import { ensureGuestSession } from "../../middlewares/guest.middleware";

const guestRouter = Router();

guestRouter.use(ensureGuestSession);

/**
 * @swagger
 * /api/guest/groups:
 *   get:
 *     summary: Get all public groups (guest access)
 *     tags: [Guest]
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
guestRouter.get("/groups", guestController.getPublicGroups);

/**
 * @swagger
 * /api/guest/groups/trending:
 *   get:
 *     summary: Get trending public groups (guest access)
 *     tags: [Guest]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trending groups to return
 *     responses:
 *       200:
 *         description: Trending groups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Group'
 *                   - type: object
 *                     properties:
 *                       trendingScore:
 *                         type: number
 *                       memberCount:
 *                         type: integer
 *                       postCount:
 *                         type: integer
 */
guestRouter.get("/groups/trending", guestController.getTrendingGroups);

/**
 * @swagger
 * /api/guest/groups/{groupId}:
 *   get:
 *     summary: Get public group details (guest access)
 *     tags: [Guest]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       404:
 *         description: Group not found or not public
 */
guestRouter.get("/groups/:groupId", guestController.getGroupDetails);

/**
 * @swagger
 * /api/guest/groups/{groupId}/posts:
 *   get:
 *     summary: Get public posts from a group (guest access)
 *     tags: [Guest]
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
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
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
 */
guestRouter.get("/groups/:groupId/posts", guestController.getGroupPublicPosts);

/**
 * @swagger
 * /api/guest/posts/{postId}:
 *   get:
 *     summary: Get a public post (guest access)
 *     tags: [Guest]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found or not public
 */
guestRouter.get("/posts/:postId", guestController.getPublicPost);

/**
 * @swagger
 * /api/guest/feed:
 *   get:
 *     summary: Get public feed of approved posts (guest access)
 *     tags: [Guest]
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Public feed retrieved successfully
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
 */
guestRouter.get("/feed", guestController.getPublicFeed);

/**
 * @swagger
 * /api/guest/posts/trending:
 *   get:
 *     summary: Get trending public posts (guest access)
 *     tags: [Guest]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trending posts to return
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: Timeframe for trending calculation
 *     responses:
 *       200:
 *         description: Trending posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Post'
 *                   - type: object
 *                     properties:
 *                       trendingScore:
 *                         type: number
 *                       likesCount:
 *                         type: integer
 *                       commentsCount:
 *                         type: integer
 */
guestRouter.get("/posts/trending", guestController.getTrendingPosts);

export { guestRouter };
