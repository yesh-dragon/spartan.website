import type { ShieldFinding } from "@agent-guard/shared";
import { AlertOctagon } from "lucide-react";
import { formatDataTypeLabel } from "../../lib/format";

export function SimulatedActionBanner({
  toolCalls,
  leaks,
}: {
  toolCalls: Array<{ action: string; to: string[]; subject: string; body: string }>;
  leaks: ShieldFinding[];
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/60 bg-danger/15 p-5 shadow-glow-danger"
    >
      <div className="flex items-start gap-3">
        <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
        <div className="flex-1 space-y-3">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-danger">
              UNPROTECTED AGENT HIJACKED · SIMULATED ONLY (NEVER ACTUALLY SENT)
            </p>
            <h3 className="mt-1 font-display text-base font-semibold text-ink">
              MailPilot obeyed hidden instructions and attempted an outbound leak
            </h3>
          </div>

          {leaks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {leaks.map((l, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-danger/45 bg-canvas/85 px-2.5 py-1 font-mono text-xs text-danger"
                >
                  {formatDataTypeLabel(l.type)}: {l.maskedPreview}
                </span>
              ))}
            </div>
          )}

          {toolCalls.map((call, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-danger/35 bg-canvas/90 p-3 font-mono text-xs"
            >
              <p className="text-danger">
                PROPOSED TOOL CALL: {call.action} → {call.to.join(", ") || "(no recipient)"}
              </p>
              <p className="mt-1 text-ink-muted">Subject: {call.subject}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-ink">{call.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

