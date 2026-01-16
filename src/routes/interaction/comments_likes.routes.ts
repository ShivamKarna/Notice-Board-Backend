import { Router } from "express";
import { interactionController } from "../../controllers/interactions.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../../utils/CommentSchemas/interactions";
import { z } from "zod";

const interactionsRouter = Router();

// Comments Routes
/**
 * @swagger
 * /api/interactions/posts/{postId}/comments:
 *   post:
 *     summary: Create a comment on a post
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Great post! Thanks for sharing.
 *               parentId:
 *                 type: string
 *                 nullable: true
 *                 description: Parent comment ID for nested replies
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 content:
 *                   type: string
 *                 authorId:
 *                   type: string
 *                 postId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
interactionsRouter.post(
  "/posts/:postId/comments",
  authenticate,
  validate(z.object({ body: createCommentSchema })),
  interactionController.createComment
);

/**
 * @swagger
 * /api/interactions/posts/{postId}/comments:
 *   get:
 *     summary: Get all comments for a post
 *     tags: [Interactions]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       author:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       404:
 *         description: Post not found
 */
interactionsRouter.get(
  "/posts/:postId/comments",
  interactionController.getPostComments
);

/**
 * @swagger
 * /api/interactions/comments/{commentId}:
 *   patch:
 *     summary: Update a comment
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Updated comment content
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this comment
 *       404:
 *         description: Comment not found
 */
interactionsRouter.patch(
  "/comments/:commentId",
  authenticate,
  validate(z.object({ body: updateCommentSchema })),
  interactionController.updateComment
);

/**
 * @swagger
 * /api/interactions/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this comment
 *       404:
 *         description: Comment not found
 */
interactionsRouter.delete(
  "/comments/:commentId",
  authenticate,
  interactionController.deleteComment
);

// Likes Routes
/**
 * @swagger
 * /api/interactions/posts/{postId}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post liked successfully
 *                 likesCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
interactionsRouter.post(
  "/posts/:postId/like",
  authenticate,
  interactionController.likePost
);

/**
 * @swagger
 * /api/interactions/posts/{postId}/like:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post unliked successfully
 *                 likesCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found or not liked
 */
interactionsRouter.delete(
  "/posts/:postId/like",
  authenticate,
  interactionController.unlikePost
);

/**
 * @swagger
 * /api/interactions/posts/{postId}/likes:
 *   get:
 *     summary: Get all likes for a post
 *     tags: [Interactions]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Likes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 likes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       username:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *       404:
 *         description: Post not found
 */
interactionsRouter.get(
  "/posts/:postId/likes",
  interactionController.getPostLikes
);

/**
 * @swagger
 * /api/interactions/posts/{postId}/liked:
 *   get:
 *     summary: Check if current user liked a post
 *     tags: [Interactions]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *                   example: true
 */
interactionsRouter.get(
  "/posts/:postId/liked",
  interactionController.checkUserLiked
);

/**
 * @swagger
 * /api/interactions/users/me/liked-posts:
 *   get:
 *     summary: Get all posts liked by current user
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Liked posts retrieved successfully
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
 */
interactionsRouter.get(
  "/users/me/liked-posts",
  authenticate,
  interactionController.getUserLikedPosts
);

export { interactionsRouter };
