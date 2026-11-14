import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AddEmailReqSchema } from "@agent-guard/shared";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

export function createEmailsRouter(supabase: SupabaseClient) {
  const router = Router();

  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", req.userId!)
        .order("received_at", { ascending: false });

      if (error) throw new Error(error.message);
      res.json({ emails: data ?? [] });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", validateBody(AddEmailReqSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { from, subject, bodyHtml } = req.body as {
        from: string;
        subject: string;
        bodyHtml: string;
      };

      const { data, error } = await supabase
        .from("emails")
        .insert({
          user_id: req.userId!,
          from_address: from,
          subject,
          body_html: bodyHtml,
          is_seed: false,
          quarantined: false,
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed inserting test email");
      }

      res.status(201).json({ email: data });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

