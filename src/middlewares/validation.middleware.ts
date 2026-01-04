import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject } from "zod/v3";

const validate = async (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
    } catch (error) {
      next(error);
    }
  };
};

export {validate};
