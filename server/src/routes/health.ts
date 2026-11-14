import { Router } from "express";
import type { ServerEnv } from "@agent-guard/shared";

export function createHealthRouter(env: Pick<ServerEnv, "DEMO_MODE" | "GEMINI_MODEL">) {
  const router = Router();
  router.get("/", (_req, res) => {
    res.json({
      ok: true,
      status: "healthy",
      demoMode: env.DEMO_MODE,
      model: env.GEMINI_MODEL,
      timestamp: new Date().toISOString(),
    });
  });
  return router;
}

