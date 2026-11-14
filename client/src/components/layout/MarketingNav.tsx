import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { BrandMark } from "../shared/BrandMark";
import { Button } from "../shared/Button";
import { InteractiveIconButton, ThemeToggle } from "../shared/InteractiveIconButton";

export function BrandLogo({ layout = "horizontal" }: { layout?: "horizontal" | "stacked" | "icon-only" }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2 rounded-md focus-visible:outline-none">
      <BrandMark layout={layout} size={28} />
      {layout === "horizontal" && (
        <span className="hidden rounded border border-hairline bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-accent sm:inline-block">
          v1.0
        </span>
      )}
    </Link>
  );
}

export function MarketingNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        <nav aria-label="Primary navigation" className="hidden items-center gap-7 md:flex">
          <a
            href="/#architecture"
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Architecture
          </a>
          <a
            href="/#attack-loop"
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Live Telemetry
          </a>
          <a
            href="/#integration"
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            SDK
          </a>
          {user && (
            <NavLink
              to="/playground"
              className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
            >
              Console
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle compact />
          {user ? (
            <Link to="/playground">
              <Button variant="primary" size="sm">
                Open Playground
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Try the demo
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <InteractiveIconButton
            tone="telemetry"
            active={open}
            label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-marketing-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </InteractiveIconButton>
        </div>
      </div>

      {open && (
        <div id="mobile-marketing-nav" className="border-t border-hairline bg-surface px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a
              href="/#architecture"
              onClick={() => setOpen(false)}
              className="min-h-[44px] flex items-center text-sm text-ink-muted hover:text-ink"
            >
              Architecture
            </a>
            <a
              href="/#attack-loop"
              onClick={() => setOpen(false)}
              className="min-h-[44px] flex items-center text-sm text-ink-muted hover:text-ink"
            >
              Live Telemetry
            </a>
            <a
              href="/#integration"
              onClick={() => setOpen(false)}
              className="min-h-[44px] flex items-center text-sm text-ink-muted hover:text-ink"
            >
              SDK
            </a>
            <div className="flex flex-col gap-2 border-t border-hairline pt-3 sm:flex-row sm:items-center">
              {user ? (
                <Link to="/playground" className="w-full" onClick={() => setOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Open Playground
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="primary" className="w-full">
                      Try the demo
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

