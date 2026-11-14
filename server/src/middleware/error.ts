import type { NextFunction, Request, Response } from "express";
import { getLogger } from "../lib/logger.js";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const logger = getLogger();
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Handle Express JSON body-parser errors (e.g., payload > 100kb or malformed JSON)
  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    (err as { type?: string }).type === "entity.too.large"
  ) {
    res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body exceeds the 100 KB maximum limit.",
      },
    });
    return;
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    (err as { type?: string }).type === "entity.parse.failed"
  ) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Malformed JSON request payload.",
      },
    });
    return;
  }

  logger.error({ err: err instanceof Error ? err.message : "Unknown error" }, "Unhandled API error");

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An internal server error occurred.",
    },
  });
}

