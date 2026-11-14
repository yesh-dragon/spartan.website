import "dotenv/config";
import { EnvSchema, type ServerEnv } from "@agent-guard/shared";

export function parseEnv(raw: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "ENV"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `[Agent Guard] Server configuration error. Missing or invalid environment variables:\n${details}\n` +
        `Copy server/.env.example to server/.env and fill in the required keys.`,
    );
  }
  return parsed.data;
}

let cachedEnv: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (!cachedEnv) {
    cachedEnv = parseEnv(process.env);
  }
  return cachedEnv;
}

