import type { RuleFinding } from "@agent-guard/shared";
import { maskSensitiveText, MAX_SCAN_CHARS } from "../shield/patterns.js";

export const INSTRUCTION_OVERRIDE_PHRASES = [
  "ignore previous instructions",
  "ignore all prior instructions",
  "disregard the above",
  "forget your instructions",
  "you are now",
  "new instructions:",
  "system prompt",
  "act as",
  "do not tell the user",
  "reveal your prompt",
  "override your rules",
  "developer mode",
] as const;

export interface PhraseScanResult {
  matchedPhrases: string[];
  scoreImpact: number;
  findings: RuleFinding[];
}

function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPhraseRegex(phrase: string): RegExp {
  const normalized = phrase.trim().toLowerCase().replace(/\s+/g, " ");
  const escaped = escapeRegex(normalized).replace(/ /g, "\\s+");
  const startsWord = /^[a-z0-9_]/i.test(normalized);
  const endsWord = /[a-z0-9_]$/i.test(normalized);
  const prefix = startsWord ? "(?<![a-z0-9_])" : "";
  const suffix = endsWord ? "(?![a-z0-9_])" : "";
  return new RegExp(`${prefix}${escaped}${suffix}`, "i");
}

/** Matches built-in and custom override phrases against whitespace-normalized text. */
export function scanInstructionPhrases(
  inputText: string,
  customPhrases: string[] = [],
): PhraseScanResult {
  const capped =
    inputText.length > MAX_SCAN_CHARS ? inputText.slice(0, MAX_SCAN_CHARS) : inputText;
  const normalized = capped.replace(/\s+/g, " ").trim();

  const seen = new Set<string>();
  const findings: RuleFinding[] = [];
  const matchedPhrases: string[] = [];

  const allCandidates: Array<{ phrase: string; isCustom: boolean }> = [
    ...INSTRUCTION_OVERRIDE_PHRASES.map((phrase) => ({ phrase, isCustom: false })),
    ...customPhrases
      .map((p) => p.trim().toLowerCase())
      .filter((p) => p.length > 0 && p.length <= 80)
      .slice(0, 20)
      .map((phrase) => ({ phrase, isCustom: true })),
  ];

  let rawPoints = 0;

  for (const { phrase, isCustom } of allCandidates) {
    const key = phrase.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;

    const regex = buildPhraseRegex(key);
    const match = regex.exec(normalized);
    if (match) {
      seen.add(key);
      matchedPhrases.push(key);
      rawPoints += 35;

      const start = Math.max(0, match.index - 24);
      const end = Math.min(normalized.length, match.index + match[0].length + 48);
      const rawSnippet = normalized.slice(start, end).trim();

      findings.push({
        layer: "rule",
        category: isCustom ? "custom_phrase" : "instruction_override",
        attackType: "instruction_override",
        scoreImpact: 35,
        summary: isCustom
          ? `Matched custom blocked phrase: "${key}"`
          : `Matched instruction-override phrase: "${key}"`,
        snippet: maskSensitiveText(rawSnippet).slice(0, 160),
      });
    }
  }

  const scoreImpact = Math.min(50, rawPoints);
  return { matchedPhrases, scoreImpact, findings };
}

