import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  subtext,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  tone?: "neutral" | "accent" | "danger" | "warning";
}) {
  const valueClass =
    tone === "accent"
      ? "text-accent"
      : tone === "danger"
        ? "text-danger"
        : tone === "warning"
          ? "text-warning"
          : "text-ink";

  return (
    <div className="relative overflow-hidden rounded-xl border border-hairline bg-surface p-5 transition-colors hover:border-hairline-bright">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">{label}</p>
          <p className={`mt-2 font-display text-3xl font-semibold tabular-nums ${valueClass}`}>
            {value}
          </p>
          {subtext && <p className="mt-1.5 text-xs text-ink-muted">{subtext}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-ink-muted">
          {icon}
        </div>
      </div>
    </div>
  );
}

