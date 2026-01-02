import { ApiError } from "./ApiError";
import { type httpStatusCode } from "../types/httpStatus";

function AppAssert<T>(
  condition: T,
  statusCode: httpStatusCode,
  message: string
): asserts condition is NonNullable<T> {
  if (!condition) {
    throw new ApiError(statusCode, message);
  }
}

export { AppAssert };
