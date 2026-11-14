import type {
  AgentResponse,
  AgentTraceStep,
  AlertRecord,
  AuditEntry,
  AuditVerifyResult,
  EmailRecord,
  GuardSettings,
  GuardVerdict,
  PendingActionRecord,
  ShieldFinding,
  ActionDecision,
} from "@agent-guard/shared";
import { supabase } from "./supabase";

const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8080/api").replace(
  /\/+$/,
  "",
);

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  requireAuth = true,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (requireAuth) {
    const token = await getAccessToken();
    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "Please sign in to access Agent Guard.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const payload = (await res.json().catch(() => null)) as
    | { error?: { code?: string; message?: string } }
    | T
    | null;

  if (!res.ok) {
    const errObj =
      payload && typeof payload === "object" && "error" in payload ? payload.error : undefined;
    throw new ApiError(
      res.status,
      errObj?.code ?? "REQUEST_FAILED",
      errObj?.message ?? `Request failed with status ${res.status}`,
    );
  }

  return payload as T;
}

export interface HealthResponse {
  ok: boolean;
  status: string;
  demoMode: boolean;
  model: string;
  timestamp: string;
}

export interface AgentRunResult {
  guard: boolean;
  simulated: boolean;
  quarantined: boolean;
  scanId?: string;
  verdict?: GuardVerdict;
  alert?: AlertRecord | null;
  summary: string | null;
  toolCalls: Array<{
    action: string;
    to: string[];
    subject: string;
    body: string;
    flag?: string;
    pendingActionId?: string;
    simulated?: boolean;
  }>;
  simulatedLeaks?: ShieldFinding[];
  pendingActions: PendingActionRecord[];
  trace: AgentTraceStep[];
}

export interface StatsResponse {
  stats: {
    totalScans: number;
    threatsBlocked: number;
    pendingApprovals: number;
    unacknowledgedAlerts: number;
    totalAuditEntries: number;
    lastIntegrity: {
      valid: boolean;
      checked: number;
      brokenAtSeq: number | null;
      checkedAt: string;
    } | null;
  };
  timeline: Array<{ date: string; blocked: number; warned: number; allowed: number }>;
  recentAlerts: AlertRecord[];
}

export const api = {
  health: () => requestJson<HealthResponse>("/health", {}, false),

  bootstrap: () =>
    requestJson<{ seeded: boolean; settings: GuardSettings; emails: EmailRecord[] }>(
      "/bootstrap",
      { method: "POST", body: JSON.stringify({}) },
    ),

  listEmails: () => requestJson<{ emails: EmailRecord[] }>("/emails"),

  addEmail: (input: { from: string; subject: string; bodyHtml: string }) =>
    requestJson<{ email: EmailRecord }>("/emails", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  checkInput: (input: { emailId: string; forceJudge?: boolean } | { subject: string; bodyHtml: string; forceJudge?: boolean }) =>
    requestJson<{ scanId: string; verdict: GuardVerdict; alert: AlertRecord | null }>(
      "/guard/check-input",
      { method: "POST", body: JSON.stringify(input) },
    ),

  checkAction: (input: {
    action: AgentResponse["toolCalls"][number]["action"];
    to: string[];
    subject: string;
    body: string;
    sourceEmailId?: string;
  }) =>
    requestJson<{
      scanId: string;
      decision: ActionDecision;
      pendingAction: PendingActionRecord;
      alert: AlertRecord | null;
    }>("/guard/check-action", { method: "POST", body: JSON.stringify(input) }),

  runAgent: (input: { emailId: string; userRequest: string; guard: boolean }) =>
    requestJson<AgentRunResult>("/agent/run", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  listApprovals: (status = "pending") =>
    requestJson<{ approvals: PendingActionRecord[] }>(
      `/approvals?status=${encodeURIComponent(status)}`,
    ),

  decideApproval: (id: string, decision: "approve" | "deny" | "approve_redacted") =>
    requestJson<{ approval: PendingActionRecord }>(`/approvals/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    }),

  listAlerts: (params: { severity?: string; acknowledged?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.severity) search.set("severity", params.severity);
    if (params.acknowledged) search.set("acknowledged", params.acknowledged);
    const qs = search.toString();
    return requestJson<{ alerts: AlertRecord[] }>(`/alerts${qs ? `?${qs}` : ""}`);
  },

  ackAlert: (id: string) =>
    requestJson<{ alert: AlertRecord }>(`/alerts/${id}/ack`, { method: "PATCH" }),

  listAudit: (cursor?: number, limit = 50) => {
    const search = new URLSearchParams({ limit: String(limit) });
    if (cursor !== undefined) search.set("cursor", String(cursor));
    return requestJson<{ entries: AuditEntry[]; nextCursor: number | null }>(
      `/audit?${search.toString()}`,
    );
  },

  verifyAudit: () =>
    requestJson<AuditVerifyResult>("/audit/verify", { method: "POST", body: JSON.stringify({}) }),

  simulateTamper: () =>
    requestJson<{ tamperedSeq: number; originalEventType: string }>("/audit/simulate-tamper", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  stats: () => requestJson<StatsResponse>("/stats"),

  getSettings: () => requestJson<{ settings: GuardSettings }>("/settings"),

  updateSettings: (input: {
    mode: "monitor" | "enforce";
    judgeEnabled: boolean;
    shield: GuardSettings["shield"];
    customPhrases: string[];
    approvalTimeoutMinutes: number;
  }) =>
    requestJson<{ settings: GuardSettings }>("/settings", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};

