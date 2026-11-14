import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SettingsReqSchema } from "@agent-guard/shared";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { getUserSettings } from "../services/guardRunner.js";
import { appendAuditEvent } from "../services/audit.js";

export function createSettingsRouter(supabase: SupabaseClient) {
  const router = Router();

  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const settings = await getUserSettings(supabase, req.userId!);
      res.json({ settings });
    } catch (err) {
      next(err);
    }
  });

  router.put("/", validateBody(SettingsReqSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { mode, judgeEnabled, shield, customPhrases, approvalTimeoutMinutes } = req.body as {
        mode: "monitor" | "enforce";
        judgeEnabled: boolean;
        shield: Record<string, boolean>;
        customPhrases: string[];
        approvalTimeoutMinutes: number;
      };

      const { data, error } = await supabase
        .from("guard_settings")
        .upsert(
          {
            user_id: req.userId!,
            mode,
            judge_enabled: judgeEnabled,
            shield,
            custom_phrases: customPhrases,
            approval_timeout_minutes: approvalTimeoutMinutes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed updating settings");
      }

      await appendAuditEvent(supabase, req.userId!, "settings_changed", {
        mode,
        judgeEnabled,
        shield,
        customPhraseCount: customPhrases.length,
        approvalTimeoutMinutes,
      });

      res.json({ settings: data });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

