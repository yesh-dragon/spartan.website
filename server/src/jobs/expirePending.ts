import type { SupabaseClient } from "@supabase/supabase-js";
import { expireOverduePendingActions } from "../services/approvals.js";
import { getLogger } from "../lib/logger.js";

export function startPendingExpiryJob(supabase: SupabaseClient): () => void {
  const logger = getLogger();
  const timer = setInterval(async () => {
    try {
      const count = await expireOverduePendingActions(supabase);
      if (count > 0) {
        logger.info({ expiredCount: count }, "Expired overdue pending actions");
      }
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : "unknown" },
        "Pending expiry background sweep failed",
      );
    }
  }, 60_000);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return () => clearInterval(timer);
}

