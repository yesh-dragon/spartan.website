import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Link2,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { api } from "../lib/api";
import { AppShell } from "../components/layout/AppShell";
import { StatGrid } from "../components/dashboard/StatGrid";
import { ThreatTimelineChart } from "../components/dashboard/ThreatTimelineChart";
import { RecentAlerts } from "../components/dashboard/RecentAlerts";
import { ChainStatusCard } from "../components/dashboard/ChainStatusCard";
import { Button } from "../components/shared/Button";
import { Skeleton } from "../components/shared/Skeleton";

export function Dashboard() {
  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: api.stats,
    refetchInterval: 30_000,
  });

  return (
    <AppShell title="Security Overview">
      <div className="space-y-6">
        {/* Top quick-launch hero banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-hairline bg-surface p-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-accent">
              SOC Telemetry Live
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ink">
              Monitor AI agent traffic, pending firewall actions, and hash-chain proofs
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/playground">
              <Button variant="primary" size="sm" icon={<Terminal className="h-4 w-4" />}>
                Launch Playground
              </Button>
            </Link>
            <Link to="/approvals">
              <Button variant="secondary" size="sm" icon={<CheckSquare className="h-4 w-4" />}>
                Review Queue
              </Button>
            </Link>
            <Link to="/audit-log">
              <Button variant="secondary" size="sm" icon={<Link2 className="h-4 w-4" />}>
                Verify Ledger
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>

        {statsQuery.isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-hairline bg-surface p-5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-3 h-8 w-20" />
                  <Skeleton className="mt-2 h-3 w-36" />
                </div>
              ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-12">
              <div className="rounded-xl border border-hairline bg-surface p-5 xl:col-span-8">
                <Skeleton className="h-64 w-full" />
              </div>
              <div className="rounded-xl border border-hairline bg-surface p-5 xl:col-span-4">
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        ) : statsQuery.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-danger/45 bg-danger/10 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
              <div>
                <p className="font-display text-sm font-semibold text-ink">
                  Unable to load security overview
                </p>
                <p className="text-xs text-ink-muted">
                  {statsQuery.error instanceof Error
                    ? statsQuery.error.message
                    : "Backend request failed."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => void statsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : statsQuery.data ? (
          <>
            <StatGrid stats={statsQuery.data.stats} />

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <ThreatTimelineChart timeline={statsQuery.data.timeline} />
              </div>
              <div className="xl:col-span-4">
                <ChainStatusCard stats={statsQuery.data.stats} />
              </div>
            </div>

            <RecentAlerts alerts={statsQuery.data.recentAlerts} />
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

