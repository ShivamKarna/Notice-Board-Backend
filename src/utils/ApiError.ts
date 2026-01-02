import { type httpStatusCode } from "../types/httpStatus";
class ApiError extends Error {
  constructor(readonly statusCode: httpStatusCode, message: string) {
    super(message);
  }
}

export { ApiError };
