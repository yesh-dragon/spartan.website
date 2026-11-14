import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AlertsQuerySchema } from "@agent-guard/shared";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { validateQuery, type ValidatedRequest } from "../middleware/validate.js";
import { AppError } from "../middleware/error.js";

export function createAlertsRouter(supabase: SupabaseClient) {
  const router = Router();

  router.get(
    "/",
    validateQuery(AlertsQuerySchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const queryData = (req as ValidatedRequest).validatedQuery as
          | { severity?: string; acknowledged?: string }
          | undefined;
        const severity = queryData?.severity;
        const acknowledged = queryData?.acknowledged;

        let query = supabase
          .from("alerts")
          .select("*")
          .eq("user_id", req.userId!)
          .order("created_at", { ascending: false });

        if (severity) {
          query = query.eq("severity", severity);
        }
        if (acknowledged !== undefined) {
          query = query.eq("acknowledged", acknowledged === "true");
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        res.json({ alerts: data ?? [] });
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch("/:id/ack", async (req: AuthenticatedRequest, res, next) => {
    try {
      const alertId = String(req.params.id);
      if (!/^[0-9a-f-]{36}$/i.test(alertId)) {
        throw new AppError(400, "VALIDATION_ERROR", "Invalid alert UUID.");
      }

      const { data, error } = await supabase
        .from("alerts")
        .update({ acknowledged: true })
        .eq("id", alertId)
        .eq("user_id", req.userId!)
        .select("*")
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) {
        throw new AppError(404, "NOT_FOUND", "Alert not found.");
      }

      res.json({ alert: data });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
