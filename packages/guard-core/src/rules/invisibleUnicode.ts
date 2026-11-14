import type { RuleFinding } from "@agent-guard/shared";
import { MAX_SCAN_CHARS } from "../shield/patterns.js";

export interface InvisibleUnicodeResult {
  count: number;
  offsets: number[];
  codepoints: Record<string, number>;
  strippedText: string;
  findings: RuleFinding[];
}

const INVISIBLE_CODEPOINTS = new Map<number, string>([
  [0x200b, "U+200B (ZERO WIDTH SPACE)"],
  [0x200c, "U+200C (ZERO WIDTH NON-JOINER)"],
  [0x200d, "U+200D (ZERO WIDTH JOINER)"],
  [0x2060, "U+2060 (WORD JOINER)"],
  [0xfeff, "U+FEFF (ZERO WIDTH NO-BREAK SPACE)"],
  [0x202a, "U+202A (LRE)"],
  [0x202b, "U+202B (RLE)"],
  [0x202c, "U+202C (PDF)"],
  [0x202d, "U+202D (LRO)"],
  [0x202e, "U+202E (RLO)"],
  [0x2066, "U+2066 (LRI)"],
  [0x2067, "U+2067 (RLI)"],
  [0x2068, "U+2068 (FSI)"],
  [0x2069, "U+2069 (PDI)"],
]);

/** Detects zero-width and bidirectional control characters in linear O(n) time. */
export function scanInvisibleUnicode(rawInput: string): InvisibleUnicodeResult {
  const input =
    rawInput.length > MAX_SCAN_CHARS ? rawInput.slice(0, MAX_SCAN_CHARS) : rawInput;
  const offsets: number[] = [];
  const codepoints: Record<string, number> = {};
  const chunks: string[] = [];
  let lastKeep = 0;

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    const label = INVISIBLE_CODEPOINTS.get(code);
    if (label) {
      if (i > lastKeep) {
        chunks.push(input.slice(lastKeep, i));
      }
      lastKeep = i + 1;
      offsets.push(i);
      codepoints[label] = (codepoints[label] ?? 0) + 1;
    }
  }
  if (lastKeep < input.length) {
    chunks.push(input.slice(lastKeep));
  }

  const strippedText = chunks.join("");
  const count = offsets.length;
  const findings: RuleFinding[] = [];

  if (count > 0) {
    const summaryTypes = Object.entries(codepoints)
      .map(([k, v]) => `${v}× ${k}`)
      .slice(0, 4)
      .join(", ");
    findings.push({
      layer: "rule",
      category: "invisible_unicode",
      attackType: "hidden_content",
      scoreImpact: 25,
      count,
      offsets: offsets.slice(0, 100),
      summary: `Detected ${count} invisible or bidirectional control character${count === 1 ? "" : "s"}`,
      detail: summaryTypes,
    });
  }

  return {
    count,
    offsets,
    codepoints,
    strippedText,
    findings,
  };
}

