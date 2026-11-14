import type { AuditEntry } from "@agent-guard/shared";
import { ArrowDown, Link2, ShieldAlert } from "lucide-react";
import { Badge } from "../shared/Badge";
import { HashBadge } from "../shared/HashBadge";
import { formatTimestamp } from "../../lib/format";

export function ChainView({
  entries,
  brokenAtSeq,
}: {
  entries: AuditEntry[];
  brokenAtSeq: number | null;
}) {
  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => {
        const seqNum = Number(entry.seq);
        const isBroken = brokenAtSeq !== null && seqNum === brokenAtSeq;
        const isAfterBroken = brokenAtSeq !== null && seqNum > brokenAtSeq;
        const payloadPreview = JSON.stringify(entry.payload);

        return (
          <div key={entry.id} className="relative">
            <div
              className={`rounded-xl border p-4 transition-colors ${
                isBroken
                  ? "border-danger/65 bg-danger/10 shadow-glow-danger"
                  : isAfterBroken
                    ? "border-warning/35 bg-surface/80"
                    : "border-hairline bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${
                      isBroken
                        ? "border-danger/50 bg-danger/20 text-danger"
                        : "border-accent/35 bg-accent/10 text-accent"
                    }`}
                  >
                    SEQ #{seqNum}
                  </span>
                  <Badge tone={isBroken ? "danger" : "telemetry"}>{entry.event_type}</Badge>
                  {isBroken && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-danger">
                      <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                      HASH MISMATCH
                    </span>
                  )}
                </div>

                <span className="font-mono text-xs text-ink-dim">
                  {formatTimestamp(entry.created_at)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <HashBadge label="PREV" hash={entry.prev_hash} broken={isBroken} />
                <Link2 className="h-3.5 w-3.5 text-ink-dim" aria-hidden="true" />
                <HashBadge label="HASH" hash={entry.entry_hash} broken={isBroken} />
              </div>

              <pre className="mt-3 overflow-x-auto rounded-lg border border-hairline bg-canvas p-3 font-mono text-[11px] text-ink-muted">
                {payloadPreview}
              </pre>
            </div>

            {idx < entries.length - 1 && (
              <div className="flex justify-center py-1 text-ink-dim" aria-hidden="true">
                <ArrowDown className="h-3.5 w-3.5 opacity-50" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

