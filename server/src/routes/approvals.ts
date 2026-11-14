import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApprovalsQuerySchema, DecisionReqSchema } from "@agent-guard/shared";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { validateBody, validateQuery, type ValidatedRequest } from "../middleware/validate.js";
import {
  decidePendingAction,
  expireOverduePendingActions,
} from "../services/approvals.js";

export function createApprovalsRouter(supabase: SupabaseClient) {
  const router = Router();

  router.get(
    "/",
    validateQuery(ApprovalsQuerySchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await expireOverduePendingActions(supabase);
        const queryData = (req as ValidatedRequest).validatedQuery as { status?: string } | undefined;
        const status = queryData?.status ?? "pending";

        let query = supabase
          .from("pending_actions")
          .select("*")
          .eq("user_id", req.userId!)
          .order("created_at", { ascending: false });

        if (status !== "all") {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        res.json({ approvals: data ?? [] });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:id/decision",
    validateBody(DecisionReqSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const actionId = String(req.params.id);
        if (!/^[0-9a-f-]{36}$/i.test(actionId)) {
          res.status(400).json({
            error: { code: "VALIDATION_ERROR", message: "Invalid pending action UUID." },
          });
          return;
        }
        const { decision } = req.body as { decision: "approve" | "deny" | "approve_redacted" };
        const updated = await decidePendingAction(supabase, {
          userId: req.userId!,
          actionId,
          decision,
        });
        res.json({ approval: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
