import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionDecision, PendingActionRecord } from "@agent-guard/shared";
import { appendAuditEvent } from "./audit.js";
import { AppError } from "../middleware/error.js";

export async function createPendingAction(
  supabase: SupabaseClient,
  params: {
    userId: string;
    scanId: string | null;
    sourceEmailId: string | null;
    decision: ActionDecision;
    timeoutMinutes: number;
  },
): Promise<PendingActionRecord> {
  const expiresAt = new Date(Date.now() + params.timeoutMinutes * 60_000).toISOString();

  const { data, error } = await supabase
    .from("pending_actions")
    .insert({
      user_id: params.userId,
      scan_id: params.scanId,
      source_email_id: params.sourceEmailId,
      action_type: params.decision.redactedPayload.action,
      payload: {
        to: params.decision.redactedPayload.to,
        subject: params.decision.redactedPayload.subject,
        body: params.decision.redactedPayload.body,
        redactions: params.decision.redactedPayload.redactions,
      },
      flag: params.decision.flag,
      shield_findings: params.decision.shieldFindings,
      explanation: params.decision.explanation,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed creating pending action: ${error?.message ?? "unknown"}`);
  }

  const record = data as PendingActionRecord;

  await appendAuditEvent(supabase, params.userId, "action_proposed", {
    pendingActionId: record.id,
    actionType: record.action_type,
    flag: record.flag,
    shieldCount: params.decision.shieldFindings.length,
    recipients: record.payload.to,
    expiresAt: record.expires_at,
  });

  return record;
}

export async function decidePendingAction(
  supabase: SupabaseClient,
  params: {
    userId: string;
    actionId: string;
    decision: "approve" | "deny" | "approve_redacted";
  },
): Promise<PendingActionRecord> {
  const { data: existing, error: fetchErr } = await supabase
    .from("pending_actions")
    .select("*")
    .eq("id", params.actionId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`Failed loading pending action: ${fetchErr.message}`);
  }
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Pending action not found.");
  }

  const record = existing as PendingActionRecord;
  if (record.status !== "pending") {
    throw new AppError(
      409,
      "ALREADY_DECIDED",
      `This action was already resolved with status "${record.status}". Decisions are final.`,
    );
  }

  const nowIso = new Date().toISOString();
  if (new Date(record.expires_at).getTime() <= Date.now()) {
    const { data: expiredRow, error: expErr } = await supabase
      .from("pending_actions")
      .update({ status: "expired", decided_at: nowIso })
      .eq("id", record.id)
      .eq("user_id", params.userId)
      .eq("status", "pending")
      .select("*")
      .single();

    if (!expErr && expiredRow) {
      await appendAuditEvent(supabase, params.userId, "action_expired", {
        pendingActionId: record.id,
        actionType: record.action_type,
      });
    }
    throw new AppError(409, "ACTION_EXPIRED", "This action expired before a decision was recorded.");
  }

  const nextStatus =
    params.decision === "approve"
      ? "approved"
      : params.decision === "approve_redacted"
        ? "approved_redacted"
        : "denied";

  const { data: updated, error: updateErr } = await supabase
    .from("pending_actions")
    .update({ status: nextStatus, decided_at: nowIso })
    .eq("id", record.id)
    .eq("user_id", params.userId)
    .eq("status", "pending")
    .select("*")
    .single();

  if (updateErr || !updated) {
    throw new Error(`Failed updating action decision: ${updateErr?.message ?? "conflict"}`);
  }

  const eventType = params.decision === "deny" ? "action_denied" : "action_approved";
  await appendAuditEvent(supabase, params.userId, eventType, {
    pendingActionId: record.id,
    actionType: record.action_type,
    decision: nextStatus,
    flag: record.flag,
    redactedCount: record.shield_findings.length,
  });

  return updated as PendingActionRecord;
}

export async function expireOverduePendingActions(
  supabase: SupabaseClient,
): Promise<number> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("pending_actions")
    .update({ status: "expired", decided_at: nowIso })
    .eq("status", "pending")
    .lte("expires_at", nowIso)
    .select("id, user_id, action_type, flag");

  if (error || !data || data.length === 0) {
    return 0;
  }

  for (const row of data) {
    await appendAuditEvent(supabase, row.user_id, "action_expired", {
      pendingActionId: row.id,
      actionType: row.action_type,
      flag: row.flag,
      reason: "Approval timeout exceeded (auto-denied)",
    });
  }
  return data.length;
}

