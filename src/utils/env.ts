import { STATUS_CODE } from "../types/httpStatus";
import { ApiError } from "./ApiError";
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (!value || value === undefined || typeof value === "undefined") {
    throw new ApiError(
      STATUS_CODE.NOT_FOUND,
      "Given Key doesn't exist in .env file"
    );
  }
  return value;
};

export const JWT_SECRET = getEnv("JWT_SECRET");
export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
