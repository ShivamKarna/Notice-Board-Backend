import type { NextFunction, Request, Response } from "express";
import { UAParser } from "ua-parser-js";
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
import { revokeAllUserTokens } from "../utils/auth/refreshToken";
export class AuthController {
  async registerUser(req: Request, res: Response, next: NextFunction) {
    try {

      const guestSessionToken = req.cookies.session_token;
      // call service
      const userAgent = req.headers["user-agent"];
      const result = await authService.registerUser({ ...req.body, userAgent },guestSessionToken);

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
          new ApiResponse(
            STATUS_CODE.CREATED,
            result,
            "User registered successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }
  async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const guestSessionToken = req.cookies.session_token;

      const userAgent = req.headers["user-agent"];
      const result = await authService.loginUser({ ...req.body, userAgent }, guestSessionToken);

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
        .json(
          new ApiResponse(STATUS_CODE.SUCCESS, result, "User login successfull")
        );
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

      const user = req.user;
      const sessions = await refreshTokenService.getUserActiveTokens(
        user.userId
      );

      const parsedSessions = sessions.map((s) => {
        const parser = new UAParser(s.userAgent || "");
        const device = parser.getResult();

        return {
          id: s.id,
          device: {
            browser: `${device.browser.name || "Unknown"} ${
              device.browser.version || ""
            }`.trim(),
            os: `${device.os.name || "Unknown"} ${
              device.os.version || ""
            }`.trim(),
            device: device.device.type || "desktop",
            model: device.device.model || null,
          },
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          isCurrentSession: s.id === user.sessionId,
        };
      });

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            { sessions: parsedSessions },
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
  async getSessionById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Not authenticated");
      }

      const { id } = req.params;
      AppAssert(id, STATUS_CODE.BAD_REQUEST, "Session ID is required");

      const session = await refreshTokenService.getTokenById(id);
      AppAssert(session, STATUS_CODE.NOT_FOUND, "Session not found");

      // Ensure user can only access their own sessions
      AppAssert(
        session.userId === req.user.userId,
        STATUS_CODE.FORBIDDEN,
        "Access denied"
      );

      const parser = new UAParser(session.userAgent || "");
      const device = parser.getResult();

      res.status(STATUS_CODE.SUCCESS).json(
        new ApiResponse(
          STATUS_CODE.SUCCESS,
          {
            session: {
              id: session.id,
              device: {
                browser: `${device.browser.name || "Unknown"} ${
                  device.browser.version || ""
                }`.trim(),
                os: `${device.os.name || "Unknown"} ${
                  device.os.version || ""
                }`.trim(),
                device: device.device.type || "desktop",
                model: device.device.model || null,
                userAgent: session.userAgent,
              },
              createdAt: session.createdAt,
              expiresAt: session.expiresAt,
              isCurrentSession: session.id === req.user.sessionId,
            },
          },
          "Session returned"
        )
      );
    } catch (error) {
      next(error);
    }
  }
  async revokeSessionById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Not authenticated");
      }

      const { id } = req.params;
      AppAssert(id, STATUS_CODE.BAD_REQUEST, "Session ID is required");

      const session = await refreshTokenService.getTokenById(id);
      AppAssert(session, STATUS_CODE.NOT_FOUND, "Session not found");

      // Ensure user can only revoke their own sessions
      AppAssert(
        session.userId === req.user.userId,
        STATUS_CODE.FORBIDDEN,
        "Access denied"
      );

      await refreshTokenService.revokeToken(id);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            null,
            "Session revoked successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Not authenticated");
      }

      const result = await authService.deleteAccount(req.user.userId);

      // Clear cookies
      res.clearCookie("session_token");
      res.clearCookie("refresh_token");

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            result,
            "Account deleted successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
