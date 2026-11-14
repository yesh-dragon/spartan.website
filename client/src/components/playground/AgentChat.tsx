import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Bot, Clock, Send, ShieldCheck } from "lucide-react";
import type { AgentRunResult } from "../../lib/api";
import { Button } from "../shared/Button";
import { Badge } from "../shared/Badge";
import { QuarantineCard } from "./QuarantineCard";
import { SimulatedActionBanner } from "./SimulatedActionBanner";
import { formatDataTypeLabel } from "../../lib/format";

export function AgentChat({
  running,
  result,
  onRun,
}: {
  running: boolean;
  result: AgentRunResult | null;
  onRun: (userRequest: string) => void;
}) {
  const [prompt, setPrompt] = useState("Summarize this email and reply if needed.");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onRun(prompt.trim());
  };

  return (
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-telemetry">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-ink">
              Protected Target: MailPilot Assistant
            </h3>
            <p className="text-xs text-ink-dim">
              Gemini-powered assistant with access to your private vault notes
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="primary"
          loading={running}
          onClick={() => onRun("Summarize this email and reply if needed.")}
          className="w-full sm:w-auto"
        >
          Ask assistant to summarize and reply
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="agent-prompt-input" className="sr-only">
          Instruction for MailPilot assistant
        </label>
        <input
          id="agent-prompt-input"
          type="text"
          maxLength={500}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask MailPilot to summarize, reply, or forward..."
          className="ag-recessed-input h-10 flex-1 rounded-lg border border-hairline bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim focus:border-accent"
        />
        <Button
          type="submit"
          variant="secondary"
          loading={running}
          icon={<Send className="h-3.5 w-3.5" />}
        >
          Run Agent
        </Button>
      </form>

      {result && (
        <div className="mt-5 space-y-4">
          {result.quarantined && result.verdict && <QuarantineCard verdict={result.verdict} />}

          {result.simulated && (
            <SimulatedActionBanner
              toolCalls={result.toolCalls}
              leaks={result.simulatedLeaks ?? []}
            />
          )}

          {result.summary && (
            <div className="rounded-xl border border-hairline bg-canvas p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-telemetry">
                  MailPilot Summary
                </span>
                {result.guard && !result.quarantined && (
                  <Badge tone="accent">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    Sanitized Input Only
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink">{result.summary}</p>
            </div>
          )}

          {result.pendingActions.length > 0 && (
            <div className="space-y-3">
              {result.pendingActions.map((pa) => (
                <div
                  key={pa.id}
                  className="rounded-xl border border-warning/45 bg-warning/10 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-warning">
                      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="font-display text-sm font-semibold">
                        Action Paused by Firewall ({pa.action_type})
                      </span>
                    </div>
                    <Badge tone={pa.flag === "critical" ? "danger" : "warning"}>
                      {pa.flag}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink">{pa.explanation}</p>

                  {pa.shield_findings.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {pa.shield_findings.map((f, i) => (
                        <span
                          key={i}
                          className="rounded border border-danger/40 bg-canvas/85 px-2 py-0.5 font-mono text-[11px] text-danger"
                        >
                          {formatDataTypeLabel(f.type)}: {f.maskedPreview}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <Link
                      to="/approvals"
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-accent hover:underline"
                    >
                      Review & decide in Action Firewall (/approvals) →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

