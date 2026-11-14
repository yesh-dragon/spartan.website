import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "warning" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent text-canvas font-semibold hover:bg-accent/90 shadow-glow border border-accent/40",
  secondary:
    "bg-surface-2 text-ink border border-hairline hover:border-hairline-bright hover:bg-surface-3",
  danger:
    "bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25",
  warning:
    "bg-warning/15 text-warning border border-warning/40 hover:bg-warning/25",
  ghost:
    "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-2/80 border border-transparent",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "min-h-[44px] sm:min-h-0 sm:h-8 px-3 py-2 sm:py-0 text-xs gap-1.5 rounded-md",
  md: "min-h-[44px] sm:min-h-0 sm:h-10 px-4 py-2 sm:py-0 text-sm gap-2 rounded-lg",
  lg: "min-h-[44px] sm:h-11 px-5 py-2.5 sm:py-0 text-sm gap-2 rounded-lg",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  icon,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`group inline-flex items-center justify-center text-center font-medium transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sm:whitespace-nowrap ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

