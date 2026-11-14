import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AuditQuerySchema } from "@agent-guard/shared";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { validateQuery, type ValidatedRequest } from "../middleware/validate.js";
import {
  listAuditEntries,
  simulateAuditTamper,
  verifyUserAuditChain,
} from "../services/audit.js";

export function createAuditRouter(supabase: SupabaseClient, demoMode: boolean) {
  const router = Router();

  router.get(
    "/",
    validateQuery(AuditQuerySchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const queryData = (req as ValidatedRequest).validatedQuery as
          | { cursor?: number; limit?: number }
          | undefined;
        const cursor = queryData?.cursor;
        const limit = queryData?.limit ?? 50;
        const result = await listAuditEntries(supabase, req.userId!, cursor, limit);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post("/verify", async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await verifyUserAuditChain(supabase, req.userId!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post("/simulate-tamper", async (req: AuthenticatedRequest, res, next) => {
    if (!demoMode) {
      res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Route not available outside DEMO_MODE.",
        },
      });
      return;
    }

    try {
      const result = await simulateAuditTamper(supabase, req.userId!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
