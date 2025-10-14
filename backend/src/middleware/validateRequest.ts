import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

export const validateRequest = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        error: "Invalid request data",
        details: errors,
      });
    }

    req.body = result.data;
    next();
  };
};
