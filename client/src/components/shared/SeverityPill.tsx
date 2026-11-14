import type { Severity, Verdict } from "@agent-guard/shared";

const SEVERITY_MAP: Record<Severity, { label: string; classes: string; dot: string }> = {
  low: {
    label: "Low",
    classes: "bg-accent/10 text-accent border-accent/30",
    dot: "bg-accent",
  },
  medium: {
    label: "Medium",
    classes: "bg-warning/10 text-warning border-warning/30",
    dot: "bg-warning",
  },
  high: {
    label: "High",
    classes: "bg-danger/15 text-danger border-danger/35",
    dot: "bg-danger",
  },
  critical: {
    label: "Critical",
    classes: "bg-danger/20 text-danger border-danger/50",
    dot: "bg-danger animate-pulse",
  },
};

export function SeverityPill({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_MAP[severity] ?? SEVERITY_MAP.medium;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${cfg.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const map: Record<Verdict, { label: string; cls: string }> = {
    allow: { label: "ALLOW", cls: "bg-accent/15 text-accent border-accent/35" },
    warn: { label: "WARN", cls: "bg-warning/15 text-warning border-warning/35" },
    block: { label: "BLOCK", cls: "bg-danger/15 text-danger border-danger/45" },
  };
  const item = map[verdict];
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider ${item.cls}`}
    >
      {item.label}
    </span>
  );
}

