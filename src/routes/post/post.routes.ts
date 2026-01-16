import { Router } from "express";
import { postController } from "../../controllers/post.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  uploadMultiple,
  handleMulterError,
  uploadSingle,
} from "../../middlewares/upload.middleware";
import { z } from "zod";
import {
  createPostSchema,
  updatePostSchema,
  rejectPostSchema,
} from "../../utils/PostSchemas/post.validation";
import { ensureGuestSession } from "../../middlewares/guest.middleware";
const postRouter = Router();

// protected routes
/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
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
 *               - title
 *               - content
 *               - groupId
 *             properties:
 *               title:
 *                 type: string
 *                 example: Important Announcement
 *               content:
 *                 type: string
 *                 example: This is the post content
 *               groupId:
 *                 type: string
 *                 example: grp_123456
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
postRouter.post(
  "/",
  authenticate,
  validate(z.object({ body: createPostSchema })),
  postController.createPost
);

/**
 * @swagger
 * /api/posts/{postId}/submit:
 *   post:
 *     summary: Submit post for approval
 *     tags: [Posts]
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
 *         description: Post submitted successfully
 */
postRouter.post("/:postId/submit", authenticate, postController.submitPost);

/**
 * @swagger
 * /api/posts/{postId}/approve:
 *   post:
 *     summary: Approve a post
 *     tags: [Posts]
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
 *         description: Post approved successfully
 *       403:
 *         description: Insufficient permissions
 */
postRouter.post("/:postId/approve", authenticate, postController.approvePost);

/**
 * @swagger
 * /api/posts/{postId}/reject:
 *   post:
 *     summary: Reject a post
 *     tags: [Posts]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Content does not meet guidelines
 *     responses:
 *       200:
 *         description: Post rejected successfully
 */
postRouter.post(
  "/:postId/reject",
  authenticate,
  validate(z.object({ body: rejectPostSchema })),
  postController.rejectPost
);

/**
 * @swagger
 * /api/posts/{postId}:
 *   patch:
 *     summary: Update post
 *     tags: [Posts]
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
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 */
postRouter.patch(
  "/:postId",
  authenticate,
  validate(z.object({ body: updatePostSchema })),
  postController.updatePost
);

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Delete post
 *     tags: [Posts]
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
 *         description: Post deleted successfully
 */
postRouter.delete("/:postId", authenticate, postController.deletePost);

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
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
 *         description: Post not found
 */
postRouter.get("/:postId", ensureGuestSession, postController.getPostById);
postRouter.get("/:postId", postController.getPostById);

/**
 * @swagger
 * /api/posts/user/{userId}:
 *   get:
 *     summary: Get user's posts
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
postRouter.get("/user/:userId", postController.getUserPosts);

/**
 * @swagger
 * /api/posts/{postId}/media:
 *   post:
 *     summary: Upload media to post
 *     tags: [Posts]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 */
postRouter.post(
  "/:postId/media",
  authenticate,
  uploadMultiple,
  handleMulterError,
  postController.uploadMedia
);

/**
 * @swagger
 * /api/posts/{postId}/media/{mediaId}:
 *   delete:
 *     summary: Remove media from post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media removed successfully
 */
postRouter.delete(
  "/:postId/media/:mediaId",
  authenticate,
  postController.removeMedia
);

export { postRouter };
