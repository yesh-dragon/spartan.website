import { Activity, Clock, Link2, ShieldAlert } from "lucide-react";
import type { StatsResponse } from "../../lib/api";
import { formatRelativeTime } from "../../lib/format";
import { StatCard } from "../shared/StatCard";

export function StatGrid({ stats }: { stats: StatsResponse["stats"] }) {
  const integrityValue = stats.lastIntegrity
    ? stats.lastIntegrity.valid
      ? "Verified"
      : `Broken #${stats.lastIntegrity.brokenAtSeq ?? "?"}`
    : `${stats.totalAuditEntries} logged`;

  const integritySubtext = stats.lastIntegrity
    ? `${stats.totalAuditEntries} entries · checked ${formatRelativeTime(stats.lastIntegrity.checkedAt)}`
    : "Run Verify Integrity in Audit Log";

  const integrityTone = stats.lastIntegrity
    ? stats.lastIntegrity.valid
      ? "accent"
      : "danger"
    : "neutral";

  return (
    <section aria-label="Security KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Scans"
        value={stats.totalScans}
        subtext="Input & outbound shield checks"
        icon={<Activity className="h-5 w-5 text-telemetry" aria-hidden="true" />}
        tone="neutral"
      />
      <StatCard
        label="Threats Blocked"
        value={stats.threatsBlocked}
        subtext="Blocked inputs & critical traps"
        icon={<ShieldAlert className="h-5 w-5 text-danger" aria-hidden="true" />}
        tone={stats.threatsBlocked > 0 ? "danger" : "neutral"}
      />
      <StatCard
        label="Pending Approvals"
        value={stats.pendingApprovals}
        subtext="Outbound actions paused for human"
        icon={<Clock className="h-5 w-5 text-warning" aria-hidden="true" />}
        tone={stats.pendingApprovals > 0 ? "warning" : "neutral"}
      />
      <StatCard
        label="Hash Chain Status"
        value={integrityValue}
        subtext={integritySubtext}
        icon={
          <Link2
            className={`h-5 w-5 ${
              integrityTone === "danger"
                ? "text-danger"
                : integrityTone === "accent"
                  ? "text-accent"
                  : "text-ink-muted"
            }`}
            aria-hidden="true"
          />
        }
        tone={integrityTone}
      />
    </section>
  );
}

