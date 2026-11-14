import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyAuditChain } from "@agent-guard/core";
import type { AuditEntry, AuditEventType, AuditVerifyResult } from "@agent-guard/shared";

export async function appendAuditEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: AuditEventType,
  payload: Record<string, unknown>,
): Promise<AuditEntry> {
  const { data, error } = await supabase.rpc("append_audit", {
    p_user: userId,
    p_event: eventType,
    p_payload: payload,
  });

  if (error || !data) {
    throw new Error(`Failed appending audit log: ${error?.message ?? "no data returned"}`);
  }
  return data as AuditEntry;
}

export async function listAuditEntries(
  supabase: SupabaseClient,
  userId: string,
  cursor?: number,
  limit = 50,
): Promise<{ entries: AuditEntry[]; nextCursor: number | null }> {
  let query = supabase
    .from("audit_log")
    .select("*")
    .eq("user_id", userId)
    .order("seq", { ascending: false })
    .limit(limit);

  if (cursor !== undefined) {
    query = query.lt("seq", cursor);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed fetching audit log: ${error.message}`);
  }

  const entries = (data ?? []) as AuditEntry[];
  const nextCursor =
    entries.length === limit ? Number(entries[entries.length - 1].seq) : null;

  return { entries, nextCursor };
}

export async function verifyUserAuditChain(
  supabase: SupabaseClient,
  userId: string,
): Promise<AuditVerifyResult> {
  const allEntries: AuditEntry[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .eq("user_id", userId)
      .order("seq", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed reading audit log for verification: ${error.message}`);
    }
    const batch = (data ?? []) as AuditEntry[];
    allEntries.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  const result = verifyAuditChain(allEntries);

  // Append integrity_check AFTER computing verification so it does not affect the checked range
  await appendAuditEvent(supabase, userId, "integrity_check", {
    valid: result.valid,
    checked: result.checked,
    brokenAtSeq: result.brokenAtSeq,
    reason: result.reason,
  });

  return result;
}

export async function simulateAuditTamper(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ tamperedSeq: number; originalEventType: string }> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("user_id", userId)
    .order("seq", { ascending: true });

  if (error) {
    throw new Error(`Failed loading audit log for tamper simulation: ${error.message}`);
  }

  const entries = (data ?? []) as AuditEntry[];
  if (entries.length === 0) {
    throw new Error("No audit entries exist yet to tamper with. Run a scan first.");
  }

  // Pick a mid-chain entry if available so the chain visibly breaks mid-history
  const targetIndex =
    entries.length >= 3
      ? Math.max(0, Math.min(entries.length - 2, Math.floor(entries.length / 2)))
      : 0;
  const target = entries[targetIndex];

  const tamperedPayload = {
    ...target.payload,
    _tampered: true,
    tamperedAt: new Date().toISOString(),
    verdict: "allow",
  };

  const { error: updateError } = await supabase
    .from("audit_log")
    .update({ payload: tamperedPayload })
    .eq("id", target.id)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Failed simulating tamper: ${updateError.message}`);
  }

  return {
    tamperedSeq: Number(target.seq),
    originalEventType: target.event_type,
  };
}

