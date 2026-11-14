import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuditEntry, AuditVerifyResult } from "@agent-guard/shared";
import { AlertTriangle, ChevronDown, Link2, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/shared/Toast";
import { AppShell } from "../components/layout/AppShell";
import { VerifyIntegrityButton } from "../components/audit/VerifyIntegrityButton";
import { SimulateTamperButton } from "../components/audit/SimulateTamperButton";
import { IntegrityResultBanner } from "../components/audit/IntegrityResultBanner";
import { ChainView } from "../components/audit/ChainView";
import { EmptyState } from "../components/shared/EmptyState";
import { Skeleton } from "../components/shared/Skeleton";
import { Button } from "../components/shared/Button";
import { Badge } from "../components/shared/Badge";

export function AuditLog() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>(null);
  const [olderEntries, setOlderEntries] = useState<AuditEntry[]>([]);
  const [extraCursor, setExtraCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    staleTime: 60_000,
  });

  const auditQuery = useQuery({
    queryKey: ["audit"],
    queryFn: () => api.listAudit(undefined, 50),
  });

  // Reset accumulated older pages cleanly whenever top page refreshes
  useEffect(() => {
    if (auditQuery.data) {
      setOlderEntries([]);
      setExtraCursor(auditQuery.data.nextCursor);
    }
  }, [auditQuery.data]);

  const verifyMutation = useMutation({
    mutationFn: api.verifyAudit,
    onSuccess: (res) => {
      setVerifyResult(res);
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });

      if (res.valid) {
        pushToast("success", `Verified ${res.checked} hash-chained audit entries.`);
      } else {
        pushToast("error", `Chain integrity broken at sequence #${res.brokenAtSeq}!`);
      }
    },
    onError: (err) => {
      pushToast("error", err instanceof Error ? err.message : "Failed to verify audit chain.");
    },
  });

  const tamperMutation = useMutation({
    mutationFn: api.simulateTamper,
    onSuccess: (res) => {
      setVerifyResult(null);
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
      pushToast(
        "info",
        `Tampered with seq #${res.tamperedSeq} (${res.originalEventType}). Click Verify Integrity to inspect!`,
      );
    },
    onError: (err) => {
      pushToast(
        "error",
        err instanceof Error ? err.message : "Failed to simulate tamper event.",
      );
    },
  });

  const handleLoadMore = async () => {
    if (extraCursor === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = await api.listAudit(extraCursor, 50);
      setOlderEntries((prev) => [...prev, ...nextPage.entries]);
      setExtraCursor(nextPage.nextCursor);
    } catch (err) {
      pushToast(
        "error",
        err instanceof Error ? err.message : "Failed to load older audit entries.",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const firstPageEntries = auditQuery.data?.entries ?? [];
  const entries = [...firstPageEntries, ...olderEntries];
  const isDemoMode = Boolean(healthQuery.data?.demoMode);

  return (
    <AppShell title="Tamper-Evident Audit Log">
      <div className="space-y-5">
        <div className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-xl border border-hairline bg-surface p-5">
          <img
            src="/assets/audit-ledger-chain.jpg"
            alt=""
            aria-hidden="true"
            width={1376}
            height={768}
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-surface/65"
          />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-semibold text-ink">
                Cryptographic Event Chain
              </h2>
              <Badge tone="telemetry">SHA-256</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Each row links its predecessor via <code className="font-mono">prev_hash</code> and
              commits to canonical JSONB payloads.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2.5">
            <VerifyIntegrityButton
              loading={verifyMutation.isPending}
              onClick={() => verifyMutation.mutate()}
            />
            {isDemoMode && (
              <SimulateTamperButton
                loading={tamperMutation.isPending}
                disabled={entries.length === 0}
                onClick={() => tamperMutation.mutate()}
              />
            )}
          </div>
        </div>

        {verifyResult && <IntegrityResultBanner result={verifyResult} />}

        {auditQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : auditQuery.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-danger/45 bg-danger/10 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
              <div>
                <p className="font-display text-sm font-semibold text-ink">
                  Unable to load audit log
                </p>
                <p className="text-xs text-ink-muted">
                  {auditQuery.error instanceof Error ? auditQuery.error.message : "Request failed."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => void auditQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Link2 className="h-5 w-5" />}
            title="Audit ledger is empty"
            description="Scan an email or update settings to append the first genesis-linked entry to your cryptographic audit trail."
          />
        ) : (
          <>
            <ChainView
              entries={entries}
              brokenAtSeq={verifyResult && !verifyResult.valid ? verifyResult.brokenAtSeq : null}
            />

            {extraCursor !== null && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="secondary"
                  loading={loadingMore}
                  onClick={handleLoadMore}
                  icon={<ChevronDown className="h-4 w-4" />}
                >
                  Load Older Entries (before #{extraCursor})
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
