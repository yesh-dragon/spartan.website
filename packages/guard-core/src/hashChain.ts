import { createHash } from "node:crypto";
import { GENESIS_HASH, type AuditEntry, type AuditVerifyResult } from "@agent-guard/shared";

/**
 * Deterministic canonical JSON matching Postgres public.canonical_jsonb() byte-for-byte:
 * - Object keys sorted in UTF-16 / ASCII ("C") order
 * - Zero whitespace
 * - Undefined object properties omitted (matching JSON.stringify)
 */
export function canonicalizeJson(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeJson(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const pairs = keys.map((k) => `${JSON.stringify(k)}:${canonicalizeJson(obj[k])}`);
    return `{${pairs.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

export function buildCanonicalAuditInput(entry: {
  event_type: string;
  seq: number | string;
  created_at: string;
  payload: unknown;
}): string {
  const iso = new Date(entry.created_at).toISOString();
  return `${entry.event_type}|${String(entry.seq)}|${iso}|${canonicalizeJson(entry.payload)}`;
}

export function computeAuditHash(
  prevHash: string,
  entry: {
    event_type: string;
    seq: number | string;
    created_at: string;
    payload: unknown;
  },
): string {
  const canonical = buildCanonicalAuditInput(entry);
  return createHash("sha256")
    .update(prevHash + canonical, "utf8")
    .digest("hex");
}

/** Verifies every entry in a user's hash-chained audit log from seq 1 onward. */
export function verifyAuditChain(entries: AuditEntry[]): AuditVerifyResult {
  if (entries.length === 0) {
    return { valid: true, checked: 0, brokenAtSeq: null, reason: null };
  }

  const sorted = [...entries].sort((a, b) => Number(a.seq) - Number(b.seq));
  let expectedPrevHash = GENESIS_HASH;
  let expectedSeq = 1;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const seqNum = Number(entry.seq);

    if (seqNum !== expectedSeq) {
      return {
        valid: false,
        checked: i + 1,
        brokenAtSeq: seqNum,
        reason: `Sequence gap or out-of-order entry: expected seq ${expectedSeq}, found ${seqNum}.`,
      };
    }

    if (entry.prev_hash !== expectedPrevHash) {
      return {
        valid: false,
        checked: i + 1,
        brokenAtSeq: seqNum,
        reason: `Previous hash mismatch at seq ${seqNum}: chain linkage broken.`,
      };
    }

    const expectedEntryHash = computeAuditHash(expectedPrevHash, entry);
    if (entry.entry_hash !== expectedEntryHash) {
      return {
        valid: false,
        checked: i + 1,
        brokenAtSeq: seqNum,
        reason: `Payload or metadata tampered at seq ${seqNum}: computed SHA-256 does not match stored entry_hash.`,
      };
    }

    expectedPrevHash = entry.entry_hash;
    expectedSeq += 1;
  }

  return {
    valid: true,
    checked: sorted.length,
    brokenAtSeq: null,
    reason: null,
  };
}

