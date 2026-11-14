import type { Severity } from "@agent-guard/shared";

const FILTERS: Array<{ value: Severity | "all"; label: string }> = [
  { value: "all", label: "All Severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function SeverityFilter({
  severity,
  onSeverityChange,
  unacknowledgedOnly,
  onToggleUnacknowledged,
}: {
  severity: Severity | "all";
  onSeverityChange: (s: Severity | "all") => void;
  unacknowledgedOnly: boolean;
  onToggleUnacknowledged: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = severity === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => onSeverityChange(f.value)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                active
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-hairline bg-surface text-ink-muted hover:border-hairline-bright hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onToggleUnacknowledged}
        className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
          unacknowledgedOnly
            ? "border-warning/50 bg-warning/15 text-warning"
            : "border-hairline bg-surface text-ink-muted hover:text-ink"
        }`}
      >
        {unacknowledgedOnly ? "Showing Unacknowledged" : "Show Unacknowledged Only"}
      </button>
    </div>
  );
}

