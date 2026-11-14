import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export interface ValidatedRequest extends Request {
  validatedQuery?: unknown;
}

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join("; ");
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message,
        },
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "query"}: ${issue.message}`)
        .join("; ");
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message,
        },
      });
      return;
    }
    (req as ValidatedRequest).validatedQuery = parsed.data;
    next();
  };
}
