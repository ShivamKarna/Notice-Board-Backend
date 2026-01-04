import type { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service";
import { STATUS_CODE } from "../types/httpStatus";
import { ApiResponse } from "../utils/ApiResponse";
import { AppAssert } from "../utils/AppAssert";
import { refreshTokenService } from "../services/refreshToken.service";
import {
  signAccessToken,
  verifyAccessToken,
  type AccesstokenPayload,
} from "../utils/auth/jwt";
import { deleteSession, getSessionByToken } from "../utils/auth/session";
import { ApiError } from "../utils/ApiError";
import { refreshTokens } from "../db/postgres/schemas";
import { revokeAllUserTokens } from "../utils/auth/refreshToken";
export class AuthController {
  async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      // call service
      const result = await authService.registerUser(req.body);

      // set cookies
      res.cookie("session_token", result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      });

      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      res
        .status(STATUS_CODE.CREATED)
        .json(
          new ApiResponse(STATUS_CODE.CREATED, "User Registration Successful")
        );
    } catch (error) {
      next(error);
    }
  }
  async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.loginUser(req.body);

      res.cookie("session_token", result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, "User Login SUccessful"));
    } catch (error) {
      next(error);
    }
  }
  async refreshTheTokens(req: Request, res: Response, next: NextFunction) {
    try {
      let refreshToken = req.cookies.refresh_token;
      if (!refreshToken) {
        refreshToken = req.body.refreshToken;
      }

      AppAssert(
        refreshToken,
        STATUS_CODE.BAD_REQUEST,
        "Refresh token is required"
      );

      // Get session token from cookies
      const sessionToken = req.cookies.session_token;
      AppAssert(
        sessionToken,
        STATUS_CODE.BAD_REQUEST,
        "Session token is required"
      );

      // Get session to extract sessionId
      const session = await getSessionByToken(sessionToken);
      AppAssert(
        session,
        STATUS_CODE.UNAUTHORIZED,
        "Invalid or expired session"
      );

      // verify old token, before giving new one
      const oldRecordOfToken = await refreshTokenService.verifyAndGetToken(
        refreshToken
      );

      const user = await authService.getUserById(oldRecordOfToken.userId);
      AppAssert(user, STATUS_CODE.NOT_FOUND, "User not found");

      const newRefreshToken = await refreshTokenService.rotateRefreshToken(
        refreshToken,
        oldRecordOfToken.userId
      );

      const newAccessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        sessionId: session.id,
      });

      // Set new refresh token cookie
      res.cookie("refresh_token", newRefreshToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(STATUS_CODE.SUCCESS).json(
        new ApiResponse(
          STATUS_CODE.SUCCESS,
          {
            accessToken: newAccessToken,
          },
          "Tokens refreshed successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }
  async logoutUser(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionToken = req.cookies.session_token;
      const refreshToken = req.cookies.refresh_token;

      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      let userId: string | undefined;

      if (accessToken) {
        const payload = verifyAccessToken<AccesstokenPayload>(accessToken);
        userId = payload?.userId;
      }

      if (sessionToken) {
        await deleteSession(sessionToken);
      }

      if (userId) {
        await authService.logoutuser(userId);
      }

      res.clearCookie("session_token");
      res.clearCookie("refresh_token");

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, {}, "User logged out"));
    } catch (error) {
      next(error);
    }
  }
  async Me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Not authenticated");
      }

      const user = await authService.getUserById(req.user.userId);

      AppAssert(user, STATUS_CODE.UNAUTHORIZED, "Not Authenticated");

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, { user }, "User Returned"));
    } catch (error) {
      next(error);
    }
  }
  async allSessions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Not authenticated");
      }
      const sessions = await refreshTokenService.getUserActiveTokens(
        req.user.userId
      );

      res.status(STATUS_CODE.SUCCESS).json(
        new ApiResponse(
          STATUS_CODE.SUCCESS,
          {
            sessions: sessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              expiresAt: s.expiresAt,
            })),
          },
          "All sessions returned"
        )
      );
    } catch (error) {
      next(error);
    }
  }
  async revokeAllSessions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Not authenticated");
      }

      await revokeAllUserTokens(
        req.user.userId,
        "User logged out from all devices"
      );

      res.clearCookie("session_token");
      res.clearCookie("refresh_token");

      return res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            null,
            "User logged out from all devices"
          )
        );
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
