import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { Button } from "../shared/Button";
import { Card } from "../shared/Card";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured || !supabase) {
      setError(
        "Supabase credentials are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env.",
      );
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpErr) {
          setError(signUpErr.message);
        } else if (data.session) {
          navigate("/playground", { replace: true });
        } else {
          setNotice(
            "Account created! Check your email confirmation link, or sign in once confirmed.",
          );
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) {
          setError(signInErr.message);
        } else {
          navigate("/playground", { replace: true });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card beam padding="p-6 sm:p-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {isSignup ? "Provision Demo Sandbox" : "Operator Access"}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-ink">
              {isSignup ? "Create your Agent Guard workspace" : "Sign in to Agent Guard"}
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              {isSignup
                ? "Auto-seeds the 6-email attack sandbox and SHA-256 audit ledger on first login."
                : "Access your protected AI email assistant, approvals queue, and hash chain."}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-xs text-accent"
            >
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-ink-muted">
                Work or demo email
              </label>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim"
                  aria-hidden="true"
                />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@company.example"
                  className="ag-recessed-input h-10 w-full rounded-lg border border-hairline bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-dim focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-medium text-ink-muted">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim"
                  aria-hidden="true"
                />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="ag-recessed-input h-10 w-full rounded-lg border border-hairline bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-dim focus:border-accent"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              {isSignup ? "Create Account & Launch Playground" : "Sign In"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-muted">
            {isSignup ? "Already have an account?" : "Need a demo workspace?"}{" "}
            <Link
              to={isSignup ? "/login" : "/signup"}
              className="font-medium text-accent hover:underline"
            >
              {isSignup ? "Sign in" : "Create demo account"}
            </Link>
          </p>
        </Card>
    </div>
  );
}

