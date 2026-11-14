import pino from "pino";
import { getEnv } from "../config/env.js";

export function createLogger(level?: string) {
  return pino({
    level: level ?? process.env.LOG_LEVEL ?? "info",
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "*.apiKey",
        "*.api_key",
        "*.GEMINI_API_KEY",
        "*.SUPABASE_SERVICE_ROLE_KEY",
        "*.body",
        "*.bodyHtml",
        "*.body_html",
        "*.raw",
        "*.rawValue",
      ],
      censor: "[REDACTED]",
    },
  });
}

let loggerInstance: ReturnType<typeof createLogger> | null = null;

export function getLogger() {
  if (!loggerInstance) {
    let level = "info";
    try {
      level = getEnv().LOG_LEVEL;
    } catch {
      level = process.env.LOG_LEVEL ?? "info";
    }
    loggerInstance = createLogger(level);
  }
  return loggerInstance;
}

