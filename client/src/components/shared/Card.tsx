import type { ReactNode } from "react";

export function BorderBeam({ tone = "accent" }: { tone?: "accent" | "danger" | "telemetry" }) {
  const gradientClass =
    tone === "danger"
      ? "from-transparent via-danger/70 to-transparent"
      : tone === "telemetry"
        ? "from-transparent via-telemetry/70 to-transparent"
        : "from-transparent via-accent/70 to-transparent";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <div
        className={`border-beam-conic absolute -inset-[100%] bg-gradient-to-r ${gradientClass} opacity-25`}
      />
      <div className="absolute inset-[1px] rounded-[inherit] bg-surface" />
    </div>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  beam?: boolean;
  beamTone?: "accent" | "danger" | "telemetry";
  padding?: string;
}

export function Card({
  children,
  className = "",
  beam = false,
  beamTone = "accent",
  padding = "p-5",
}: CardProps) {
  return (
    <div
      className={`relative rounded-xl border border-hairline bg-surface shadow-panel ${className}`}
    >
      {beam && <BorderBeam tone={beamTone} />}
      <div className={`relative z-10 ${padding}`}>{children}</div>
    </div>
  );
}

