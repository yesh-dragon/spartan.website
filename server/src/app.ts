import express, { type Express, type Request } from "express";
import cors from "cors";
import helmet from "helmet";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServerEnv } from "@agent-guard/shared";
import {
  createAuthMiddleware,
  createSupabaseTokenVerifier,
  type TokenVerifier,
} from "./middleware/auth.js";
import { generalRateLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/error.js";
import type { GuardDeps } from "./services/guardRunner.js";
import { createHealthRouter } from "./routes/health.js";
import { createBootstrapRouter } from "./routes/bootstrap.js";
import { createEmailsRouter } from "./routes/emails.js";
import { createGuardRouter } from "./routes/guard.js";
import { createAgentRouter, type AgentRunnerFn } from "./routes/agent.js";
import { createApprovalsRouter } from "./routes/approvals.js";
import { createAlertsRouter } from "./routes/alerts.js";
import { createAuditRouter } from "./routes/audit.js";
import { createSettingsRouter } from "./routes/settings.js";
import { createStatsRouter } from "./routes/stats.js";

export interface AppDependencies {
  env: ServerEnv;
  supabase: SupabaseClient;
  tokenVerifier?: TokenVerifier;
  guardDeps?: GuardDeps;
  agentRunner?: AgentRunnerFn;
}

function buildAllowedOrigins(env: Pick<ServerEnv, "CLIENT_ORIGIN" | "NODE_ENV">): Set<string> {
  const allowedOrigins = new Set(
    env.CLIENT_ORIGIN.split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  );
  if (env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:5173");
    allowedOrigins.add("http://127.0.0.1:5173");
  }
  for (const vercelHost of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    const trimmed = vercelHost?.trim();
    if (trimmed) {
      allowedOrigins.add(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    }
  }
  return allowedOrigins;
}

function isSameHostOrigin(origin: string, req: Request): boolean {
  const forwardedHost = req.headers["x-forwarded-host"];
  const rawHost = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : (forwardedHost ?? req.headers.host);
  const host = rawHost?.split(",")[0]?.trim().toLowerCase();
  if (!host) return false;

  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = (
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ?? req.protocol
  )
    .split(",")[0]
    ?.trim()
    .toLowerCase();

  try {
    const parsed = new URL(origin);
    return parsed.host.toLowerCase() === host && (!proto || parsed.protocol === `${proto}:`);
  } catch {
    return false;
  }
}

export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: deps.env.NODE_ENV === "production",
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
        },
      },
    }),
  );

  const allowedOrigins = buildAllowedOrigins(deps.env);

  app.use(
    cors<Request>((req, cb) => {
      const origin = req.headers.origin;
      const isAllowed = !origin || allowedOrigins.has(origin) || isSameHostOrigin(origin, req);
      cb(null, {
        origin: isAllowed,
        credentials: false,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
      });
    }),
  );

  app.use(express.json({ limit: "100kb" }));
  app.use("/api", generalRateLimiter);

  // Public liveness check
  app.use("/api/health", createHealthRouter(deps.env));

  // Authenticated routes
  const verifier = deps.tokenVerifier ?? createSupabaseTokenVerifier(deps.supabase);
  const auth = createAuthMiddleware(verifier);

  app.use("/api/bootstrap", auth, createBootstrapRouter(deps.supabase));
  app.use("/api/emails", auth, createEmailsRouter(deps.supabase));
  app.use("/api/guard", auth, createGuardRouter(deps.supabase, deps.guardDeps));
  app.use(
    "/api/agent",
    auth,
    createAgentRouter(deps.supabase, {
      ...deps.guardDeps,
      agentRunner: deps.agentRunner,
    }),
  );
  app.use("/api/approvals", auth, createApprovalsRouter(deps.supabase));
  app.use("/api/alerts", auth, createAlertsRouter(deps.supabase));
  app.use("/api/audit", auth, createAuditRouter(deps.supabase, deps.env.DEMO_MODE));
  app.use("/api/stats", auth, createStatsRouter(deps.supabase));
  app.use("/api/settings", auth, createSettingsRouter(deps.supabase));

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Requested endpoint does not exist.",
      },
    });
  });

  app.use(errorHandler);
  return app;
}

