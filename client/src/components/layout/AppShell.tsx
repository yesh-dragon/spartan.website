import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Button } from "../shared/Button";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, signOut, bootstrapError, retryBootstrap } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    staleTime: 60_000,
    retry: 1,
  });

  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: api.stats,
    refetchInterval: 30_000,
  });

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
    staleTime: 30_000,
  });

  return (
    <div className="relative flex min-h-dvh bg-canvas text-ink">
      <div className="pointer-events-none fixed inset-0 bg-soc-grid opacity-55" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 bg-noise-overlay" aria-hidden="true" />

      <Sidebar
        pendingCount={statsQuery.data?.stats.pendingApprovals ?? 0}
        unackAlertsCount={statsQuery.data?.stats.unacknowledgedAlerts ?? 0}
        userEmail={user?.email}
        onSignOut={signOut}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          mode={settingsQuery.data?.settings.mode}
          demoMode={healthQuery.data?.demoMode}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        {bootstrapError && (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning sm:mx-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Workspace bootstrap warning: {bootstrapError}</span>
            </div>
            <Button
              size="sm"
              variant="warning"
              onClick={retryBootstrap}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Retry Setup
            </Button>
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

