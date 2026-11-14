import express, { type Express } from "express";
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

export function createApp(deps: AppDependencies): Express {
  const app = express();

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

  const allowedOrigins = new Set(
    deps.env.CLIENT_ORIGIN.split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  );
  if (deps.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:5173");
    allowedOrigins.add("http://127.0.0.1:5173");
  }

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.has(origin)) {
          cb(null, true);
          return;
        }
        cb(null, false);
      },
      credentials: false,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
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

