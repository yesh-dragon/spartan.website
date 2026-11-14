import type { IncomingMessage, ServerResponse } from "node:http";
import type { Express } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServerEnv } from "@agent-guard/shared";
import { createApp } from "./app.js";
import { parseEnv } from "./config/env.js";
import { getSupabaseAdmin } from "./lib/supabase.js";

export interface ServerlessDeps {
  getEnv?: () => ServerEnv;
  getSupabase?: (env: ServerEnv) => SupabaseClient;
}

function hydratePublicSupabaseEnv(): void {
  if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  }
  if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
    process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  }
}

/**
 * Wraps the Express application in a lazy Node HTTP handler for serverless platforms
 * so configuration failures return JSON 503 instead of an HTML runtime crash page.
 */
export function createServerlessHandler(deps: ServerlessDeps = {}) {
  let cachedApp: Express | null = null;

  const resolveEnv =
    deps.getEnv ??
    (() => {
      hydratePublicSupabaseEnv();
      return parseEnv(process.env);
    });
  const resolveSupabase = deps.getSupabase ?? (() => getSupabaseAdmin());

  return (req: IncomingMessage, res: ServerResponse): void => {
    try {
      if (!cachedApp) {
        const env = resolveEnv();
        const supabase = resolveSupabase(env);
        cachedApp = createApp({ env, supabase });
      }
      cachedApp(req, res);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Agent Guard API failed to initialize required environment configuration.";
      res.statusCode = 503;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          error: {
            code: "SERVER_MISCONFIGURED",
            message,
          },
        }),
      );
    }
  };
}

