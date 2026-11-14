import { Navigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AuthForm } from "../components/auth/AuthForm";
import { MarketingNav } from "../components/layout/MarketingNav";
import { Footer } from "../components/layout/Footer";

export function Signup() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-canvas text-ink">
      <div className="pointer-events-none fixed inset-0 bg-soc-grid opacity-55" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 bg-noise-overlay" aria-hidden="true" />
      <MarketingNav />
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-8 lg:grid-cols-12">
          <div className="relative hidden overflow-hidden rounded-2xl border border-hairline bg-slate-950 shadow-panel lg:col-span-6 lg:block">
            <img
              src="/assets/data-shield-vault.jpg"
              alt="Data Shield inspection prism protecting credentials before outbound egress"
              width={1376}
              height={768}
              loading="eager"
              decoding="async"
              className="h-[460px] w-full object-cover opacity-90"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-slate-950/85 px-3 py-1 font-mono text-[11px] text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                6 Attack Scenarios Auto-Seeded
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-slate-50">
                Launch your private threat playground
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                First sign-in automatically provisions 6 synthetic emails including hidden HTML
                injections, zero-width payloads, and Aadhaar/API key traps.
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:col-span-6">
            <AuthForm mode="signup" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
