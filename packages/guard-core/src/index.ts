import type {
  ActionDecision,
  ActionType,
  GuardMode,
  GuardVerdict,
  JudgeResponse,
  RuleFinding,
  ShieldConfig,
  ShieldFinding,
} from "@agent-guard/shared";
import { scanExfilPatterns } from "./rules/exfilPatterns.js";
import { scanHiddenHtml } from "./rules/hiddenHtml.js";
import { scanInvisibleUnicode } from "./rules/invisibleUnicode.js";
import { scanInstructionPhrases } from "./rules/phrases.js";
import { buildActionExplanation, buildInputExplanation } from "./explain.js";
import { computeFinalScore, computeRuleScore, scoreToSeverityAndVerdict } from "./score.js";
import {
  DEFAULT_SHIELD_CONFIG,
  maskSensitiveText,
  MAX_SCAN_CHARS,
  scanAndRedactField,
} from "./shield/patterns.js";

export * from "./rules/phrases.js";
export * from "./rules/hiddenHtml.js";
export * from "./rules/invisibleUnicode.js";
export * from "./rules/exfilPatterns.js";
export * from "./shield/verhoeff.js";
export * from "./shield/mask.js";
export * from "./shield/patterns.js";
export * from "./score.js";
export * from "./explain.js";
export * from "./hashChain.js";

export interface JudgeCallbackInput {
  sanitizedText: string;
  ruleFindings: RuleFinding[];
}

export interface JudgeCallbackOutput {
  result: JudgeResponse;
  degraded?: boolean;
}

export interface ExplainerCallbackInput {
  eventType: string;
  maskedFindings: unknown;
  recipientDomains: string[];
}

export interface ExplainerCallbackOutput {
  title: string;
  explanation: string;
  recommendedAction: string;
}

export interface CreateGuardOptions {
  mode?: GuardMode;
  judgeEnabled?: boolean;
  shield?: ShieldConfig;
  customPhrases?: string[];
  judge?: (input: JudgeCallbackInput) => Promise<JudgeCallbackOutput>;
  explainer?: (input: ExplainerCallbackInput) => Promise<ExplainerCallbackOutput | null>;
}

export interface CheckInputOptions {
  subject?: string;
  forceJudge?: boolean;
  mode?: GuardMode;
  judgeEnabled?: boolean;
  customPhrases?: string[];
}

export interface ProposedActionInput {
  action: ActionType;
  to?: string[];
  subject?: string;
  body?: string;
  attachmentsText?: string;
  sourceVerdict?: "allow" | "warn" | "block";
  shield?: ShieldConfig;
}

export interface AgentGuard {
  checkInput(inputHtmlOrText: string, options?: CheckInputOptions): Promise<GuardVerdict>;
  checkAction(proposedAction: ProposedActionInput): Promise<ActionDecision>;
}

/**
 * Neutralizes closing delimiter tags inside untrusted text before passing into prompt blocks.
 */
export function neutralizeDelimiters(text: string): string {
  return text.replace(/<\/\s*untrusted_email\s*>/gi, "[/untrusted_email]");
}

/**
 * Creates a standalone, framework-free Agent Guard instance exposing checkInput() and checkAction().
 */
export function createGuard(defaultOptions: CreateGuardOptions = {}): AgentGuard {
  return {
    async checkInput(inputHtmlOrText: string, options: CheckInputOptions = {}): Promise<GuardVerdict> {
      const startMs = Date.now();
      const mode: GuardMode = options.mode ?? defaultOptions.mode ?? "enforce";
      const judgeEnabled = options.judgeEnabled ?? defaultOptions.judgeEnabled ?? true;
      const customPhrases = options.customPhrases ?? defaultOptions.customPhrases ?? [];
      const shieldCfg = defaultOptions.shield ?? DEFAULT_SHIELD_CONFIG;

      try {
        const subjectPrefix = options.subject ? `${options.subject}\n` : "";
        const rawCombined = (subjectPrefix + (inputHtmlOrText ?? "")).slice(0, MAX_SCAN_CHARS);

        // 1. Invisible Unicode detection on raw text
        const unicodeRes = scanInvisibleUnicode(rawCombined);

        // 2. Hidden HTML detection on Unicode-stripped text (cheerio, zero script execution)
        const htmlRes = scanHiddenHtml(unicodeRes.strippedText);

        // Combine visible + hidden extracted text for phrase & exfil rule matching
        const combinedText = `${htmlRes.visibleText} ${htmlRes.hiddenSegments.map((s) => s.text).join(" ")}`.trim();

        // 3. Instruction-override phrases (built-in + custom)
        const phraseRes = scanInstructionPhrases(combinedText, customPhrases);

        // 4. Exfiltration request patterns
        const exfilRes = scanExfilPatterns(combinedText);

        const ruleFindings: RuleFinding[] = [
          ...unicodeRes.findings,
          ...htmlRes.findings,
          ...phraseRes.findings,
          ...exfilRes.findings,
        ];

        const hasHiddenHtml = htmlRes.hiddenSegments.length > 0;
        const hasInvisibleUnicode = unicodeRes.count > 0;
        const hasExfilPattern = exfilRes.matched;

        const { ruleScore, ruleConfidence } = computeRuleScore({
          phraseScore: phraseRes.scoreImpact,
          hasHiddenHtml,
          hasInvisibleUnicode,
          hasExfilPattern,
        });

        const ruleBlocksWithHighConfidence = ruleScore >= 60 && ruleConfidence >= 0.95;
        const shouldCallJudge =
          Boolean(defaultOptions.judge) &&
          judgeEnabled &&
          (options.forceJudge === true || !ruleBlocksWithHighConfidence);

        let judgeResult: JudgeResponse | undefined;
        let judgeUsed = false;
        let judgeDegraded = false;

        if (shouldCallJudge && defaultOptions.judge) {
          judgeUsed = true;
          const textForJudge = maskSensitiveText(
            neutralizeDelimiters(
              `${htmlRes.visibleText}${
                htmlRes.hiddenSegments.length > 0
                  ? `\n[HIDDEN_SEGMENTS]: ${htmlRes.hiddenSegments.map((s) => s.text).join(" | ")}`
                  : ""
              }`,
            ).slice(0, 8000),
            shieldCfg,
          );

          try {
            const out = await defaultOptions.judge({
              sanitizedText: textForJudge,
              ruleFindings,
            });
            judgeResult = out.result;
            judgeDegraded = Boolean(out.degraded);
            if (judgeDegraded) {
              ruleFindings.push({
                layer: "system",
                category: "degraded_mode",
                attackType: "instruction_override",
                scoreImpact: 0,
                summary: "AI judge unavailable, rules-only decision applied",
              });
            } else if (judgeResult.isInjection && judgeResult.attackType !== "none") {
              ruleFindings.push({
                layer: "judge",
                category: "llm_judge",
                attackType: judgeResult.attackType,
                scoreImpact: Math.round(judgeResult.confidence * 40),
                summary: `AI judge classified ${judgeResult.attackType} (${Math.round(judgeResult.confidence * 100)}% confidence)`,
                snippet: judgeResult.evidence[0]
                  ? maskSensitiveText(judgeResult.evidence[0], shieldCfg).slice(0, 160)
                  : undefined,
              });
            }
          } catch {
            judgeDegraded = true;
            judgeResult = {
              isInjection: true,
              confidence: 0.5,
              attackType: "instruction_override",
              evidence: [],
              explanation: "AI judge unavailable, rules-only decision applied.",
            };
            ruleFindings.push({
              layer: "system",
              category: "degraded_mode",
              attackType: "instruction_override",
              scoreImpact: 20,
              summary: "AI judge unavailable, rules-only decision applied",
            });
          }
        }

        const scoreSummary = computeFinalScore({
          phraseScore: phraseRes.scoreImpact,
          hasHiddenHtml,
          hasInvisibleUnicode,
          hasExfilPattern,
          judge: judgeResult,
          findings: ruleFindings,
          mode,
        });

        let { explanation, recommendedAction } = buildInputExplanation({
          verdict: scoreSummary.verdict,
          attackType: scoreSummary.attackType,
          findings: ruleFindings,
          invisibleUnicodeCount: unicodeRes.count,
          hasHiddenHtml,
          judgeExplanation: judgeResult?.explanation,
        });

        // Optional Alert Explainer when rule layer fired without judge
        if (
          scoreSummary.verdict !== "allow" &&
          !judgeUsed &&
          defaultOptions.explainer
        ) {
          try {
            const explained = await defaultOptions.explainer({
              eventType: "scan_input",
              maskedFindings: ruleFindings,
              recipientDomains: [],
            });
            if (explained) {
              explanation = explained.explanation;
              recommendedAction = explained.recommendedAction;
            }
          } catch {
            // Deterministic fallback already populated
          }
        }

        return {
          verdict: scoreSummary.verdict,
          effectiveVerdict: scoreSummary.effectiveVerdict,
          mode,
          severity: scoreSummary.severity,
          riskScore: scoreSummary.riskScore,
          attackType: scoreSummary.attackType,
          findings: ruleFindings,
          explanation,
          recommendedAction,
          judgeUsed,
          judgeDegraded,
          judgeResult,
          visibleText: htmlRes.visibleText,
          hiddenSegments: htmlRes.hiddenSegments,
          invisibleUnicodeCount: unicodeRes.count,
          invisibleUnicodeOffsets: unicodeRes.offsets,
          latencyMs: Date.now() - startMs,
        };
      } catch {
        // Fail closed on unexpected internal scanner error
        return {
          verdict: "warn",
          effectiveVerdict: mode === "monitor" ? "allow" : "warn",
          mode,
          severity: "medium",
          riskScore: 45,
          attackType: "instruction_override",
          findings: [
            {
              layer: "system",
              category: "degraded_mode",
              attackType: "instruction_override",
              scoreImpact: 45,
              summary: "Input scanner encountered an internal error; fail-closed warning applied",
            },
          ],
          explanation:
            "Agent Guard could not complete a full inspection and paused this email safely for review.",
          recommendedAction: "Inspect the message manually before allowing the assistant to act.",
          judgeUsed: false,
          judgeDegraded: true,
          visibleText: "",
          hiddenSegments: [],
          invisibleUnicodeCount: 0,
          invisibleUnicodeOffsets: [],
          latencyMs: Date.now() - startMs,
        };
      }
    },

    async checkAction(proposedAction: ProposedActionInput): Promise<ActionDecision> {
      const shieldCfg = proposedAction.shield ?? defaultOptions.shield ?? DEFAULT_SHIELD_CONFIG;
      const toList = proposedAction.to ?? [];
      const rawSubject = proposedAction.subject ?? "";
      const rawBody = proposedAction.body ?? "";
      const rawAttachment = proposedAction.attachmentsText ?? "";

      try {
        const subjectScan = scanAndRedactField(rawSubject, "subject", shieldCfg);
        const bodyScan = scanAndRedactField(rawBody, "body", shieldCfg);
        const attachmentScan = rawAttachment
          ? scanAndRedactField(rawAttachment, "attachment", shieldCfg)
          : { redactedText: "", findings: [], redactions: [] };

        const redactedTo: string[] = [];
        const toFindings: ShieldFinding[] = [];
        const toRedactions: Array<{
          type: ShieldFinding["type"];
          field: "to" | "subject" | "body" | "attachment";
          start: number;
          end: number;
          maskedPreview: string;
          token: string;
        }> = [];

        for (const addr of toList) {
          const toScan = scanAndRedactField(addr, "to", shieldCfg);
          redactedTo.push(toScan.redactedText);
          toFindings.push(...toScan.findings);
          toRedactions.push(...toScan.redactions);
        }

        const shieldFindings: ShieldFinding[] = [
          ...toFindings,
          ...subjectScan.findings,
          ...bodyScan.findings,
          ...attachmentScan.findings,
        ];

        const allRedactions = [
          ...toRedactions,
          ...subjectScan.redactions,
          ...bodyScan.redactions,
          ...attachmentScan.redactions,
        ];

        const sourceFlagged =
          proposedAction.sourceVerdict === "block" ||
          proposedAction.sourceVerdict === "warn";

        const hasSensitiveData = shieldFindings.length > 0;
        const flag: "normal" | "elevated" | "critical" = hasSensitiveData
          ? "critical"
          : sourceFlagged
            ? "elevated"
            : "normal";

        const riskScore = hasSensitiveData ? 95 : sourceFlagged ? 65 : 25;
        const { severity, verdict } = hasSensitiveData
          ? { severity: "critical" as const, verdict: "block" as const }
          : sourceFlagged
            ? scoreToSeverityAndVerdict(65)
            : { severity: "low" as const, verdict: "warn" as const };

        const recipientDomains = Array.from(
          new Set(
            toList
              .map((r) => r.split("@")[1]?.toLowerCase())
              .filter((d): d is string => Boolean(d)),
          ),
        );

        let { explanation, recommendedAction } = buildActionExplanation({
          action: proposedAction.action,
          shieldFindings,
          sourceFlagged,
          recipients: toList,
        });

        if ((hasSensitiveData || sourceFlagged) && defaultOptions.explainer) {
          try {
            const explained = await defaultOptions.explainer({
              eventType: "scan_action",
              maskedFindings: shieldFindings,
              recipientDomains,
            });
            if (explained) {
              explanation = explained.explanation;
              recommendedAction = explained.recommendedAction;
            }
          } catch {
            // Keep deterministic fallback
          }
        }

        return {
          allowed: false,
          status: "pending",
          flag,
          verdict,
          severity,
          riskScore,
          shieldFindings,
          redactedPayload: {
            action: proposedAction.action,
            to: redactedTo,
            subject: subjectScan.redactedText,
            body: bodyScan.redactedText,
            redactions: allRedactions,
          },
          explanation,
          recommendedAction,
        };
      } catch {
        // Fail closed: pause as critical pending action
        return {
          allowed: false,
          status: "pending",
          flag: "critical",
          verdict: "block",
          severity: "critical",
          riskScore: 90,
          shieldFindings: [],
          redactedPayload: {
            action: proposedAction.action,
            to: [],
            subject: "[SCAN ERROR - REDACTED]",
            body: "[SCAN ERROR - REDACTED FOR SAFETY]",
            redactions: [],
          },
          explanation:
            "Data Shield encountered an internal error while inspecting this action and paused it safely.",
          recommendedAction: "Deny this action and inspect your guard configuration.",
        };
      }
    },
  };
}

