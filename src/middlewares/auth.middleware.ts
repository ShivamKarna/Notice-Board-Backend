import type { NextFunction, Request, Response } from "express";
import { getSessionByToken } from "../utils/auth/session";
import { verifyAccessToken, type AccesstokenPayload } from "../utils/auth/jwt";
import { AppAssert } from "../utils/AppAssert";
import { STATUS_CODE } from "../types/httpStatus";
import { ApiError } from "../utils/ApiError";

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      const token = req.cookies.access_token;
    }
    AppAssert(token, STATUS_CODE.UNAUTHORIZED, "Authentication Required !!");

    const payload = verifyAccessToken<AccesstokenPayload>(token);

    AppAssert(payload, STATUS_CODE.UNAUTHORIZED, "Invalid or expired Token");

    // attach user to Request
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

const authenticateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionToken = req.cookies.session_token;
    AppAssert(sessionToken, STATUS_CODE.UNAUTHORIZED, "Session required !");

    const session = await getSessionByToken(sessionToken);
    if (!session || session?.isGuest) {
      throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Invalid Session");
    }
    req.sessionToken = sessionToken;
    next();
  } catch (error) {
    next(error);
  }
};

export { authenticate, authenticateSession };
