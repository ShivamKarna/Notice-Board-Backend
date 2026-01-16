import { Router } from "express";
import { notificationController } from "../../controllers/notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { z } from "zod";
import { updateNotificationPreferencesSchema } from "../../utils/notificationPreferencesSchemas/notificationPreferences.validation";

const notificationRouter = Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
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
 *         description: Number of notifications per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter to show only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 total:
 *                   type: integer
 *                 unreadCount:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
notificationRouter.get(
  "/",
  authenticate,
  notificationController.getUserNotifications
);

/**
 * @swagger
 * /api/notifications/unread/count:
 *   get:
 *     summary: Get count of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Unauthorized
 */
notificationRouter.get(
  "/unread/count",
  authenticate,
  notificationController.getUnreadCount
);

// Get notification preferences
/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emailNotifications:
 *                   type: boolean
 *                   example: true
 *                 pushNotifications:
 *                   type: boolean
 *                   example: true
 *                 postApproval:
 *                   type: boolean
 *                   example: true
 *                 postRejection:
 *                   type: boolean
 *                   example: true
 *                 newComment:
 *                   type: boolean
 *                   example: true
 *                 newLike:
 *                   type: boolean
 *                   example: false
 *                 groupInvitation:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 */
notificationRouter.get(
  "/preferences",
  authenticate,
  notificationController.getPreferences
);

/**
 * @swagger
 * /api/notifications/preferences:
 *   patch:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               postApproval:
 *                 type: boolean
 *               postRejection:
 *                 type: boolean
 *               newComment:
 *                 type: boolean
 *               newLike:
 *                 type: boolean
 *               groupInvitation:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorized
 */
notificationRouter.patch(
  "/preferences",
  authenticate,
  validate(z.object({ body: updateNotificationPreferencesSchema })),
  notificationController.updatePreferences
);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
notificationRouter.patch(
  "/:notificationId/read",
  authenticate,
  notificationController.markAsRead
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
notificationRouter.patch(
  "/read-all",
  authenticate,
  notificationController.markAllAsRead
);

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
notificationRouter.delete(
  "/:notificationId",
  authenticate,
  notificationController.deleteNotification
);

/**
 * @swagger
 * /api/notifications/read/all:
 *   delete:
 *     summary: Delete all read notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All read notifications deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All read notifications deleted
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
notificationRouter.delete(
  "/read/all",
  authenticate,
  notificationController.deleteAllRead
);

export { notificationRouter };
