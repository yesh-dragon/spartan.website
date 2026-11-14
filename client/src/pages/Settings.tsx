import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GuardMode, ShieldConfig } from "@agent-guard/shared";
import { AlertTriangle, RefreshCw, RotateCcw, Save } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/shared/Toast";
import { AppShell } from "../components/layout/AppShell";
import { ModeSwitch } from "../components/settings/ModeSwitch";
import { ShieldToggles } from "../components/settings/ShieldToggles";
import { PhraseListEditor } from "../components/settings/PhraseListEditor";
import { IntegrationSnippet } from "../components/settings/IntegrationSnippet";
import { Button } from "../components/shared/Button";
import { Skeleton } from "../components/shared/Skeleton";

interface DraftSettings {
  mode: GuardMode;
  judgeEnabled: boolean;
  shield: ShieldConfig;
  customPhrases: string[];
  approvalTimeoutMinutes: number;
}

export function Settings() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });

  const [draft, setDraft] = useState<DraftSettings | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const s = settingsQuery.data?.settings;
    if (!s || dirty) return;
    setDraft({
      mode: s.mode,
      judgeEnabled: s.judge_enabled,
      shield: s.shield,
      customPhrases: s.custom_phrases,
      approvalTimeoutMinutes: s.approval_timeout_minutes,
    });
  }, [settingsQuery.data, dirty]);

  const updateMutation = useMutation({
    mutationFn: (next: DraftSettings) => api.updateSettings(next),
    onSuccess: ({ settings }) => {
      setDraft({
        mode: settings.mode,
        judgeEnabled: settings.judge_enabled,
        shield: settings.shield,
        customPhrases: settings.custom_phrases,
        approvalTimeoutMinutes: settings.approval_timeout_minutes,
      });
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
      pushToast("success", "Guard policy settings saved and logged.");
    },
    onError: (err) => {
      pushToast(
        "error",
        err instanceof Error ? err.message : "Failed to save settings.",
      );
    },
  });

  const handleReset = () => {
    const s = settingsQuery.data?.settings;
    if (!s) return;
    setDraft({
      mode: s.mode,
      judgeEnabled: s.judge_enabled,
      shield: s.shield,
      customPhrases: s.custom_phrases,
      approvalTimeoutMinutes: s.approval_timeout_minutes,
    });
    setDirty(false);
  };

  return (
    <AppShell title="Guard Policy Settings">
      {settingsQuery.isLoading || !draft ? (
        settingsQuery.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-danger/45 bg-danger/10 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
              <div>
                <p className="font-display text-sm font-semibold text-ink">
                  Unable to load settings
                </p>
                <p className="text-xs text-ink-muted">
                  {settingsQuery.error instanceof Error
                    ? settingsQuery.error.message
                    : "Request failed."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => void settingsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )
      ) : (
        <div className="space-y-5">
          {/* Save bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface p-4">
            <p className="text-xs text-ink-muted">
              {dirty
                ? "You have unsaved policy changes. Saving appends an immutable settings_changed audit event."
                : "Policy changes take effect immediately across all scans and MailPilot runs."}
            </p>
            <div className="flex items-center gap-2.5">
              {dirty && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={handleReset}
                >
                  Discard
                </Button>
              )}
              <Button
                size="sm"
                variant="primary"
                disabled={!dirty}
                loading={updateMutation.isPending}
                onClick={() => updateMutation.mutate(draft)}
                icon={<Save className="h-4 w-4" />}
              >
                Save Policy
              </Button>
            </div>
          </div>

          <ModeSwitch
            mode={draft.mode}
            judgeEnabled={draft.judgeEnabled}
            onModeChange={(mode) => {
              setDraft((d) => (d ? { ...d, mode } : d));
              setDirty(true);
            }}
            onJudgeChange={(judgeEnabled) => {
              setDraft((d) => (d ? { ...d, judgeEnabled } : d));
              setDirty(true);
            }}
          />

          <ShieldToggles
            shield={draft.shield}
            onChange={(shield) => {
              setDraft((d) => (d ? { ...d, shield } : d));
              setDirty(true);
            }}
          />

          <PhraseListEditor
            phrases={draft.customPhrases}
            onChange={(customPhrases) => {
              setDraft((d) => (d ? { ...d, customPhrases } : d));
              setDirty(true);
            }}
          />

          <IntegrationSnippet
            mode={draft.mode}
            approvalTimeoutMinutes={draft.approvalTimeoutMinutes}
            onTimeoutChange={(approvalTimeoutMinutes) => {
              setDraft((d) => (d ? { ...d, approvalTimeoutMinutes } : d));
              setDirty(true);
            }}
          />
        </div>
      )}
    </AppShell>
  );
}
