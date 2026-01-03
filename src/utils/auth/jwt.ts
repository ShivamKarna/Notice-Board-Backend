import * as jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import {
  JWT_SECRET,
  JWT_SECRET_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_SECRET_EXPIRES_IN,
} from "../env";
import { db } from "../../db/postgres/db.postgres";
import { refreshTokens } from "../../db/postgres/schemas";
import { eq } from "drizzle-orm";
import ms from "ms";
import { AppAssert } from "../AppAssert";
import { STATUS_CODE } from "../../types/httpStatus";

// access tokens payload
export type AccesstokenPayload = {
  userId: string;
  email: string;
  sessionId: string;
};
// refresh tokens payload
export type RefreshtokenPayload = {
  userId: string;
  tokenId: string;
};
// token options with signoptions and secret
type tokenOptions = SignOptions & { secret: string };
// access token options and refreshtoken options
export const AccesstokenOptions: tokenOptions = {
  secret: JWT_SECRET,
  expiresIn: JWT_SECRET_EXPIRES_IN as SignOptions["expiresIn"],
};
export const RefreshtokenOptions: tokenOptions = {
  secret: JWT_REFRESH_SECRET,
  expiresIn: JWT_REFRESH_SECRET_EXPIRES_IN as SignOptions["expiresIn"],
};
// sign tokens
export const signAccessToken = (
  payload: AccesstokenPayload,
  options: tokenOptions = AccesstokenOptions
): string => {
  const { secret, ...restOptions } = options;
  return jwt.sign(payload, secret, restOptions);
};

export const signRefreshToken = (
  payload: RefreshtokenPayload,
  options: tokenOptions = RefreshtokenOptions
): string => {
  const { secret, ...restOptions } = options;
  return jwt.sign(payload, secret, restOptions);
};

export async function createRefreshToken(
  userId: string
): Promise<{ token: string; tokenId: string }> {
  const expiresAt = new Date(
    Date.now() + ms(JWT_REFRESH_SECRET_EXPIRES_IN as any)
  );

  // Create token record first ,without JWT token yet
  const [tokenRecord] = await db
    .insert(refreshTokens)
    .values({
      token: "placeholder", // fow now, just temporary 
      userId,
      expiresAt,
    })
    .returning();

  AppAssert(tokenRecord, STATUS_CODE.INTERNAL_SERVER_ERROR, "Failed to create refresh token record");
  // Generate JWT with tokenId
  const token = signRefreshToken({
    userId,
    tokenId: tokenRecord.id,
  });

  // Update the record with actual token
  await db
    .update(refreshTokens)
    .set({ token })
    .where(eq(refreshTokens.id, tokenRecord.id));

  return {
    token,
    tokenId: tokenRecord.id,
  };
}

// verify tokens
export const verifyAccessToken = <T extends object>(
  token: string,
  secret: string = JWT_SECRET
): T | null => {
  try {
    return jwt.verify(token, secret) as T;
  } catch (error) {
    return null;
  }
};
export const verifyRefreshToken = <T extends object>(
  token: string,
  secret: string = JWT_REFRESH_SECRET
): T | null => {
  try {
    return jwt.verify(token, secret) as T;
  } catch (error) {
    return null;
  }
};
