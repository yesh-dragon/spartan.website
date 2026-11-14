import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Severity } from "@agent-guard/shared";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/shared/Toast";
import { AppShell } from "../components/layout/AppShell";
import { SeverityFilter } from "../components/alerts/SeverityFilter";
import { AlertList } from "../components/alerts/AlertList";
import { Skeleton } from "../components/shared/Skeleton";
import { Button } from "../components/shared/Button";

export function Alerts() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [unacknowledgedOnly, setUnacknowledgedOnly] = useState(false);
  const [ackingId, setAckingId] = useState<string | null>(null);

  const alertsQuery = useQuery({
    queryKey: ["alerts", severity, unacknowledgedOnly],
    queryFn: () =>
      api.listAlerts({
        severity: severity === "all" ? undefined : severity,
        acknowledged: unacknowledgedOnly ? "false" : undefined,
      }),
  });

  const ackMutation = useMutation({
    mutationFn: (id: string) => {
      setAckingId(id);
      return api.ackAlert(id);
    },
    onSuccess: () => {
      setAckingId(null);
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      pushToast("success", "Alert acknowledged.");
    },
    onError: (err) => {
      setAckingId(null);
      pushToast(
        "error",
        err instanceof Error ? err.message : "Failed to acknowledge alert.",
      );
    },
  });

  return (
    <AppShell title="Explainable Alerts">
      <div className="space-y-5">
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <SeverityFilter
            severity={severity}
            onSeverityChange={setSeverity}
            unacknowledgedOnly={unacknowledgedOnly}
            onToggleUnacknowledged={() => setUnacknowledgedOnly((v) => !v)}
          />
        </div>

        {alertsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : alertsQuery.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-danger/45 bg-danger/10 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
              <div>
                <p className="font-display text-sm font-semibold text-ink">
                  Unable to load security alerts
                </p>
                <p className="text-xs text-ink-muted">
                  {alertsQuery.error instanceof Error
                    ? alertsQuery.error.message
                    : "Request failed."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => void alertsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <AlertList
            alerts={alertsQuery.data?.alerts ?? []}
            ackingId={ackMutation.isPending ? ackingId : null}
            onAcknowledge={(id) => ackMutation.mutate(id)}
          />
        )}
      </div>
    </AppShell>
  );
}

