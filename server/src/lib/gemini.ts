import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodType } from "zod";
import { getEnv } from "../config/env.js";
import { getLogger } from "./logger.js";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const env = getEnv();
    aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiClient;
}

function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { status?: number; code?: number; message?: string };
  const status = anyErr.status ?? anyErr.code;
  if (status === 429 || (typeof status === "number" && status >= 500 && status < 600)) {
    return true;
  }
  const msg = String(anyErr.message ?? "");
  return /\b(429|500|502|503|504|rate limit|temporarily unavailable|timeout|aborted)\b/i.test(msg);
}

function buildOpenApiJsonSchema<T>(schema: ZodType<T>): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(schema, {
    $refStrategy: "none",
  }) as Record<string, unknown>;
  delete jsonSchema.$schema;
  return jsonSchema;
}

export interface StructuredGeminiParams<T> {
  systemInstruction: string;
  contents: string;
  schema: ZodType<T>;
  temperature?: number;
  model?: string;
  timeoutMs?: number;
  operationName: string;
}

export interface StructuredGeminiResult<T> {
  data: T;
  latencyMs: number;
  promptTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

/**
 * Calls Gemini generateContent with strict JSON schema, 15s timeout,
 * 1 jittered retry on 429/5xx, and Zod verification on the parsed response.
 */
export async function generateStructuredJson<T>(
  params: StructuredGeminiParams<T>,
): Promise<StructuredGeminiResult<T>> {
  const env = getEnv();
  const logger = getLogger();
  const ai = getGeminiClient();
  const model = params.model ?? env.GEMINI_MODEL;
  const timeoutMs = params.timeoutMs ?? 15_000;
  const jsonSchema = buildOpenApiJsonSchema(params.schema);

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt === 1) {
      const jitterMs = 250 + Math.floor(Math.random() * 450);
      await new Promise((resolve) => setTimeout(resolve, jitterMs));
    }

    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: params.temperature ?? 0,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
          abortSignal: controller.signal,
        },
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      const rawText = response.text;
      if (!rawText) {
        throw new Error("Gemini returned empty text payload");
      }

      const parsedJson = JSON.parse(rawText) as unknown;
      const validated = params.schema.safeParse(parsedJson);
      if (!validated.success) {
        throw new Error(`Gemini JSON schema validation failed: ${validated.error.message}`);
      }

      const usage = response.usageMetadata;
      logger.info(
        {
          operation: params.operationName,
          model,
          latencyMs,
          promptTokens: usage?.promptTokenCount,
          outputTokens: usage?.candidatesTokenCount,
          totalTokens: usage?.totalTokenCount,
        },
        "Gemini structured call completed",
      );

      return {
        data: validated.data,
        latencyMs,
        promptTokens: usage?.promptTokenCount,
        outputTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount,
      };
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const latencyMs = Date.now() - start;
      logger.warn(
        {
          operation: params.operationName,
          attempt: attempt + 1,
          latencyMs,
          error: err instanceof Error ? err.message : "unknown",
        },
        "Gemini structured call failed",
      );
      if (attempt === 0 && isRetryableError(err)) {
        continue;
      }
      break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini call failed");
}

