import type { AlertRecord } from "@agent-guard/shared";
import { Bell, BellRing, Check, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "../shared/Button";
import { SeverityPill } from "../shared/SeverityPill";
import { formatRelativeTime, formatTimestamp } from "../../lib/format";

export function AlertCard({
  alert,
  acking,
  onAcknowledge,
}: {
  alert: AlertRecord;
  acking: boolean;
  onAcknowledge: (id: string) => void;
}) {
  const isUrgent = !alert.acknowledged && (alert.severity === "critical" || alert.severity === "high");

  return (
    <article
      className={`rounded-xl border bg-surface p-4 sm:p-5 transition-colors ${
        isUrgent ? "border-danger/45" : "border-hairline"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
              alert.acknowledged
                ? "border-accent/30 bg-accent/10 text-accent"
                : isUrgent
                  ? "border-danger/40 bg-danger/10 text-danger"
                  : "border-warning/35 bg-warning/10 text-warning"
            }`}
          >
            {alert.acknowledged ? (
              <Bell className="ag-icon-pop h-4 w-4" aria-hidden="true" />
            ) : isUrgent ? (
              <BellRing className="ag-bell-ring h-4 w-4" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityPill severity={alert.severity} />
              <span
                title={formatTimestamp(alert.created_at)}
                className="font-mono text-xs text-ink-dim"
              >
                {formatRelativeTime(alert.created_at)}
              </span>
            </div>
            <h3 className="mt-2 [overflow-wrap:anywhere] font-display text-base font-semibold text-ink">
              {alert.title}
            </h3>
          </div>
        </div>

        {alert.acknowledged ? (
          <span className="ag-icon-pop inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] text-accent">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Acknowledged
          </span>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            loading={acking}
            onClick={() => onAcknowledge(alert.id)}
            className="w-full sm:w-auto"
            icon={<Check className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />}
          >
            Acknowledge
          </Button>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink [overflow-wrap:anywhere]">{alert.explanation}</p>

      <div className="mt-3 rounded-lg border border-hairline bg-canvas px-3.5 py-2.5 text-xs text-ink-muted [overflow-wrap:anywhere]">
        <strong className="text-ink">Recommended action:</strong> {alert.recommended_action}
      </div>
    </article>
  );
}

