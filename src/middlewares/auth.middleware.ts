import type { NextFunction, Request, Response } from "express";
import { getSessionByToken } from "../utils/auth/session";
import { verifyAccessToken, type AccesstokenPayload } from "../utils/auth/jwt";
import { AppAssert } from "../utils/AppAssert";
import { STATUS_CODE } from "../types/httpStatus";
import { ApiError } from "../utils/ApiError";
import { db } from "../db/postgres/db.postgres";
import { usersTable } from "../db/postgres/schemas";
import { and, eq } from "drizzle-orm";

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

    // Check if user is deleted
    const [user] = await db
      .select({ isDeleted: usersTable.isDeleted })
      .from(usersTable)
      .where(
        and(eq(usersTable.id, payload.userId), eq(usersTable.isDeleted, false))
      )
      .limit(1);

    if (!user) {
      throw new ApiError(
        STATUS_CODE.FORBIDDEN,
        "Account has been deleted or does not exist"
      );
    }

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
