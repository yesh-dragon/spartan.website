import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentTraceStep, EmailRecord, GuardVerdict } from "@agent-guard/shared";
import { AlertTriangle, Inbox, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { api, type AgentRunResult } from "../lib/api";
import { useToast } from "../components/shared/Toast";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/shared/Button";
import { Skeleton } from "../components/shared/Skeleton";
import { EmptyState } from "../components/shared/EmptyState";
import { GuardToggle } from "../components/playground/GuardToggle";
import { InboxList } from "../components/playground/InboxList";
import { EmailViewer } from "../components/playground/EmailViewer";
import { EmailSimulatorForm } from "../components/playground/EmailSimulatorForm";
import { AgentChat } from "../components/playground/AgentChat";
import { GuardTracePanel } from "../components/playground/GuardTracePanel";

export function Playground() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const [guardEnabled, setGuardEnabled] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [revealByEmail, setRevealByEmail] = useState<Record<string, boolean>>({});
  const [verdictByEmail, setVerdictByEmail] = useState<Record<string, GuardVerdict>>({});
  const [runResult, setRunResult] = useState<AgentRunResult | null>(null);
  const [trace, setTrace] = useState<AgentTraceStep[]>([]);

  const emailsQuery = useQuery({
    queryKey: ["emails"],
    queryFn: api.listEmails,
  });

  const emails = emailsQuery.data?.emails ?? [];

  // Default to the hero urgent invoice email if present, else first email
  useEffect(() => {
    if (emails.length === 0) return;
    if (selectedId && emails.some((e) => e.id === selectedId)) return;
    const hero = emails.find((e) => e.subject.toLowerCase().includes("invoice follow-up"));
    setSelectedId((hero ?? emails[0]).id);
  }, [emails, selectedId]);

  const selectedEmail: EmailRecord | undefined = emails.find((e) => e.id === selectedId);
  const activeVerdict = selectedEmail ? (verdictByEmail[selectedEmail.id] ?? null) : null;
  const activeReveal = selectedEmail ? Boolean(revealByEmail[selectedEmail.id]) : false;

  const scanMutation = useMutation({
    mutationFn: (emailId: string) => api.checkInput({ emailId }),
    onSuccess: (res, emailId) => {
      setVerdictByEmail((prev) => ({ ...prev, [emailId]: res.verdict }));
      setRevealByEmail((prev) => ({ ...prev, [emailId]: true }));
      void queryClient.invalidateQueries({ queryKey: ["emails"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
    onError: (err) => {
      pushToast(
        "error",
        err instanceof Error ? err.message : "Failed to inspect email input.",
      );
    },
  });

  const addEmailMutation = useMutation({
    mutationFn: api.addEmail,
    onSuccess: ({ email }) => {
      setSimulatorOpen(false);
      setSelectedId(email.id);
      setRunResult(null);
      setTrace([]);
      void queryClient.invalidateQueries({ queryKey: ["emails"] });
      pushToast("success", `Added "${email.subject}" to your test inbox.`);
    },
    onError: (err) => {
      pushToast("error", err instanceof Error ? err.message : "Failed to add email.");
    },
  });

  const runAgentMutation = useMutation({
    mutationFn: (input: { emailId: string; userRequest: string; guard: boolean }) =>
      api.runAgent(input),
    onSuccess: (res, vars) => {
      setRunResult(res);
      setTrace(res.trace);
      if (res.verdict) {
        setVerdictByEmail((prev) => ({ ...prev, [vars.emailId]: res.verdict! }));
      }
      void queryClient.invalidateQueries({ queryKey: ["emails"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });

      if (res.quarantined) {
        pushToast("error", "Prompt injection blocked! Email quarantined and alert logged.");
      } else if (res.pendingActions.length > 0) {
        pushToast(
          "info",
          `Action Firewall paused ${res.pendingActions.length} outbound action(s) for human review.`,
        );
      } else if (!res.guard && (res.simulatedLeaks?.length ?? 0) > 0) {
        pushToast(
          "error",
          "Unprotected MailPilot attempted to leak sensitive data (simulated safely).",
        );
      } else {
        pushToast("success", "Assistant completed safely.");
      }
    },
    onError: (err) => {
      pushToast("error", err instanceof Error ? err.message : "Agent execution failed.");
    },
  });

  const handleSelectEmail = (email: EmailRecord) => {
    setSelectedId(email.id);
    setRunResult(null);
    setTrace([]);
  };

  const handleToggleReveal = () => {
    if (!selectedEmail) return;
    const currentlyShown = Boolean(revealByEmail[selectedEmail.id]);
    if (currentlyShown) {
      setRevealByEmail((prev) => ({ ...prev, [selectedEmail.id]: false }));
      return;
    }
    if (verdictByEmail[selectedEmail.id]) {
      setRevealByEmail((prev) => ({ ...prev, [selectedEmail.id]: true }));
      return;
    }
    scanMutation.mutate(selectedEmail.id);
  };

  const handleScanStandalone = () => {
    if (!selectedEmail) return;
    scanMutation.mutate(selectedEmail.id);
  };

  return (
    <AppShell title="Protected Agent Playground">
      <div className="space-y-5">
        <GuardToggle
          enabled={guardEnabled}
          onChange={(next) => {
            setGuardEnabled(next);
            setRunResult(null);
            setTrace([]);
          }}
        />

        {emailsQuery.isLoading ? (
          <div className="grid gap-5 xl:grid-cols-12">
            <div className="rounded-xl border border-hairline bg-surface p-4 xl:col-span-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="mt-3 h-20 w-full" />
              <Skeleton className="mt-2 h-20 w-full" />
              <Skeleton className="mt-2 h-20 w-full" />
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-5 xl:col-span-5">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-5 xl:col-span-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        ) : emailsQuery.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-danger/45 bg-danger/10 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
              <div>
                <p className="font-display text-sm font-semibold text-ink">
                  Unable to load sandbox inbox
                </p>
                <p className="text-xs text-ink-muted">
                  {emailsQuery.error instanceof Error
                    ? emailsQuery.error.message
                    : "Failed to fetch emails."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => void emailsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : emails.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="Sandbox inbox is empty"
            description="Inject a test email containing hidden prompt injections or clean text to test MailPilot."
            action={
              <Button
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setSimulatorOpen(true)}
              >
                Add Test Email
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-12">
            {/* Left column: Inbox */}
            <section className="flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface xl:col-span-3">
              <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3.5">
                <div>
                  <h2 className="font-display text-sm font-semibold text-ink">
                    MailPilot Inbox
                  </h2>
                  <p className="font-mono text-[11px] text-ink-dim">
                    {emails.length} {emails.length === 1 ? "message" : "messages"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setSimulatorOpen(true)}
                >
                  New
                </Button>
              </div>

              <InboxList
                emails={emails}
                selectedId={selectedId}
                onSelect={handleSelectEmail}
              />
            </section>

            {/* Center column: Email Viewer + Assistant Prompt */}
            <section className="space-y-5 xl:col-span-5">
              {selectedEmail && (
                <>
                  <EmailViewer
                    email={selectedEmail}
                    revealAiView={activeReveal}
                    onToggleReveal={handleToggleReveal}
                    scanVerdict={activeVerdict}
                    scanningReveal={scanMutation.isPending}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-hairline bg-surface px-4 py-3">
                    <p className="text-xs text-ink-muted">
                      Want to test <code className="font-mono text-ink">guard.checkInput()</code>{" "}
                      alone without running MailPilot?
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={scanMutation.isPending}
                      onClick={handleScanStandalone}
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    >
                      Run Input Scanner
                    </Button>
                  </div>

                  <AgentChat
                    running={runAgentMutation.isPending}
                    result={runResult}
                    onRun={(userRequest) =>
                      runAgentMutation.mutate({
                        emailId: selectedEmail.id,
                        userRequest,
                        guard: guardEnabled,
                      })
                    }
                  />
                </>
              )}
            </section>

            {/* Right column: Live Guard Trace */}
            <div className="xl:col-span-4">
              <GuardTracePanel
                trace={trace}
                verdict={activeVerdict}
                loading={runAgentMutation.isPending || scanMutation.isPending}
              />
            </div>
          </div>
        )}
      </div>

      <EmailSimulatorForm
        open={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        loading={addEmailMutation.isPending}
        onSubmit={async (input) => {
          await addEmailMutation.mutateAsync(input);
        }}
      />
    </AppShell>
  );
}
