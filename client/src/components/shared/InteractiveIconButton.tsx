import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export type IconTone = "accent" | "telemetry" | "warning" | "danger";

interface InteractiveIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: IconTone;
  active?: boolean;
  label: string;
  children: ReactNode;
  compact?: boolean;
}

const TONE_CLASSES: Record<IconTone, { idle: string; active: string; particle: string; ring: string }> = {
  accent: {
    idle: "text-ink-muted hover:text-accent hover:border-accent/45 hover:bg-accent/10",
    active: "text-accent border-accent/45 bg-accent/15",
    particle: "bg-accent",
    ring: "border-accent/60",
  },
  telemetry: {
    idle: "text-ink-muted hover:text-telemetry hover:border-telemetry/45 hover:bg-telemetry/10",
    active: "text-telemetry border-telemetry/45 bg-telemetry/15",
    particle: "bg-telemetry",
    ring: "border-telemetry/60",
  },
  warning: {
    idle: "text-ink-muted hover:text-warning hover:border-warning/45 hover:bg-warning/10",
    active: "text-warning border-warning/45 bg-warning/15",
    particle: "bg-warning",
    ring: "border-warning/60",
  },
  danger: {
    idle: "text-ink-muted hover:text-danger hover:border-danger/45 hover:bg-danger/10",
    active: "text-danger border-danger/45 bg-danger/15",
    particle: "bg-danger",
    ring: "border-danger/60",
  },
};

const PARTICLES: Array<{ tx: string; ty: string }> = [
  { tx: "0px", ty: "-14px" },
  { tx: "12px", ty: "-8px" },
  { tx: "12px", ty: "8px" },
  { tx: "0px", ty: "14px" },
  { tx: "-12px", ty: "8px" },
  { tx: "-12px", ty: "-8px" },
];

/**
 * Clickable colorful icon button with 150-400ms pop, concentric ripple,
 * 6-point radial burst, and state color shift. Honors prefers-reduced-motion.
 */
export function InteractiveIconButton({
  tone = "accent",
  active = false,
  label,
  children,
  compact = false,
  className = "",
  onClick,
  ...rest
}: InteractiveIconButtonProps) {
  const [burstCount, setBurstCount] = useState(0);
  const styles = TONE_CLASSES[tone];
  const sizeCls = compact ? "min-h-[44px] min-w-[44px] sm:min-h-[34px] sm:min-w-[34px] p-1.5" : "min-h-[44px] min-w-[44px] p-2";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        setBurstCount((c) => c + 1);
        onClick?.(event);
      }}
      className={`group relative inline-flex shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-2 transition-[color,background-color,border-color,transform] duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 ${
        active ? styles.active : styles.idle
      } ${sizeCls} ${className}`}
      {...rest}
    >
      {burstCount > 0 && (
        <span key={burstCount} aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className={`ag-icon-ring-ripple absolute inset-0 rounded-lg border ${styles.ring}`} />
          {PARTICLES.map((p, idx) => (
            <span
              key={idx}
              style={{ "--tx": p.tx, "--ty": p.ty } as CSSProperties}
              className={`ag-particle absolute h-1 w-1 rounded-full ${styles.particle}`}
            />
          ))}
        </span>
      )}
      <span
        key={burstCount > 0 ? `pop-${burstCount}` : "idle"}
        className={`relative z-10 inline-flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110 ${
          burstCount > 0 ? "ag-icon-pop" : ""
        }`}
      >
        {children}
      </span>
    </button>
  );
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <InteractiveIconButton
      tone={isLight ? "warning" : "telemetry"}
      active={isLight}
      compact={compact}
      onClick={toggleTheme}
      label={isLight ? "Switch to dark security theme" : "Switch to light theme"}
      aria-pressed={isLight}
    >
      {isLight ? (
        <Sun className="h-4 w-4 transition-transform duration-300" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300" aria-hidden="true" />
      )}
    </InteractiveIconButton>
  );
}

