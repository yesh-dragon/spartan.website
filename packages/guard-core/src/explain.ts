import type {
  ActionType,
  AttackType,
  RuleFinding,
  SensitiveDataType,
  ShieldFinding,
  Verdict,
} from "@agent-guard/shared";

const DATA_TYPE_LABELS: Record<SensitiveDataType, string> = {
  aadhaar: "Aadhaar number",
  pan: "PAN card number",
  upi_id: "UPI payment ID",
  phone_in: "Indian phone number",
  api_key: "API key or secret token",
};

/** Generates deterministic, plain-language explanations for non-technical users. */
export function buildInputExplanation(params: {
  verdict: Verdict;
  attackType: AttackType | null;
  findings: RuleFinding[];
  invisibleUnicodeCount: number;
  hasHiddenHtml: boolean;
  judgeExplanation?: string;
}): { title: string; explanation: string; recommendedAction: string } {
  if (params.verdict === "allow") {
    return {
      title: "Email cleared by Agent Guard",
      explanation:
        "No hidden text, invisible characters, or instructions targeting the AI assistant were detected in this message.",
      recommendedAction: "Safe for the AI assistant to summarize and process.",
    };
  }

  if (
    params.judgeExplanation &&
    params.judgeExplanation.trim().length > 12 &&
    !params.hasHiddenHtml &&
    params.invisibleUnicodeCount === 0
  ) {
    const titleMap: Record<AttackType, string> = {
      instruction_override: "Prompt injection attempt detected",
      hidden_content: "Hidden instructions concealed in email",
      data_exfiltration: "Suspicious data-sharing request detected",
    };
    const title = params.attackType ? titleMap[params.attackType] : "Suspicious email content";
    return {
      title,
      explanation: params.judgeExplanation.trim(),
      recommendedAction:
        params.verdict === "block"
          ? "Quarantine this email and do not allow the assistant to act on its instructions."
          : "Review the message carefully before letting the assistant reply or share data.",
    };
  }

  switch (params.attackType) {
    case "hidden_content": {
      if (params.hasHiddenHtml && params.invisibleUnicodeCount > 0) {
        return {
          title: "Hidden text and invisible characters detected",
          explanation: `This email contains invisible HTML text plus ${params.invisibleUnicodeCount} hidden Unicode characters that are invisible to you, trying to hijack the AI assistant.`,
          recommendedAction:
            "Keep this email quarantined and block any automated replies or data sharing.",
        };
      }
      if (params.hasHiddenHtml) {
        return {
          title: "Hidden instructions concealed inside email",
          explanation:
            "This email contains text that is invisible to you (hidden using styling or comments) but readable by the AI, telling it to override your rules or send sensitive information.",
          recommendedAction:
            "Keep this email quarantined and inspect the hidden text before trusting the sender.",
        };
      }
      return {
        title: "Invisible characters hiding commands",
        explanation: `This email hides ${params.invisibleUnicodeCount} zero-width or directional control characters inside normal-looking text to disguise instructions meant for the AI.`,
        recommendedAction:
          "Quarantine this message and avoid executing any requests it contains.",
      };
    }
    case "instruction_override":
      return {
        title: "Email tries to override AI instructions",
        explanation:
          "This message contains phrases telling the AI assistant to ignore its rules, switch roles, or hide its actions from you.",
        recommendedAction:
          "Block automated actions from this email and delete or quarantine it.",
      };
    case "data_exfiltration":
      return {
        title: "Potential data leak request detected",
        explanation:
          "This email asks to send or forward sensitive records, contact lists, or private keys to an outside address.",
        recommendedAction:
          "Verify the sender independently and require manual approval with redaction before replying.",
      };
    default:
      return {
        title: "Suspicious content flagged for review",
        explanation:
          "Agent Guard detected unusual patterns in this email that could manipulate an automated assistant.",
        recommendedAction: "Review the highlighted findings before proceeding.",
      };
  }
}

export function buildActionExplanation(params: {
  action: ActionType;
  shieldFindings: ShieldFinding[];
  sourceFlagged: boolean;
  recipients: string[];
}): { title: string; explanation: string; recommendedAction: string } {
  const recipientText =
    params.recipients.length > 0 ? params.recipients.join(", ") : "an external target";

  if (params.shieldFindings.length > 0) {
    const distinctTypes = Array.from(
      new Set(params.shieldFindings.map((f) => DATA_TYPE_LABELS[f.type])),
    );
    const listText =
      distinctTypes.length === 1
        ? distinctTypes[0]
        : `${distinctTypes.slice(0, -1).join(", ")} and ${distinctTypes[distinctTypes.length - 1]}`;

    return {
      title: `Sensitive data blocked in outbound ${params.action.replace("_", " ")}`,
      explanation: `The assistant tried to ${params.action.replace("_", " ")} to ${recipientText} containing ${listText}. Agent Guard paused the action and masked the sensitive fields.`,
      recommendedAction:
        "Deny this action if unexpected, or click Approve with redaction to replace sensitive values safely.",
    };
  }

  if (params.sourceFlagged) {
    return {
      title: `Elevated review required for ${params.action.replace("_", " ")}`,
      explanation: `This action was triggered from an email previously flagged by the input scanner. Agent Guard paused it for your explicit review before sending to ${recipientText}.`,
      recommendedAction: "Verify the recipient and content before approving.",
    };
  }

  return {
    title: `Human confirmation required for ${params.action.replace("_", " ")}`,
    explanation: `All outbound agent actions pause at the Action Firewall before leaving your workspace. Confirm the recipients (${recipientText}) and message body below.`,
    recommendedAction: "Approve if expected, or Deny to cancel.",
  };
}

