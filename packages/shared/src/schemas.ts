import { z } from "zod";

export const GENESIS_HASH = "0".repeat(64);

export const ATTACK_TYPES = [
  "instruction_override",
  "hidden_content",
  "data_exfiltration",
] as const;

export const SENSITIVE_DATA_TYPES = [
  "aadhaar",
  "pan",
  "upi_id",
  "phone_in",
  "api_key",
] as const;

export const SEVERITY_LEVELS = ["low", "medium", "high", "critical"] as const;
export const VERDICT_LEVELS = ["allow", "warn", "block"] as const;
export const GUARD_MODES = ["monitor", "enforce"] as const;
export const ACTION_TYPES = [
  "send_email",
  "forward_email",
  "reply_email",
  "delete_email",
  "share_file",
] as const;

export const AUDIT_EVENT_TYPES = [
  "scan_input",
  "scan_action",
  "alert_created",
  "action_proposed",
  "action_approved",
  "action_denied",
  "action_expired",
  "integrity_check",
  "settings_changed",
] as const;

export const AttackTypeSchema = z.enum(ATTACK_TYPES);
export const SensitiveDataTypeSchema = z.enum(SENSITIVE_DATA_TYPES);
export const SeveritySchema = z.enum(SEVERITY_LEVELS);
export const VerdictSchema = z.enum(VERDICT_LEVELS);
export const GuardModeSchema = z.enum(GUARD_MODES);
export const ActionTypeSchema = z.enum(ACTION_TYPES);
export const AuditEventTypeSchema = z.enum(AUDIT_EVENT_TYPES);

export type AttackType = z.infer<typeof AttackTypeSchema>;
export type SensitiveDataType = z.infer<typeof SensitiveDataTypeSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type Verdict = z.infer<typeof VerdictSchema>;
export type GuardMode = z.infer<typeof GuardModeSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  CLIENT_ORIGIN: z
    .string()
    .min(1)
    .default("http://localhost:5173")
    .refine(
      (value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
          .every((origin) => z.string().url().safeParse(origin).success),
      "CLIENT_ORIGIN must contain valid comma-separated URLs",
    ),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(10, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, "SUPABASE_SERVICE_ROLE_KEY is required"),
  GEMINI_API_KEY: z.string().min(10, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.8-flash"),
  DEMO_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

export const ShieldConfigSchema = z
  .object({
    aadhaar: z.boolean(),
    pan: z.boolean(),
    upi_id: z.boolean(),
    phone_in: z.boolean(),
    api_key: z.boolean(),
  })
  .strict();

export type ShieldConfig = z.infer<typeof ShieldConfigSchema>;

export const BootstrapReqSchema = z.object({}).strict();

export const AddEmailReqSchema = z
  .object({
    from: z.string().trim().email().max(254),
    subject: z.string().trim().min(1).max(200),
    bodyHtml: z.string().min(1).max(20000),
  })
  .strict();

export const CheckInputByEmailReqSchema = z
  .object({
    emailId: z.string().uuid(),
    forceJudge: z.boolean().optional(),
  })
  .strict();

export const CheckInputDirectReqSchema = z
  .object({
    subject: z.string().trim().min(1).max(200),
    bodyHtml: z.string().min(1).max(20000),
    forceJudge: z.boolean().optional(),
  })
  .strict();

export const CheckInputReqSchema = z.union([
  CheckInputByEmailReqSchema,
  CheckInputDirectReqSchema,
]);

export const CheckActionReqSchema = z
  .object({
    action: ActionTypeSchema,
    to: z.array(z.string().trim().email().max(254)).max(5),
    subject: z.string().max(200),
    body: z.string().max(4000),
    sourceEmailId: z.string().uuid().optional(),
  })
  .strict();

export const AgentRunReqSchema = z
  .object({
    emailId: z.string().uuid(),
    userRequest: z.string().trim().min(1).max(500),
    guard: z.boolean(),
  })
  .strict();

export const DecisionReqSchema = z
  .object({
    decision: z.enum(["approve", "deny", "approve_redacted"]),
  })
  .strict();

export const SettingsReqSchema = z
  .object({
    mode: GuardModeSchema,
    judgeEnabled: z.boolean(),
    shield: ShieldConfigSchema,
    customPhrases: z.array(z.string().trim().min(1).max(80)).max(20),
    approvalTimeoutMinutes: z.number().int().min(5).max(60),
    actionApprovalRequired: z.literal(true).optional(),
  })
  .strict();

export const AuditQuerySchema = z
  .object({
    cursor: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const ApprovalsQuerySchema = z
  .object({
    status: z
      .enum(["pending", "approved", "approved_redacted", "denied", "expired", "all"])
      .default("pending"),
  })
  .strict();

export const AlertsQuerySchema = z
  .object({
    severity: SeveritySchema.optional(),
    acknowledged: z.enum(["true", "false"]).optional(),
  })
  .strict();

export const JudgeResponseSchema = z.object({
  isInjection: z.boolean(),
  confidence: z.number().min(0).max(1),
  attackType: z.enum([...ATTACK_TYPES, "none"]),
  evidence: z.array(z.string().max(160)).max(5),
  explanation: z.string().max(300),
});

export type JudgeResponse = z.infer<typeof JudgeResponseSchema>;

export const AgentToolCallSchema = z.object({
  action: ActionTypeSchema,
  to: z.array(z.string()).max(5),
  subject: z.string().max(200),
  body: z.string().max(4000),
});

export const AgentResponseSchema = z.object({
  summary: z.string().max(600),
  toolCalls: z.array(AgentToolCallSchema).max(3),
});

export type AgentToolCall = z.infer<typeof AgentToolCallSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

export const ExplainerResponseSchema = z.object({
  title: z.string().max(80),
  explanation: z.string().max(300),
  recommendedAction: z.string().max(160),
});

export type ExplainerResponse = z.infer<typeof ExplainerResponseSchema>;

export interface RuleFinding {
  layer: "rule" | "judge" | "system";
  category:
    | "instruction_override"
    | "hidden_html"
    | "invisible_unicode"
    | "exfiltration_pattern"
    | "custom_phrase"
    | "llm_judge"
    | "degraded_mode";
  attackType: AttackType;
  scoreImpact: number;
  summary: string;
  detail?: string;
  snippet?: string;
  technique?: string;
  count?: number;
  offsets?: number[];
}

export interface ShieldFinding {
  type: SensitiveDataType;
  field: "to" | "subject" | "body" | "attachment";
  maskedPreview: string;
  redactedToken: string;
  start: number;
  end: number;
}

export interface GuardVerdict {
  verdict: Verdict;
  effectiveVerdict: Verdict;
  mode: GuardMode;
  severity: Severity;
  riskScore: number;
  attackType: AttackType | null;
  findings: RuleFinding[];
  explanation: string;
  recommendedAction: string;
  judgeUsed: boolean;
  judgeDegraded: boolean;
  judgeResult?: JudgeResponse;
  visibleText: string;
  hiddenSegments: Array<{ technique: string; text: string }>;
  invisibleUnicodeCount: number;
  invisibleUnicodeOffsets: number[];
  latencyMs: number;
}

export interface ActionDecision {
  allowed: boolean;
  status: "pending";
  flag: "normal" | "elevated" | "critical";
  verdict: Verdict;
  severity: Severity;
  riskScore: number;
  shieldFindings: ShieldFinding[];
  redactedPayload: {
    action: ActionType;
    to: string[];
    subject: string;
    body: string;
    redactions: Array<{
      type: SensitiveDataType;
      field: "to" | "subject" | "body" | "attachment";
      start: number;
      end: number;
      maskedPreview: string;
      token: string;
    }>;
  };
  explanation: string;
  recommendedAction: string;
}

export interface AuditEntry {
  id: string;
  user_id: string;
  seq: number;
  event_type: AuditEventType;
  payload: Record<string, unknown>;
  prev_hash: string;
  entry_hash: string;
  created_at: string;
}

export interface AuditVerifyResult {
  valid: boolean;
  checked: number;
  brokenAtSeq: number | null;
  reason: string | null;
}

export interface GuardSettings {
  user_id: string;
  mode: GuardMode;
  judge_enabled: boolean;
  shield: ShieldConfig;
  custom_phrases: string[];
  approval_timeout_minutes: number;
  updated_at: string;
}

export interface EmailRecord {
  id: string;
  user_id: string;
  from_address: string;
  subject: string;
  body_html: string;
  is_seed: boolean;
  quarantined: boolean;
  received_at: string;
}

export interface AlertRecord {
  id: string;
  user_id: string;
  scan_id: string | null;
  severity: Severity;
  title: string;
  explanation: string;
  recommended_action: string;
  acknowledged: boolean;
  created_at: string;
}

export interface PendingActionRecord {
  id: string;
  user_id: string;
  scan_id: string | null;
  source_email_id: string | null;
  action_type: ActionType;
  payload: {
    to: string[];
    subject: string;
    body: string;
    redactions?: Array<{
      type: SensitiveDataType;
      field: string;
      start: number;
      end: number;
      maskedPreview: string;
      token: string;
    }>;
  };
  flag: "normal" | "elevated" | "critical";
  shield_findings: ShieldFinding[];
  explanation: string;
  status: "pending" | "approved" | "approved_redacted" | "denied" | "expired";
  decided_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface AgentTraceStep {
  step: "input_rules" | "input_judge" | "input_verdict" | "agent_llm" | "action_shield" | "action_firewall" | "audit_log";
  status: "pass" | "warn" | "block" | "paused" | "degraded" | "simulated" | "skipped";
  title: string;
  detail: string;
  latencyMs?: number;
  data?: Record<string, unknown>;
}

