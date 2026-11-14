import type { GuardVerdict } from "@agent-guard/shared";
import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { SeverityPill } from "../shared/SeverityPill";
import { formatAttackTypeLabel } from "../../lib/format";

export function QuarantineCard({ verdict }: { verdict: GuardVerdict }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-danger/50 bg-danger/10 p-5">
      <div
        aria-hidden="true"
        className="scanline-sweep pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-danger/15 to-transparent"
      />
      <div className="relative z-10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-danger">
            <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
            <h3 className="font-display text-base font-semibold">
              Email Quarantined — MailPilot Execution Blocked
            </h3>
          </div>
          <SeverityPill severity={verdict.severity} />
        </div>

        <p className="text-sm leading-relaxed text-ink">{verdict.explanation}</p>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-ink-muted">
          <span>
            Attack Type:{" "}
            <strong className="text-ink">{formatAttackTypeLabel(verdict.attackType)}</strong>
          </span>
          <span>·</span>
          <span>
            Risk Score: <strong className="text-danger">{verdict.riskScore}/100</strong>
          </span>
        </div>

        <div className="rounded-lg border border-hairline bg-canvas/80 p-3 text-xs text-ink-muted">
          <strong className="text-ink">Recommended action:</strong> {verdict.recommendedAction}
        </div>

        <div className="flex flex-wrap gap-4 pt-1 text-xs">
          <Link to="/alerts" className="font-medium text-accent hover:underline">
            View security alert →
          </Link>
          <Link to="/audit-log" className="font-medium text-telemetry hover:underline">
            Inspect audit hash entry →
          </Link>
        </div>
      </div>
    </div>
  );
}

