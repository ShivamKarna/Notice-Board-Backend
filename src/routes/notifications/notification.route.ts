import { Router } from "express";
import { notificationController } from "../../controllers/notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { z } from "zod";
import { updateNotificationPreferencesSchema } from "../../utils/notificationPreferencesSchemas/notificationPreferences.validation";

const notificationRouter = Router();

notificationRouter.get(
  "/",
  authenticate,
  notificationController.getUserNotifications,
);

notificationRouter.get(
  "/unread/count",
  authenticate,
  notificationController.getUnreadCount,
);

// Get notification preferences
notificationRouter.get(
  "/preferences",
  authenticate,
  notificationController.getPreferences,
);

notificationRouter.patch(
  "/preferences",
  authenticate,
  validate(z.object({ body: updateNotificationPreferencesSchema })),
  notificationController.updatePreferences,
);

notificationRouter.patch(
  "/:notificationId/read",
  authenticate,
  notificationController.markAsRead,
);

notificationRouter.patch(
  "/read-all",
  authenticate,
  notificationController.markAllAsRead,
);

notificationRouter.delete(
  "/:notificationId",
  authenticate,
  notificationController.deleteNotification,
);

notificationRouter.delete(
  "/read/all",
  authenticate,
  notificationController.deleteAllRead,
);

export { notificationRouter };
