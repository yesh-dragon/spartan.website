import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BootstrapReqSchema } from "@agent-guard/shared";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { bootstrapUserWorkspace } from "../services/seed.js";

export function createBootstrapRouter(supabase: SupabaseClient) {
  const router = Router();

  router.post("/", validateBody(BootstrapReqSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await bootstrapUserWorkspace(supabase, req.userId!, req.userEmail);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

