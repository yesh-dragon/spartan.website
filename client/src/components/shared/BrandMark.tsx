import type { SVGProps } from "react";

export type BrandVariant = "primary" | "mono";
export type BrandLayout = "horizontal" | "stacked" | "icon-only";

interface BrandMarkProps {
  variant?: BrandVariant;
  layout?: BrandLayout;
  size?: number;
  className?: string;
}

/**
 * Geometric SVG symbol: chamfered shield perimeter integrated with an angular "A"
 * and central optical telemetry node. Crisp from 16px favicon to billboard scale.
 */
export function BrandSymbol({
  variant = "primary",
  size = 32,
  className = "",
  ...svgProps
}: {
  variant?: BrandVariant;
  size?: number;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  const shieldClass =
    variant === "mono" ? "stroke-current" : "ag-brand-shield stroke-accent";
  const apexClass = variant === "mono" ? "stroke-current" : "stroke-ink";
  const bridgeClass =
    variant === "mono" ? "stroke-current" : "stroke-telemetry";
  const nodeClass =
    variant === "mono" ? "ag-brand-node fill-current" : "ag-brand-node fill-telemetry";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...svgProps}
    >
      <path
        d="M16 3.5L26.25 7.75V15.1C26.25 21.45 21.85 26.45 16 28.5C10.15 26.45 5.75 21.45 5.75 15.1V7.75L16 3.5Z"
        className={shieldClass}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M11 21.75L16 9.75L21 21.75"
        className={apexClass}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.1 17.75H13.3M18.7 17.75H19.9"
        className={bridgeClass}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx="16" cy="17.75" r="2.15" className={nodeClass} />
    </svg>
  );
}

export function BrandMark({
  variant = "primary",
  layout = "horizontal",
  size = 32,
  className = "",
}: BrandMarkProps) {
  const isMono = variant === "mono";

  if (layout === "icon-only") {
    return (
      <span className={`ag-brand-mark inline-flex items-center justify-center ${className}`}>
        <BrandSymbol variant={variant} size={size} />
      </span>
    );
  }

  const containerClass =
    layout === "stacked"
      ? "ag-brand-mark inline-flex flex-col items-center gap-2 text-center"
      : "ag-brand-mark inline-flex items-center gap-2.5";

  return (
    <span className={`${containerClass} ${className}`}>
      <span
        className={`relative flex items-center justify-center rounded-lg border p-1 transition-colors duration-200 ${
          isMono
            ? "border-current/25 bg-transparent"
            : "border-accent/35 bg-accent/10 shadow-glow"
        }`}
      >
        <BrandSymbol variant={variant} size={size} />
      </span>
      <span
        className={`font-display font-bold tracking-[-0.03em] leading-none ${
          isMono ? "text-current" : "text-ink"
        } ${layout === "stacked" ? "text-lg" : "text-base sm:text-lg"}`}
      >
        Agent{" "}
        <span className={isMono ? "opacity-80" : "text-accent"}>
          Guard
        </span>
      </span>
    </span>
  );
}

