import type { NextFunction, Request, Response } from "express";
import { z, type ZodSchema } from "zod";

const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.safeParseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};

export { validate };
