import type { GuardMode } from "@agent-guard/shared";
import { Cpu, Eye, ShieldCheck } from "lucide-react";
import { Badge } from "../shared/Badge";

export function ModeSwitch({
  mode,
  judgeEnabled,
  onModeChange,
  onJudgeChange,
}: {
  mode: GuardMode;
  judgeEnabled: boolean;
  onModeChange: (mode: GuardMode) => void;
  onJudgeChange: (enabled: boolean) => void;
}) {
  return (
    <section className="rounded-xl border border-hairline bg-surface p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-4">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">
            Enforcement & Scanner Mode
          </h2>
          <p className="text-xs text-ink-muted">
            Control how Agent Guard handles flagged emails and whether Gemini semantic judging runs
          </p>
        </div>
        <Badge tone={mode === "enforce" ? "accent" : "warning"}>
          {mode === "enforce" ? "Enforce Mode" : "Monitor Mode"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Guard mode">
        <button
          type="button"
          role="radio"
          aria-checked={mode === "enforce"}
          onClick={() => onModeChange("enforce")}
          className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
            mode === "enforce"
              ? "border-accent/55 bg-accent/10 shadow-glow"
              : "border-hairline bg-surface-2/50 hover:border-hairline-bright"
          }`}
        >
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
              mode === "enforce"
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-hairline bg-surface text-ink-muted"
            }`}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-ink">Enforce (Recommended)</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Quarantines <code className="font-mono text-ink">block</code>-level emails before the
              assistant reads raw text and generates alerts + audit logs.
            </p>
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === "monitor"}
          onClick={() => onModeChange("monitor")}
          className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
            mode === "monitor"
              ? "border-warning/55 bg-warning/10"
              : "border-hairline bg-surface-2/50 hover:border-hairline-bright"
          }`}
        >
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
              mode === "monitor"
                ? "border-warning/40 bg-warning/15 text-warning"
                : "border-hairline bg-surface text-ink-muted"
            }`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-ink">Monitor (Audit Only)</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Still detects injections, creates alerts, and enforces the Action Firewall, but
              downgrades <code className="font-mono text-ink">block</code> verdicts to{" "}
              <code className="font-mono text-ink">warn</code> on sanitized input.
            </p>
          </div>
        </button>
      </div>

      {/* Gemini Judge Toggle */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-hairline bg-surface-2/60 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-telemetry">
            <Cpu className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-ink">
              Gemini Semantic Judge Layer
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Runs structured LLM classification on sanitized text whenever deterministic rules
              are below 95% confidence. Fails closed if unavailable.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={judgeEnabled}
          aria-label="Enable Gemini semantic judge"
          onClick={() => onJudgeChange(!judgeEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
            judgeEnabled
              ? "border-accent/60 bg-accent/25"
              : "border-hairline bg-canvas"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
              judgeEnabled ? "translate-x-5 bg-accent" : "translate-x-1 bg-ink-dim"
            }`}
          />
        </button>
      </div>
    </section>
  );
}

