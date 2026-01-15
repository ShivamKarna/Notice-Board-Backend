import type { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { ApiError } from "../utils/ApiError.ts";
import { AsyncHandler } from "../utils/AsyncHandler";
import { STATUS_CODE } from "../types/httpStatus.ts";
import { ApiResponse } from "../utils/ApiResponse";
import { AppAssert } from "../utils/AppAssert.ts";
import type { RequestListener } from "http";

export class NotificationController {
  getUserNotifications = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      const { unreadOnly } = req.query;

      const notifications = await notificationService.getUserNotification(
        req.user.userId,
        unreadOnly === "true",
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            notifications,
            "User Notfications served",
          ),
        );
    },
  );
  getUnreadCount = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      const result = await notificationService.getUnreadCount(req.user.userId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            result,
            "Unread Messages served",
          ),
        );
    },
  );
  markAsRead = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      const { notificationId } = req.params;

      AppAssert(
        notificationId,
        STATUS_CODE.NOT_FOUND,
        " Notification Id not given in params",
      );

      await notificationService.markAsRead(notificationId, req.user.userId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            {},
            "Notification marked as read",
          ),
        );
    },
  );
  markAllAsRead = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      const { notificationId } = req.params;

      AppAssert(
        notificationId,
        STATUS_CODE.NOT_FOUND,
        " Notification Id not given in params",
      );

      await notificationService.markAllAsRead(req.user.userId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            {},
            "All Notifications marked as read",
          ),
        );
    },
  );
  deleteNotification = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }
      const { notificationId } = req.params;

      AppAssert(
        notificationId,
        STATUS_CODE.NOT_FOUND,
        " Notification Id not given in params",
      );

      await notificationService.deleteNotification(
        notificationId,
        req.user.userId,
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, {}, "Notification delted"));
    },
  );
  deleteAllRead = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      await notificationService.deleteAllRead(req.user.userId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            {},
            "All Read notificaitions delted",
          ),
        );
    },
  );

  getPreferences = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication required");
      }

      const result = await notificationService.getUserPreferences(
        req.user.userId,
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            result,
            "User Preferences Returned",
          ),
        );
    },
  );
  updatePreferences = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication required");
      }

      const result = await notificationService.updateUserPreferences(
        req.user.userId,
        req.body,
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            result,
            "User Preferences Updated",
          ),
        );
    },
  );
}

export const notificationController = new NotificationController();
