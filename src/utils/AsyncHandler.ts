import type { RequestHandler, Request, Response, NextFunction } from "express";

export type AsyncHandlerFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const AsyncHandler = (handler: AsyncHandlerFunction): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
