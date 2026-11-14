import type { GuardMode } from "@agent-guard/shared";
import { Clock, Code2, Lock } from "lucide-react";
import { Badge } from "../shared/Badge";
import { CodeBlock } from "../shared/CodeBlock";

export function IntegrationSnippet({
  mode,
  approvalTimeoutMinutes,
  onTimeoutChange,
}: {
  mode: GuardMode;
  approvalTimeoutMinutes: number;
  onTimeoutChange: (minutes: number) => void;
}) {
  const snippet = `import { createGuard } from "@agent-guard/core";

const guard = createGuard({
  mode: "${mode}",
  approvalTimeoutMinutes: ${approvalTimeoutMinutes},
});

const verdict = await guard.checkInput(emailBody);            // before the agent reads it
const decision = await guard.checkAction(agentProposedAction); // before the agent acts`;

  return (
    <section className="space-y-5 rounded-xl border border-hairline bg-surface p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-telemetry">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              Action Firewall & SDK Integration
            </h2>
            <p className="text-xs text-ink-muted">
              Fail-closed outbound policy and ready-to-drop SDK configuration
            </p>
          </div>
        </div>
        <Badge tone="accent">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Human Approval Always Required
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-surface-2/60 p-4">
          <label
            htmlFor="approval-timeout-input"
            className="block font-display text-sm font-medium text-ink"
          >
            Pending Approval Expiration (minutes)
          </label>
          <p className="mt-0.5 text-xs text-ink-muted">
            Unreviewed outbound actions expire automatically after this window (5–60 min) and log
            an <code className="font-mono text-ink">action_expired</code> denial.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              id="approval-timeout-input"
              type="number"
              min={5}
              max={60}
              value={approvalTimeoutMinutes}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isNaN(n)) {
                  onTimeoutChange(Math.min(60, Math.max(5, Math.round(n))));
                }
              }}
              className="h-10 w-24 rounded-lg border border-hairline bg-canvas px-3 font-mono text-sm text-ink focus:border-accent/60 focus:outline-none"
            />
            <span className="font-mono text-xs text-ink-dim">minutes (default: 15)</span>
          </div>
        </div>

        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center gap-2 font-display text-sm font-medium text-ink">
            <Lock className="h-4 w-4 text-accent" aria-hidden="true" />
            Action Firewall Lock
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            Every external side effect (<code className="font-mono text-ink">send_email</code>,{" "}
            <code className="font-mono text-ink">forward_email</code>,{" "}
            <code className="font-mono text-ink">reply_email</code>,{" "}
            <code className="font-mono text-ink">share_file</code>) pauses for human review. This
            policy is non-bypassable even in Monitor mode.
          </p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 font-mono text-xs text-ink-muted">
          <Code2 className="h-3.5 w-3.5 text-telemetry" aria-hidden="true" />
          <span>Wrap any agent with your current policy:</span>
        </div>
        <CodeBlock code={snippet} filename="agent-guard-init.ts" />
      </div>
    </section>
  );
}

