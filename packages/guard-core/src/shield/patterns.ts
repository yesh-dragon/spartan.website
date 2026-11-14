import type { SensitiveDataType, ShieldConfig, ShieldFinding } from "@agent-guard/shared";
import { maskSensitiveValue, redactionToken } from "./mask.js";
import { verhoeffValidate } from "./verhoeff.js";

export const MAX_SCAN_CHARS = 20_000;

export const DEFAULT_SHIELD_CONFIG: ShieldConfig = {
  aadhaar: true,
  pan: true,
  upi_id: true,
  phone_in: true,
  api_key: true,
};

export const UPI_BANK_SUFFIXES = [
  "okaxis",
  "oksbi",
  "okhdfcbank",
  "okicici",
  "ybl",
  "ibl",
  "axl",
  "paytm",
  "upi",
  "apl",
  "fbl",
  "sbi",
  "hdfcbank",
  "icici",
  "axisbank",
  "kotak",
] as const;

interface RawSpanMatch {
  type: SensitiveDataType;
  start: number;
  end: number;
  raw: string;
}

const AADHAAR_REGEX = /(?<!\d)([2-9]\d{3}[ -]?\d{4}[ -]?\d{4})(?!\d)/g;
const PAN_REGEX = /(?<![A-Z0-9])([A-Z]{5}[0-9]{4}[A-Z])(?![A-Z0-9])/g;
const UPI_REGEX = new RegExp(
  `(?<![A-Za-z0-9._-])([A-Za-z0-9._-]{2,64})@(${UPI_BANK_SUFFIXES.join("|")})(?![A-Za-z0-9._-])`,
  "gi",
);
const PHONE_IN_REGEX = /(?<!\d)(?:(?:\+91|91|0)[ -]?)?([6-9]\d{4}[ -]?\d{5})(?!\d)/g;

const API_KEY_PATTERNS: readonly { regex: RegExp; captureGroup?: number }[] = [
  { regex: /(?<![A-Za-z0-9_-])(AIza[0-9A-Za-z_-]{35})(?![A-Za-z0-9_-])/g },
  { regex: /(?<![A-Za-z0-9_-])(sk-[A-Za-z0-9_-]{20,})(?![A-Za-z0-9_-])/g },
  { regex: /(?<![A-Z0-9])(AKIA[0-9A-Z]{16})(?![A-Z0-9])/g },
  { regex: /(?<![A-Za-z0-9_])(gh[pousr]_[A-Za-z0-9]{36,})(?![A-Za-z0-9_])/g },
  { regex: /(?<![A-Za-z0-9-])(xox[baprs]-[A-Za-z0-9-]{10,})(?![A-Za-z0-9-])/g },
  {
    regex: /\b(?:api[_-]?key|secret|token)[ \t]{0,12}[:=][ \t]{0,12}['"]?([A-Za-z0-9_-]{16,128})['"]?/gi,
    captureGroup: 1,
  },
];

function overlapsExisting(matches: RawSpanMatch[], start: number, end: number): boolean {
  return matches.some((m) => start < m.end && end > m.start);
}

function findRawSpans(
  inputText: string,
  config: ShieldConfig,
): RawSpanMatch[] {
  const text = inputText.length > MAX_SCAN_CHARS ? inputText.slice(0, MAX_SCAN_CHARS) : inputText;
  const matches: RawSpanMatch[] = [];

  if (config.api_key) {
    for (const { regex, captureGroup } of API_KEY_PATTERNS) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        const raw = captureGroup ? m[captureGroup] : m[1] ?? m[0];
        if (!raw) continue;
        const offsetInMatch = captureGroup ? m[0].indexOf(raw) : 0;
        const start = m.index + Math.max(0, offsetInMatch);
        const end = start + raw.length;
        if (!overlapsExisting(matches, start, end)) {
          matches.push({ type: "api_key", start, end, raw });
        }
      }
    }
  }

  if (config.aadhaar) {
    AADHAAR_REGEX.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = AADHAAR_REGEX.exec(text)) !== null) {
      const raw = m[1];
      const digits = raw.replace(/\D/g, "");
      if (digits.length === 12 && verhoeffValidate(digits)) {
        const start = m.index;
        const end = start + raw.length;
        if (!overlapsExisting(matches, start, end)) {
          matches.push({ type: "aadhaar", start, end, raw });
        }
      }
    }
  }

  if (config.pan) {
    PAN_REGEX.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PAN_REGEX.exec(text)) !== null) {
      const raw = m[1];
      const start = m.index;
      const end = start + raw.length;
      if (!overlapsExisting(matches, start, end)) {
        matches.push({ type: "pan", start, end, raw });
      }
    }
  }

  if (config.upi_id) {
    UPI_REGEX.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = UPI_REGEX.exec(text)) !== null) {
      const raw = m[0];
      const start = m.index;
      const end = start + raw.length;
      if (!overlapsExisting(matches, start, end)) {
        matches.push({ type: "upi_id", start, end, raw });
      }
    }
  }

  if (config.phone_in) {
    PHONE_IN_REGEX.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PHONE_IN_REGEX.exec(text)) !== null) {
      const raw = m[0];
      const start = m.index;
      const end = start + raw.length;
      if (!overlapsExisting(matches, start, end)) {
        matches.push({ type: "phone_in", start, end, raw });
      }
    }
  }

  matches.sort((a, b) => a.start - b.start);
  return matches;
}

export interface RedactResult {
  redactedText: string;
  findings: ShieldFinding[];
  redactions: Array<{
    type: SensitiveDataType;
    field: "to" | "subject" | "body" | "attachment";
    start: number;
    end: number;
    maskedPreview: string;
    token: string;
  }>;
}

/** Scans a single field for sensitive values, returns masked findings and a redacted string. */
export function scanAndRedactField(
  text: string,
  field: "to" | "subject" | "body" | "attachment",
  config: ShieldConfig = DEFAULT_SHIELD_CONFIG,
): RedactResult {
  const spans = findRawSpans(text, config);
  if (spans.length === 0) {
    return { redactedText: text, findings: [], redactions: [] };
  }

  let cursor = 0;
  let redacted = "";
  const findings: ShieldFinding[] = [];
  const redactions: RedactResult["redactions"] = [];

  for (const span of spans) {
    const token = redactionToken(span.type);
    const maskedPreview = maskSensitiveValue(span.type, span.raw);
    redacted += text.slice(cursor, span.start) + token;
    cursor = span.end;

    findings.push({
      type: span.type,
      field,
      maskedPreview,
      redactedToken: token,
      start: span.start,
      end: span.end,
    });

    redactions.push({
      type: span.type,
      field,
      start: span.start,
      end: span.end,
      maskedPreview,
      token,
    });
  }
  redacted += text.slice(cursor);

  return { redactedText: redacted, findings, redactions };
}

/** Replaces any sensitive values in untrusted snippets with masked previews before storage/logging. */
export function maskSensitiveText(
  text: string,
  config: ShieldConfig = DEFAULT_SHIELD_CONFIG,
): string {
  const spans = findRawSpans(text, config);
  if (spans.length === 0) return text;
  let cursor = 0;
  let out = "";
  for (const span of spans) {
    out += text.slice(cursor, span.start) + maskSensitiveValue(span.type, span.raw);
    cursor = span.end;
  }
  out += text.slice(cursor);
  return out;
}

