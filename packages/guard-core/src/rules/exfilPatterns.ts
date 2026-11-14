import type { RuleFinding } from "@agent-guard/shared";
import { maskSensitiveText, MAX_SCAN_CHARS } from "../shield/patterns.js";

export interface ExfilScanResult {
  matched: boolean;
  scoreImpact: number;
  findings: RuleFinding[];
}

interface ExfilRule {
  label: string;
  regex: RegExp;
}

const EXFIL_RULES: readonly ExfilRule[] = [
  {
    label: "send-to-external-email",
    regex: /\bsend\b[^.!?\n]{0,120}\bto[ \t]+[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i,
  },
  {
    label: "forward-to-recipient",
    regex: /\bforward\b[^.!?\n]{0,120}\bto\b/i,
  },
  {
    label: "email-me-the",
    regex: /\bemail[ \t]+me[ \t]+the\b/i,
  },
  {
    label: "include-api-key",
    regex: /\binclude[ \t]+(?:your|the)[ \t]+api[\s_-]?key\b/i,
  },
  {
    label: "reply-with-sensitive-data",
    regex: /\breply\b[^.!?\n]{0,80}\bwith[ \t]+(?:all[ \t]+)?(?:contacts|aadhaar|pan\b|upi|api[\s_-]?keys?|keys?|secrets?|notes?|customer[ \t]+list)\b/i,
  },
  {
    label: "request-sensitive-records",
    regex: /\b(?:send|share|export|provide|give)\b[^.!?\n]{0,100}\b(?:customer[ \t]+list|aadhaar|pan[ \t]+card|upi[ \t]+ids?|phone[ \t]+numbers?|api[\s_-]?keys?|private[ \t]+notes?|credentials?)\b/i,
  },
];

/** Linear-time bounded regex checks for exfiltration instructions. */
export function scanExfilPatterns(inputText: string): ExfilScanResult {
  const capped =
    inputText.length > MAX_SCAN_CHARS ? inputText.slice(0, MAX_SCAN_CHARS) : inputText;
  const normalized = capped.replace(/\s+/g, " ").trim();
  const findings: RuleFinding[] = [];

  for (const rule of EXFIL_RULES) {
    const match = rule.regex.exec(normalized);
    if (match) {
      findings.push({
        layer: "rule",
        category: "exfiltration_pattern",
        attackType: "data_exfiltration",
        scoreImpact: findings.length === 0 ? 30 : 0,
        summary: `Exfiltration pattern matched (${rule.label})`,
        snippet: maskSensitiveText(match[0]).slice(0, 160),
      });
    }
  }

  return {
    matched: findings.length > 0,
    scoreImpact: findings.length > 0 ? 30 : 0,
    findings,
  };
}

