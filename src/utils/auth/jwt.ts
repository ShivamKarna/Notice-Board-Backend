import * as jwt from "jsonwebtoken";
import type { SignOptions} from "jsonwebtoken";
import {
  JWT_SECRET,
  JWT_SECRET_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_SECRET_EXPIRES_IN,
} from "../env";

// access tokens payload
export type AccesstokenPayload = {
  userId: string;
  email: string;
  sessionId: string;
};
// refresh tokens payload
export type RefreshtokenPayload = {
  sessionId: string;
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
