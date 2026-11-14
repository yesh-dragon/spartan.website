import type {
  AttackType,
  GuardMode,
  JudgeResponse,
  RuleFinding,
  Severity,
  Verdict,
} from "@agent-guard/shared";

export interface ScoreInputs {
  phraseScore: number; // capped at 50
  hasHiddenHtml: boolean;
  hasInvisibleUnicode: boolean;
  hasExfilPattern: boolean;
  judge?: JudgeResponse;
  findings: RuleFinding[];
  mode: GuardMode;
}

export interface ScoreSummary {
  riskScore: number;
  ruleScore: number;
  ruleConfidence: number;
  verdict: Verdict;
  effectiveVerdict: Verdict;
  severity: Severity;
  attackType: AttackType | null;
}

export function scoreToSeverityAndVerdict(riskScore: number): {
  severity: Severity;
  verdict: Verdict;
} {
  if (riskScore >= 85) return { severity: "critical", verdict: "block" };
  if (riskScore >= 60) return { severity: "high", verdict: "block" };
  if (riskScore >= 30) return { severity: "medium", verdict: "warn" };
  return { severity: "low", verdict: "allow" };
}

export function computeRuleScore(inputs: {
  phraseScore: number;
  hasHiddenHtml: boolean;
  hasInvisibleUnicode: boolean;
  hasExfilPattern: boolean;
}): { ruleScore: number; ruleConfidence: number } {
  let score = 0;
  score += Math.min(50, Math.max(0, inputs.phraseScore));
  if (inputs.hasHiddenHtml) score += 40;
  if (inputs.hasInvisibleUnicode) score += 25;
  if (inputs.hasExfilPattern) score += 30;
  const ruleScore = Math.min(100, score);

  let ruleConfidence = 0;
  if (ruleScore >= 60) {
    ruleConfidence = Math.min(1, 0.95 + (ruleScore - 60) * 0.00125);
  } else if (ruleScore >= 30) {
    ruleConfidence = 0.6 + (ruleScore - 30) * 0.008;
  } else {
    ruleConfidence = 0.1;
  }

  return { ruleScore, ruleConfidence };
}

export function selectPrimaryAttackType(inputs: {
  hasHiddenHtml: boolean;
  hasInvisibleUnicode: boolean;
  phraseScore: number;
  hasExfilPattern: boolean;
  judge?: JudgeResponse;
}): AttackType | null {
  if (inputs.hasHiddenHtml || inputs.hasInvisibleUnicode) {
    return "hidden_content";
  }
  if (inputs.phraseScore > 0) {
    return "instruction_override";
  }
  if (inputs.hasExfilPattern) {
    return "data_exfiltration";
  }
  if (inputs.judge?.isInjection && inputs.judge.attackType !== "none") {
    return inputs.judge.attackType;
  }
  return null;
}

export function computeFinalScore(inputs: ScoreInputs): ScoreSummary {
  const { ruleScore, ruleConfidence } = computeRuleScore(inputs);
  const judgeAdd =
    inputs.judge?.isInjection === true
      ? Math.round(Math.min(1, Math.max(0, inputs.judge.confidence)) * 40)
      : 0;

  const riskScore = Math.min(100, ruleScore + judgeAdd);
  const { severity, verdict } = scoreToSeverityAndVerdict(riskScore);
  const effectiveVerdict: Verdict = inputs.mode === "monitor" ? "allow" : verdict;
  const attackType = selectPrimaryAttackType(inputs);

  return {
    riskScore,
    ruleScore,
    ruleConfidence,
    verdict,
    effectiveVerdict,
    severity,
    attackType,
  };
}

