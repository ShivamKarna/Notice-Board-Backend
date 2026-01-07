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
