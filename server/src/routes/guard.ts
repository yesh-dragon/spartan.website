import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CheckActionReqSchema, CheckInputReqSchema } from "@agent-guard/shared";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { aiGuardRateLimiter } from "../middleware/rateLimit.js";
import { AppError } from "../middleware/error.js";
import {
  executeActionCheck,
  executeInputScan,
  type GuardDeps,
} from "../services/guardRunner.js";

export function createGuardRouter(supabase: SupabaseClient, deps: GuardDeps = {}) {
  const router = Router();
  router.use(aiGuardRateLimiter);

  router.post(
    "/check-input",
    validateBody(CheckInputReqSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const body = req.body as
          | { emailId: string; forceJudge?: boolean }
          | { subject: string; bodyHtml: string; forceJudge?: boolean };

        let emailId: string | null = null;
        let subject: string;
        let bodyHtml: string;

        if ("emailId" in body) {
          const { data: email, error } = await supabase
            .from("emails")
            .select("*")
            .eq("id", body.emailId)
            .eq("user_id", req.userId!)
            .maybeSingle();

          if (error) throw new Error(error.message);
          if (!email) {
            throw new AppError(404, "EMAIL_NOT_FOUND", "Email not found in your inbox.");
          }
          emailId = email.id;
          subject = email.subject;
          bodyHtml = email.body_html;
        } else {
          subject = body.subject;
          bodyHtml = body.bodyHtml;
        }

        const result = await executeInputScan(
          supabase,
          {
            userId: req.userId!,
            emailId,
            subject,
            bodyHtml,
            forceJudge: body.forceJudge,
          },
          deps,
        );

        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/check-action",
    validateBody(CheckActionReqSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const body = req.body as {
          action: "send_email" | "forward_email" | "reply_email" | "delete_email" | "share_file";
          to: string[];
          subject: string;
          body: string;
          sourceEmailId?: string;
        };

        if (body.sourceEmailId) {
          const { data: sourceEmail, error } = await supabase
            .from("emails")
            .select("id")
            .eq("id", body.sourceEmailId)
            .eq("user_id", req.userId!)
            .maybeSingle();

          if (error) throw new Error(error.message);
          if (!sourceEmail) {
            throw new AppError(404, "EMAIL_NOT_FOUND", "Source email not found in your inbox.");
          }
        }

        const result = await executeActionCheck(
          supabase,
          {
            userId: req.userId!,
            action: body.action,
            to: body.to,
            subject: body.subject,
            body: body.body,
            sourceEmailId: body.sourceEmailId,
          },
          deps,
        );

        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

