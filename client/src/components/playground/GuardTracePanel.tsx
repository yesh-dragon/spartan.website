import type { AgentTraceStep, GuardVerdict } from "@agent-guard/shared";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, SkipForward } from "lucide-react";
import { Badge } from "../shared/Badge";
import { VerdictPill } from "../shared/SeverityPill";

function StepIcon({ status }: { status: AgentTraceStep["status"] }) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />;
    case "block":
      return <ShieldAlert className="h-4 w-4 text-danger shrink-0" aria-hidden="true" />;
    case "warn":
    case "degraded":
      return <AlertTriangle className="h-4 w-4 text-warning shrink-0" aria-hidden="true" />;
    case "paused":
      return <Clock className="h-4 w-4 text-warning shrink-0" aria-hidden="true" />;
    case "simulated":
      return <ShieldAlert className="h-4 w-4 text-danger shrink-0" aria-hidden="true" />;
    case "skipped":
      return <SkipForward className="h-4 w-4 text-ink-dim shrink-0" aria-hidden="true" />;
  }
}

export function GuardTracePanel({
  trace,
  verdict,
  loading,
}: {
  trace: AgentTraceStep[];
  verdict: GuardVerdict | null;
  loading: boolean;
}) {
  return (
    <aside className="rounded-xl border border-hairline bg-surface p-5">
      <div className="flex items-center justify-between gap-2 border-b border-hairline pb-3.5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
            Runtime Telemetry
          </p>
          <h3 className="font-display text-base font-semibold text-ink">Guard Trace</h3>
        </div>
        {verdict && <VerdictPill verdict={verdict.verdict} />}
      </div>

      {verdict?.judgeDegraded && (
        <div className="mt-3 rounded-lg border border-warning/45 bg-warning/10 px-3 py-2 font-mono text-[11px] text-warning">
          DEGRADED MODE: AI judge unavailable — rules-only decision applied.
        </div>
      )}

      {verdict && (
        <div className="mt-4 rounded-lg border border-hairline bg-canvas p-3.5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-ink-muted">RISK SCORE</span>
            <span
              className={`font-semibold ${
                verdict.riskScore >= 60
                  ? "text-danger"
                  : verdict.riskScore >= 30
                    ? "text-warning"
                    : "text-accent"
              }`}
            >
              {verdict.riskScore}/100
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full transition-all duration-300 ${
                verdict.riskScore >= 60
                  ? "bg-danger"
                  : verdict.riskScore >= 30
                    ? "bg-warning"
                    : "bg-accent"
              }`}
              style={{ width: `${verdict.riskScore}%` }}
            />
          </div>
          {verdict.findings.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-hairline pt-2.5">
              {verdict.findings.map((f, idx) => (
                <div key={idx} className="font-mono text-[11px] text-ink-muted">
                  <span className="text-ink">• {f.summary}</span>
                  {f.snippet && (
                    <span className="mt-0.5 block truncate text-[10px] text-ink-dim">
                      “{f.snippet}”
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {loading && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 font-mono text-xs text-accent animate-pulse">
            Running rules, Gemini judge, and Data Shield checks...
          </div>
        )}

        {!loading && trace.length === 0 && (
          <p className="rounded-lg border border-dashed border-hairline p-4 text-center text-xs text-ink-dim">
            Select an email and click “Ask assistant to summarize and reply” to inspect the live
            step-by-step Guard Trace.
          </p>
        )}

        {trace.map((step, idx) => (
          <div
            key={`${step.step}-${idx}`}
            className="rounded-lg border border-hairline bg-surface-2/60 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <StepIcon status={step.status} />
                <span className="text-xs font-semibold text-ink">{step.title}</span>
              </div>
              {step.latencyMs !== undefined && (
                <Badge tone="neutral">{step.latencyMs}ms</Badge>
              )}
            </div>
            <p className="mt-1.5 pl-6 text-xs leading-relaxed text-ink-muted">{step.detail}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

