import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { MarketingNav } from "../components/layout/MarketingNav";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/shared/Button";

export function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-canvas text-ink">
      <div className="pointer-events-none fixed inset-0 bg-soc-grid opacity-55" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 bg-noise-overlay" aria-hidden="true" />
      <MarketingNav />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-danger/45 bg-danger/10 text-danger shadow-glow-danger">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-danger">
          404 · Boundary Route Not Found
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
          Nothing to inspect at this coordinate
        </h1>
        <p className="mt-3 max-w-md text-sm text-ink-muted">
          The page you requested does not exist or has moved. Return to the Agent Guard perimeter
          overview or landing page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/">
            <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>
              Back to Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="primary">Open Console</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

