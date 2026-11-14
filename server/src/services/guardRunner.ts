import type { SupabaseClient } from "@supabase/supabase-js";
import { createGuard, maskSensitiveText } from "@agent-guard/core";
import type {
  ActionDecision,
  ActionType,
  AlertRecord,
  GuardSettings,
  GuardVerdict,
  PendingActionRecord,
} from "@agent-guard/shared";
import { createGeminiJudge, type JudgeRunnerFn } from "./judge.js";
import { createGeminiExplainer, type ExplainerRunnerFn } from "./explainer.js";
import { appendAuditEvent } from "./audit.js";
import { createPendingAction } from "./approvals.js";

export interface GuardDeps {
  judge?: JudgeRunnerFn;
  explainer?: ExplainerRunnerFn;
}

export async function getUserSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<GuardSettings> {
  const { data, error } = await supabase
    .from("guard_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed loading guard settings: ${error.message}`);
  }
  if (data) return data as GuardSettings;

  const { data: created, error: insertErr } = await supabase
    .from("guard_settings")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (insertErr || !created) {
    throw new Error(`Failed initializing guard settings: ${insertErr?.message ?? "unknown"}`);
  }
  return created as GuardSettings;
}

export async function executeInputScan(
  supabase: SupabaseClient,
  params: {
    userId: string;
    emailId: string | null;
    subject: string;
    bodyHtml: string;
    forceJudge?: boolean;
  },
  deps: GuardDeps = {},
): Promise<{ scanId: string; verdict: GuardVerdict; alert: AlertRecord | null }> {
  const settings = await getUserSettings(supabase, params.userId);
  const judgeFn = deps.judge ?? createGeminiJudge();
  const explainerFn = deps.explainer ?? createGeminiExplainer();

  const guard = createGuard({
    mode: settings.mode,
    judgeEnabled: settings.judge_enabled,
    shield: settings.shield,
    customPhrases: settings.custom_phrases,
    judge: judgeFn,
    explainer: explainerFn,
  });

  const verdict = await guard.checkInput(params.bodyHtml, {
    subject: params.subject,
    forceJudge: params.forceJudge,
  });

  const maskedFindings = verdict.findings.map((f) => ({
    ...f,
    snippet: f.snippet ? maskSensitiveText(f.snippet, settings.shield) : undefined,
  }));

  const { data: scanRow, error: scanErr } = await supabase
    .from("scans")
    .insert({
      user_id: params.userId,
      email_id: params.emailId,
      kind: "input",
      verdict: verdict.verdict,
      severity: verdict.severity,
      risk_score: verdict.riskScore,
      attack_type: verdict.attackType,
      findings: maskedFindings,
      judge_used: verdict.judgeUsed,
      latency_ms: verdict.latencyMs,
    })
    .select("id")
    .single();

  if (scanErr || !scanRow) {
    throw new Error(`Failed saving input scan: ${scanErr?.message ?? "unknown"}`);
  }

  if (params.emailId && verdict.effectiveVerdict === "block") {
    await supabase
      .from("emails")
      .update({ quarantined: true })
      .eq("id", params.emailId)
      .eq("user_id", params.userId);
  }

  await appendAuditEvent(supabase, params.userId, "scan_input", {
    scanId: scanRow.id,
    emailId: params.emailId,
    verdict: verdict.verdict,
    effectiveVerdict: verdict.effectiveVerdict,
    severity: verdict.severity,
    riskScore: verdict.riskScore,
    attackType: verdict.attackType,
    judgeUsed: verdict.judgeUsed,
    judgeDegraded: verdict.judgeDegraded,
    findingCount: maskedFindings.length,
  });

  let alert: AlertRecord | null = null;
  if (verdict.verdict === "warn" || verdict.verdict === "block") {
    const title =
      verdict.attackType === "hidden_content"
        ? "Hidden instructions detected in email"
        : verdict.attackType === "instruction_override"
          ? "Prompt injection override attempt blocked"
          : verdict.attackType === "data_exfiltration"
            ? "Suspicious data exfiltration request flagged"
            : "Suspicious email activity flagged";

    const { data: alertRow, error: alertErr } = await supabase
      .from("alerts")
      .insert({
        user_id: params.userId,
        scan_id: scanRow.id,
        severity: verdict.severity,
        title,
        explanation: maskSensitiveText(verdict.explanation, settings.shield),
        recommended_action: maskSensitiveText(verdict.recommendedAction, settings.shield),
      })
      .select("*")
      .single();

    if (alertErr || !alertRow) {
      throw new Error(`Failed creating alert: ${alertErr?.message ?? "unknown"}`);
    }
    alert = alertRow as AlertRecord;

    await appendAuditEvent(supabase, params.userId, "alert_created", {
      alertId: alert.id,
      scanId: scanRow.id,
      severity: alert.severity,
      title: alert.title,
    });
  }

  return { scanId: scanRow.id, verdict, alert };
}

export async function executeActionCheck(
  supabase: SupabaseClient,
  params: {
    userId: string;
    action: ActionType;
    to: string[];
    subject: string;
    body: string;
    sourceEmailId?: string;
    sourceVerdict?: "allow" | "warn" | "block";
  },
  deps: GuardDeps = {},
): Promise<{
  scanId: string;
  decision: ActionDecision;
  pendingAction: PendingActionRecord;
  alert: AlertRecord | null;
}> {
  const settings = await getUserSettings(supabase, params.userId);
  const explainerFn = deps.explainer ?? createGeminiExplainer();

  let sourceVerdict = params.sourceVerdict;
  if (!sourceVerdict && params.sourceEmailId) {
    const { data: lastScan } = await supabase
      .from("scans")
      .select("verdict")
      .eq("user_id", params.userId)
      .eq("email_id", params.sourceEmailId)
      .eq("kind", "input")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastScan?.verdict) {
      sourceVerdict = lastScan.verdict as "allow" | "warn" | "block";
    }
  }

  const guard = createGuard({
    mode: settings.mode,
    judgeEnabled: settings.judge_enabled,
    shield: settings.shield,
    customPhrases: settings.custom_phrases,
    explainer: explainerFn,
  });

  const decision = await guard.checkAction({
    action: params.action,
    to: params.to,
    subject: params.subject,
    body: params.body,
    sourceVerdict,
  });

  const { data: scanRow, error: scanErr } = await supabase
    .from("scans")
    .insert({
      user_id: params.userId,
      email_id: params.sourceEmailId ?? null,
      kind: "action",
      verdict: decision.verdict,
      severity: decision.severity,
      risk_score: decision.riskScore,
      attack_type: decision.shieldFindings.length > 0 ? "data_exfiltration" : null,
      findings: decision.shieldFindings,
      judge_used: false,
      latency_ms: 1,
    })
    .select("id")
    .single();

  if (scanErr || !scanRow) {
    throw new Error(`Failed saving action scan: ${scanErr?.message ?? "unknown"}`);
  }

  await appendAuditEvent(supabase, params.userId, "scan_action", {
    scanId: scanRow.id,
    action: params.action,
    flag: decision.flag,
    severity: decision.severity,
    riskScore: decision.riskScore,
    shieldFindings: decision.shieldFindings.map((f) => ({
      type: f.type,
      field: f.field,
      maskedPreview: f.maskedPreview,
    })),
  });

  const pendingAction = await createPendingAction(supabase, {
    userId: params.userId,
    scanId: scanRow.id,
    sourceEmailId: params.sourceEmailId ?? null,
    decision,
    timeoutMinutes: settings.approval_timeout_minutes,
  });

  let alert: AlertRecord | null = null;
  if (decision.flag === "critical" || decision.flag === "elevated") {
    const title =
      decision.flag === "critical"
        ? `Outbound ${params.action.replace("_", " ")} intercepted with sensitive data`
        : `Elevated outbound ${params.action.replace("_", " ")} paused for review`;

    const { data: alertRow, error: alertErr } = await supabase
      .from("alerts")
      .insert({
        user_id: params.userId,
        scan_id: scanRow.id,
        severity: decision.severity,
        title,
        explanation: maskSensitiveText(decision.explanation, settings.shield),
        recommended_action: maskSensitiveText(decision.recommendedAction, settings.shield),
      })
      .select("*")
      .single();

    if (!alertErr && alertRow) {
      alert = alertRow as AlertRecord;
      await appendAuditEvent(supabase, params.userId, "alert_created", {
        alertId: alert.id,
        scanId: scanRow.id,
        severity: alert.severity,
        title: alert.title,
      });
    }
  }

  return { scanId: scanRow.id, decision, pendingAction, alert };
}

