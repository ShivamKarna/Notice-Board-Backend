import { STATUS_CODE } from "../types/httpStatus";
import { ApiError } from "./ApiError";

export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (!value || value === undefined || typeof value === "undefined") {
    throw new ApiError(
      STATUS_CODE.NOT_FOUND,
      "Given Key doesn't exist in .env file"
    );
  }
  return value;
};

export const pgDB_URL = getEnv("POSTGRES_DATABASE_URL");

export const JWT_SECRET = getEnv("JWT_SECRET");
export const JWT_SECRET_EXPIRES_IN = getEnv("JWT_SECRET_EXPIRES_IN");

export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
export const JWT_REFRESH_SECRET_EXPIRES_IN = getEnv(
  "JWT_REFRESH_SECRET_EXPIRES_IN"
);

export const SESSION_SECRET = getEnv("SESSION_SECRET");

export const CLIENT_URL = getEnv("CLIENT_URL");
