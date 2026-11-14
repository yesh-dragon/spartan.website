import { Link } from "react-router-dom";
import { BrandMark } from "../shared/BrandMark";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface/65 safe-pb">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark layout="icon-only" size={28} />
            <div>
              <p className="font-display text-sm font-semibold text-ink">Agent Guard</p>
              <p className="text-xs text-ink-dim">
                Zero-trust perimeter for autonomous AI agents.
              </p>
            </div>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-muted">
            <a href="/#architecture" className="py-1 hover:text-ink">
              Architecture
            </a>
            <a href="/#attack-loop" className="py-1 hover:text-ink">
              Hero Scenario
            </a>
            <a href="/#integration" className="py-1 hover:text-ink">
              @agent-guard/core
            </a>
            <Link to="/login" className="py-1 hover:text-ink">
              Console Sign In
            </Link>
          </nav>

          <p className="font-mono text-[11px] text-ink-dim">
            SHA-256 AUDIT CHAIN · VERHOEFF DATA SHIELD
          </p>
        </div>

        <div className="border-t border-hairline pt-4 text-[11px] leading-relaxed text-ink-dim flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Privacy-first notice: zero ad trackers or third-party analytics cookies. Only essential
            auth session storage and your local theme setting are retained.
          </p>
          <p>Conceptual security architecture visuals are AI-generated.</p>
        </div>
      </div>
    </footer>
  );
}

