import type { ExplainerCallbackInput, ExplainerCallbackOutput } from "@agent-guard/core";
import { maskSensitiveText } from "@agent-guard/core";
import { ExplainerResponseSchema, type ExplainerResponse } from "@agent-guard/shared";
import { generateStructuredJson } from "../lib/gemini.js";

const EXPLAINER_SYSTEM_PROMPT = `You are a security alert translator. Convert technical security findings into plain-language alerts for non-technical users. Never use technical jargon unless necessary. Never repeat sensitive values. Respond with JSON only.`;

export type ExplainerRunnerFn = (
  input: ExplainerCallbackInput,
) => Promise<ExplainerCallbackOutput | null>;

export function createGeminiExplainer(
  callStructured = generateStructuredJson,
): ExplainerRunnerFn {
  return async (input: ExplainerCallbackInput): Promise<ExplainerCallbackOutput | null> => {
    const contents = `Write a plain-language security alert for a non-technical user.
Event: ${input.eventType}
Findings (sensitive values already masked): ${JSON.stringify(input.maskedFindings).slice(0, 4000)}
Recipient domains: ${JSON.stringify(input.recipientDomains)}
Return JSON only.`;

    try {
      const { data } = await callStructured<ExplainerResponse>({
        operationName: "alert_explainer",
        systemInstruction: EXPLAINER_SYSTEM_PROMPT,
        contents,
        schema: ExplainerResponseSchema,
        temperature: 0,
      });

      return {
        title: maskSensitiveText(data.title).slice(0, 80),
        explanation: maskSensitiveText(data.explanation).slice(0, 300),
        recommendedAction: maskSensitiveText(data.recommendedAction).slice(0, 160),
      };
    } catch {
      return null;
    }
  };
}

