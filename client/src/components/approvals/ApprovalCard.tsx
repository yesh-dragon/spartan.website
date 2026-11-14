import { useEffect, useState } from "react";
import type { PendingActionRecord } from "@agent-guard/shared";
import { Check, Clock, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { Badge } from "../shared/Badge";
import { Button } from "../shared/Button";
import { RedactionPreview } from "./RedactionPreview";
import { formatCountdown, formatDataTypeLabel, formatTimestamp } from "../../lib/format";

export function ApprovalCard({
  item,
  deciding,
  onDecide,
}: {
  item: PendingActionRecord;
  deciding: boolean;
  onDecide: (id: string, decision: "approve" | "deny" | "approve_redacted") => void;
}) {
  const [countdown, setCountdown] = useState(() => formatCountdown(item.expires_at));

  useEffect(() => {
    if (item.status !== "pending") return;
    const t = setInterval(() => setCountdown(formatCountdown(item.expires_at)), 1000);
    return () => clearInterval(t);
  }, [item.expires_at, item.status]);

  const hasShieldHits = item.shield_findings.length > 0;
  const flagTone =
    item.flag === "critical" ? "danger" : item.flag === "elevated" ? "warning" : "neutral";

  const statusTone =
    item.status === "approved" || item.status === "approved_redacted"
      ? "accent"
      : item.status === "denied" || item.status === "expired"
        ? "danger"
        : "warning";

  return (
    <article
      className={`rounded-xl border bg-surface p-5 transition-colors ${
        item.flag === "critical" && item.status === "pending"
          ? "border-danger/50 shadow-glow-danger"
          : "border-hairline"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={flagTone}>{item.flag}</Badge>
            <Badge tone={statusTone}>{item.status.replace("_", " ")}</Badge>
            <span className="font-mono text-xs font-semibold text-ink">
              {item.action_type.toUpperCase()}
            </span>
          </div>
          <p className="font-mono text-xs text-ink-muted">
            To:{" "}
            <span className="text-ink">
              {item.payload.to.length > 0 ? item.payload.to.join(", ") : "(no recipients)"}
            </span>
          </p>
          <p className="text-sm font-medium text-ink">Subject: {item.payload.subject || "—"}</p>
        </div>

        <div className="text-right font-mono text-xs">
          {item.status === "pending" ? (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-warning/35 bg-warning/10 px-2.5 py-1 text-warning">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Expires in {countdown}
            </div>
          ) : (
            <span className="text-ink-dim">
              Decided {item.decided_at ? formatTimestamp(item.decided_at) : ""}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.explanation}</p>

      {hasShieldHits && (
        <div className="mt-4 rounded-lg border border-danger/35 bg-danger/10 p-3.5">
          <div className="flex items-center gap-2 text-danger">
            <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">
              Data Shield Detections ({item.shield_findings.length} Masked)
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {item.shield_findings.map((f, idx) => (
              <span
                key={idx}
                className="rounded-md border border-danger/40 bg-canvas px-2.5 py-1 font-mono text-xs text-danger"
              >
                {formatDataTypeLabel(f.type)} ({f.field}): {f.maskedPreview}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim">
          Outbound Payload Preview (Raw Secrets Never Stored)
        </p>
        <RedactionPreview text={item.payload.body} />
      </div>

      {item.status === "pending" && (
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5 border-t border-hairline pt-4">
          <Button
            variant="danger"
            size="sm"
            loading={deciding}
            onClick={() => onDecide(item.id, "deny")}
            icon={<X className="h-3.5 w-3.5" />}
          >
            Deny
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={deciding}
            onClick={() => onDecide(item.id, "approve")}
            icon={<Check className="h-3.5 w-3.5" />}
          >
            Approve
          </Button>
          {hasShieldHits && (
            <Button
              variant="primary"
              size="sm"
              loading={deciding}
              onClick={() => onDecide(item.id, "approve_redacted")}
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
            >
              Approve with redaction
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

