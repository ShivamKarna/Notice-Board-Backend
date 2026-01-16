import {
  Router,
  type NextFunction,
  type Response,
  type Request,
} from "express";
import { STATUS_CODE } from "../types/httpStatus";
import { refreshTokenService } from "../services/refreshToken.service";
import { ApiResponse } from "../utils/ApiResponse";
import { authenticateCron } from "../middlewares/cron.middleware";
import { authService } from "../services/auth.service";

const cronRouter = Router();

/**
 * @swagger
 * /api/cron/clean-up-tokens:
 *   get:
 *     summary: Clean up expired refresh tokens (Cron job)
 *     tags: [Health]
 *     description: Internal endpoint for scheduled cleanup of expired refresh tokens. Requires CRON_SECRET.
 *     parameters:
 *       - in: header
 *         name: x-cron-secret
 *         required: true
 *         schema:
 *           type: string
 *         description: Cron job secret for authentication
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Cleaned up 25 expired tokens
 *                 data:
 *                   type: integer
 *                   example: 25
 *       401:
 *         description: Invalid or missing cron secret
 */
cronRouter.get(
  "/clean-up-tokens",
  authenticateCron,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deletedCount = await refreshTokenService.cleanupExpiredTokens();

      return res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            deletedCount,
            `Cleaned up ${deletedCount} expired tokens`
          )
        );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/cron/clean-up-deleted-users:
 *   get:
 *     summary: Permanently delete soft-deleted users (Cron job)
 *     tags: [Health]
 *     description: Internal endpoint for scheduled permanent deletion of users soft-deleted >30 days ago. Requires CRON_SECRET.
 *     parameters:
 *       - in: header
 *         name: x-cron-secret
 *         required: true
 *         schema:
 *           type: string
 *         description: Cron job secret for authentication
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Permanently deleted 5 user accounts (soft-deleted >30 days ago)
 *                 data:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Invalid or missing cron secret
 */
cronRouter.get(
  "/clean-up-deleted-users",
  authenticateCron,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deletedCount = await authService.permanentlyDeleteOldAccounts();

      return res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            deletedCount,
            `Permanently deleted ${deletedCount} user accounts (soft-deleted >30 days ago)`
          )
        );
    } catch (error) {
      next(error);
    }
  }
);

export { cronRouter };
