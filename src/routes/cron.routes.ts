import { RemotePreparedQuery } from "drizzle-orm/sqlite-proxy";
import {
  Router,
  type NextFunction,
  type Response,
  type Request,
} from "express";
import { ApiError } from "../utils/ApiError";
import { STATUS_CODE } from "../types/httpStatus";
import { refreshTokenService } from "../services/refreshToken.service";
import { ApiResponse } from "../utils/ApiResponse";

const cronRouter = Router();

cronRouter.get(
  "/clean-up-tokens",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Unauthorized");
      }
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

export { cronRouter };
