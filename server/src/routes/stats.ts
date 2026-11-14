import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { expireOverduePendingActions } from "../services/approvals.js";

export function createStatsRouter(supabase: SupabaseClient) {
  const router = Router();

  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      await expireOverduePendingActions(supabase);

      const [scansRes, alertsRes, pendingRes, auditRes, lastCheckRes] = await Promise.all([
        supabase
          .from("scans")
          .select("id, verdict, severity, attack_type, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("alerts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("pending_actions")
          .select("id, flag, status")
          .eq("user_id", userId)
          .eq("status", "pending"),
        supabase
          .from("audit_log")
          .select("seq", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("audit_log")
          .select("seq, payload, created_at")
          .eq("user_id", userId)
          .eq("event_type", "integrity_check")
          .order("seq", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const scans = scansRes.data ?? [];
      const alerts = alertsRes.data ?? [];
      const pending = pendingRes.data ?? [];

      const totalScans = scans.length;
      const threatsBlocked = scans.filter(
        (s) => s.verdict === "block" || s.verdict === "warn",
      ).length;
      const pendingApprovals = pending.length;
      const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

      // Build 7-day / recent threat timeline buckets
      const buckets = new Map<string, { date: string; blocked: number; warned: number; allowed: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86_400_000);
        const key = d.toISOString().slice(0, 10);
        buckets.set(key, { date: key, blocked: 0, warned: 0, allowed: 0 });
      }
      for (const s of scans) {
        const key = String(s.created_at).slice(0, 10);
        const b = buckets.get(key);
        if (b) {
          if (s.verdict === "block") b.blocked += 1;
          else if (s.verdict === "warn") b.warned += 1;
          else b.allowed += 1;
        }
      }

      const lastIntegrity = lastCheckRes.data
        ? {
            valid: Boolean((lastCheckRes.data.payload as { valid?: boolean })?.valid),
            checked: Number((lastCheckRes.data.payload as { checked?: number })?.checked ?? 0),
            brokenAtSeq:
              (lastCheckRes.data.payload as { brokenAtSeq?: number | null })?.brokenAtSeq ?? null,
            checkedAt: lastCheckRes.data.created_at,
          }
        : null;

      res.json({
        stats: {
          totalScans,
          threatsBlocked,
          pendingApprovals,
          unacknowledgedAlerts,
          totalAuditEntries: auditRes.count ?? 0,
          lastIntegrity,
        },
        timeline: Array.from(buckets.values()),
        recentAlerts: alerts.slice(0, 6),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

