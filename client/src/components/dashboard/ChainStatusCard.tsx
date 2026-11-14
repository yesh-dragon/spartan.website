import { Link } from "react-router-dom";
import { ArrowRight, Link2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { StatsResponse } from "../../lib/api";
import { formatTimestamp } from "../../lib/format";
import { Badge } from "../shared/Badge";
import { Button } from "../shared/Button";
import { Card } from "../shared/Card";

export function ChainStatusCard({ stats }: { stats: StatsResponse["stats"] }) {
  const verified = stats.lastIntegrity;
  const isBroken = verified !== null && !verified.valid;

  return (
    <Card beam beamTone={isBroken ? "danger" : "accent"} className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                isBroken
                  ? "border-danger/40 bg-danger/15 text-danger"
                  : "border-accent/40 bg-accent/15 text-accent"
              }`}
            >
              {isBroken ? (
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-ink">
                Tamper-Evident Ledger
              </h2>
              <p className="font-mono text-[11px] text-ink-dim">SHA-256 Hash Chain</p>
            </div>
          </div>
          <Badge tone={isBroken ? "danger" : verified ? "accent" : "neutral"}>
            {isBroken ? "Tampered" : verified ? "Intact" : "Unchecked"}
          </Badge>
        </div>

        <div className="mt-5 rounded-lg border border-hairline bg-surface-2/80 p-3.5 font-mono text-xs">
          <div className="flex items-center justify-between text-ink-muted">
            <span>Chain Length</span>
            <span className="font-semibold text-ink">{stats.totalAuditEntries} entries</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-ink-muted">
            <span>Last Check</span>
            <span className="text-ink">
              {verified ? formatTimestamp(verified.checkedAt) : "Not run yet"}
            </span>
          </div>
          {isBroken && verified.brokenAtSeq !== null && (
            <div className="mt-2 flex items-center justify-between text-danger">
              <span>Broken Sequence</span>
              <span className="font-semibold">Seq #{verified.brokenAtSeq}</span>
            </div>
          )}
        </div>

        {/* Visual chain representation */}
        <div className="mt-4 flex items-center gap-1.5 overflow-hidden font-mono text-[10px] text-ink-dim">
          <span className="rounded border border-hairline bg-canvas px-2 py-1">0000…00</span>
          <Link2 className="h-3 w-3 shrink-0 text-accent" aria-hidden="true" />
          <span className="rounded border border-hairline bg-canvas px-2 py-1">seq#1</span>
          <Link2 className="h-3 w-3 shrink-0 text-accent" aria-hidden="true" />
          <span
            className={`rounded border px-2 py-1 ${
              isBroken
                ? "border-danger/50 bg-danger/10 text-danger"
                : "border-accent/40 bg-accent/10 text-accent"
            }`}
          >
            seq#{Math.max(1, stats.totalAuditEntries)}
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Every scan, alert, and human decision is hashed against its predecessor using canonical
          JSONB serialization. Modifying any historical row breaks verification immediately.
        </p>
      </div>

      <div className="mt-5 pt-2">
        <Link to="/audit-log">
          <Button
            variant={isBroken ? "danger" : "secondary"}
            size="sm"
            className="w-full"
            icon={<ArrowRight className="h-3.5 w-3.5" />}
          >
            Inspect & Verify Audit Chain
          </Button>
        </Link>
      </div>
    </Card>
  );
}

