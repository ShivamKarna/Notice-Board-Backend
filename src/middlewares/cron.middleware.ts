import { type NextFunction, type Response, type Request } from "express";
import { ApiError } from "../utils/ApiError";
import { STATUS_CODE } from "../types/httpStatus";

export const authenticateCron = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Unauthorized");
    }

    next();
  } catch (error) {
    next(error);
  }
};
