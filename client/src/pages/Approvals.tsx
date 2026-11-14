import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckSquare, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/shared/Toast";
import { AppShell } from "../components/layout/AppShell";
import { ApprovalCard } from "../components/approvals/ApprovalCard";
import { EmptyState } from "../components/shared/EmptyState";
import { Skeleton } from "../components/shared/Skeleton";
import { Button } from "../components/shared/Button";

type ApprovalStatusTab =
  | "pending"
  | "approved"
  | "approved_redacted"
  | "denied"
  | "expired"
  | "all";

const STATUS_TABS: Array<{ value: ApprovalStatusTab; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved_redacted", label: "Redacted" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All History" },
];

export function Approvals() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [status, setStatus] = useState<ApprovalStatusTab>("pending");
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const approvalsQuery = useQuery({
    queryKey: ["approvals", status],
    queryFn: () => api.listApprovals(status),
    refetchInterval: status === "pending" ? 15_000 : false,
  });

  const decideMutation = useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "approve" | "deny" | "approve_redacted";
    }) => {
      setDecidingId(id);
      return api.decideApproval(id, decision);
    },
    onSuccess: (res, vars) => {
      setDecidingId(null);
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });

      if (vars.decision === "approve_redacted") {
        pushToast("success", `Action ${res.approval.action_type} approved with redaction.`);
      } else if (vars.decision === "approve") {
        pushToast("success", `Action ${res.approval.action_type} approved.`);
      } else {
        pushToast("info", `Action ${res.approval.action_type} denied and logged.`);
      }
    },
    onError: (err) => {
      setDecidingId(null);
      pushToast(
        "error",
        err instanceof Error ? err.message : "Failed to record firewall decision.",
      );
    },
  });

  const approvals = approvalsQuery.data?.approvals ?? [];

  return (
    <AppShell title="Action Firewall Queue">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface p-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Approval status filter">
            {STATUS_TABS.map((tab) => {
              const active = status === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(tab.value)}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                    active
                      ? "border-accent/50 bg-accent/15 text-accent"
                      : "border-hairline bg-canvas text-ink-muted hover:border-hairline-bright hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="ghost"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => void approvalsQuery.refetch()}
          >
            Refresh
          </Button>
        </div>

        {approvalsQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : approvalsQuery.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-danger/45 bg-danger/10 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
              <div>
                <p className="font-display text-sm font-semibold text-ink">
                  Unable to load approval queue
                </p>
                <p className="text-xs text-ink-muted">
                  {approvalsQuery.error instanceof Error
                    ? approvalsQuery.error.message
                    : "Request failed."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => void approvalsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : approvals.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="h-5 w-5" />}
            title={
              status === "pending"
                ? "No pending outbound actions"
                : `No ${status.replace("_", " ")} actions`
            }
            description="Whenever the Protected Agent proposes sending, replying, forwarding, or sharing externally, the action pauses here until a human approves or redacts it."
          />
        ) : (
          <div className="space-y-4">
            {approvals.map((item) => (
              <ApprovalCard
                key={item.id}
                item={item}
                deciding={decidingId === item.id && decideMutation.isPending}
                onDecide={(id, decision) => decideMutation.mutate({ id, decision })}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

