import type { RequestHandler, Request, Response, NextFunction } from "express";

export type asyncHandler = <T>(
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T>;

const errorConstructor = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

export type ErrorForwarder = (error: Error) => void;

const forwardError = (nextFn: NextFunction, error: unknown) => {
  nextFn(errorConstructor(error));
};

export const AsyncHandler = (handler: asyncHandler): RequestHandler => {
  return (req, res, next) => {
    void handler(req, res, next).catch((error: unknown) => {
      forwardError(next, error);
    });
  };
};
