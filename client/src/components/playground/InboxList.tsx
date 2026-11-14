import type { EmailRecord } from "@agent-guard/shared";
import { Lock, Mail, ShieldAlert } from "lucide-react";
import { formatRelativeTime } from "../../lib/format";

export function InboxList({
  emails,
  selectedId,
  onSelect,
}: {
  emails: EmailRecord[];
  selectedId: string | null;
  onSelect: (email: EmailRecord) => void;
}) {
  return (
    <div className="divide-y divide-hairline overflow-y-auto max-h-[540px]">
      {emails.map((email) => {
        const active = email.id === selectedId;
        const isHero = email.subject.toLowerCase().includes("invoice follow-up");
        const isNotes = email.from_address === "notes@self.internal";

        return (
          <button
            key={email.id}
            type="button"
            onClick={() => onSelect(email)}
            className={`w-full px-4 py-3.5 text-left transition-colors ${
              active
                ? "bg-surface-2 border-l-2 border-l-accent"
                : "hover:bg-surface-2/60 border-l-2 border-l-transparent"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {email.quarantined ? (
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />
                ) : isNotes ? (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
                ) : (
                  <Mail className="h-3.5 w-3.5 shrink-0 text-ink-dim" aria-hidden="true" />
                )}
                <span className="truncate font-mono text-[11px] text-ink-muted">
                  {email.from_address}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-ink-dim">
                {formatRelativeTime(email.received_at)}
              </span>
            </div>

            <p className="mt-1 truncate text-sm font-medium text-ink">{email.subject}</p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {email.quarantined && (
                <span className="rounded border border-danger/40 bg-danger/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-danger">
                  Quarantined
                </span>
              )}
              {isHero && (
                <span className="rounded border border-accent/35 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-accent">
                  Hero Demo
                </span>
              )}
              {isNotes && (
                <span className="rounded border border-warning/35 bg-warning/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-warning">
                  Vault Notes
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

