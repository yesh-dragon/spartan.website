import { ShieldAlert, ShieldCheck } from "lucide-react";

export function GuardToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
        enabled
          ? "border-accent/40 bg-accent/5"
          : "border-danger/50 bg-danger/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
            enabled
              ? "border-accent/40 bg-accent/15 text-accent"
              : "border-danger/45 bg-danger/15 text-danger"
          }`}
        >
          {enabled ? (
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-ink">
            {enabled ? "Agent Guard: ON (Protected)" : "Agent Guard: OFF (Vulnerable Demo)"}
          </p>
          <p className="text-xs text-ink-muted">
            {enabled
              ? "Inputs are scanned before MailPilot runs; actions pause at the Action Firewall."
              : "Untrusted email HTML is fed straight to MailPilot. Outbound leaks are simulated only."}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-8 w-20 shrink-0 items-center rounded-full border p-1 transition-colors ${
          enabled
            ? "border-accent/60 bg-accent/25 justify-end"
            : "border-danger/60 bg-danger/25 justify-start"
        }`}
      >
        <span className="sr-only">Toggle Agent Guard protection</span>
        <span
          className={`flex h-6 w-10 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
            enabled ? "bg-accent text-canvas" : "bg-danger text-ink"
          }`}
        >
          {enabled ? "ON" : "OFF"}
        </span>
      </button>
    </div>
  );
}

