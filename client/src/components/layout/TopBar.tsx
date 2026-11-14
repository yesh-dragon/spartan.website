import { Menu, Shield } from "lucide-react";
import { Badge } from "../shared/Badge";
import { InteractiveIconButton, ThemeToggle } from "../shared/InteractiveIconButton";

export function TopBar({
  title,
  mode,
  demoMode,
  onOpenMobileMenu,
}: {
  title: string;
  mode?: "monitor" | "enforce";
  demoMode?: boolean;
  onOpenMobileMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-2 border-b border-hairline bg-canvas/85 px-4 py-2 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <InteractiveIconButton
          tone="telemetry"
          onClick={onOpenMobileMenu}
          label="Open sidebar navigation"
          className="lg:hidden"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </InteractiveIconButton>
        <h1 className="truncate font-display text-base font-semibold text-ink sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {demoMode && (
          <Badge tone="telemetry" className="hidden sm:inline-flex">
            DEMO MODE
          </Badge>
        )}
        {mode && (
          <Badge tone={mode === "enforce" ? "accent" : "warning"}>
            <Shield className="h-3 w-3" aria-hidden="true" />
            <span className="hidden xs:inline sm:inline">
              {mode === "enforce" ? "Enforce Mode" : "Monitor Mode"}
            </span>
          </Badge>
        )}
        <ThemeToggle compact />
      </div>
    </header>
  );
}

