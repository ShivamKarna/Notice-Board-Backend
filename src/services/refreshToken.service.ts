import crypto from "crypto";
import { db } from "../db/postgres/db.postgres";
import { refreshTokens } from "../db/postgres/schemas";
import { eq } from "drizzle-orm";
import { ApiError } from "../utils/ApiError";
import { STATUS_CODE } from "../types/httpStatus";
import ms from "ms";
import { createRefreshToken } from "../utils/auth/jwt";
import { JWT_REFRESH_SECRET_EXPIRES_IN } from "../utils/env";

export class RefreshTokenService {
  async verifyAndGetToken(token: string) {
    const record = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);

    const tokenData = record[0];

    if (!tokenData) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, "Token not found");
    }
    if (tokenData.isRevoked) {
      throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Token has been revoked");
    }
    if (new Date() > new Date(tokenData.expiresAt)) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, "Token has been expired");
    }

    return tokenData;
  }

  async rotateRefreshToken(oldToken: string, userId: string) {
    // revoke oldtoken
    // provide new token
    await db
      .update(refreshTokens)
      .set({
        isRevoked: true, // soft delete
        revokedAt: new Date(),
        revokedReason: "Rotated Token for new session",
      })
      .where(eq(refreshTokens.token, oldToken));

    const { token: newTokenString, tokenId } = await createRefreshToken(userId);

    // Update the old token with the replacedBy field
    await db
      .update(refreshTokens)
      .set({
        replacedBy: tokenId,
      })
      .where(eq(refreshTokens.token, oldToken));

    return { token: newTokenString, tokenId };
  }
}

export const refreshTokenService = new RefreshTokenService();
