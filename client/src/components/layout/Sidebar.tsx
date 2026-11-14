import { NavLink } from "react-router-dom";
import {
  Activity,
  Bell,
  CheckSquare,
  FileLock2,
  LayoutDashboard,
  LogOut,
  Settings,
  Terminal,
  X,
} from "lucide-react";
import { InteractiveIconButton } from "../shared/InteractiveIconButton";
import { BrandLogo } from "./MarketingNav";

interface SidebarProps {
  pendingCount: number;
  unackAlertsCount: number;
  userEmail?: string;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  pendingCount,
  unackAlertsCount,
  userEmail,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/playground", label: "Agent Playground", icon: Terminal },
    {
      to: "/approvals",
      label: "Action Firewall",
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeTone: "warning" as const,
    },
    {
      to: "/alerts",
      label: "Security Alerts",
      icon: Bell,
      badge: unackAlertsCount > 0 ? unackAlertsCount : undefined,
      badgeTone: "danger" as const,
    },
    { to: "/audit-log", label: "Audit Chain", icon: FileLock2 },
    { to: "/settings", label: "Guard Policy", icon: Settings },
  ];

  const content = (
    <div className="flex h-full flex-col border-r border-hairline bg-surface">
      <div className="flex h-16 items-center justify-between border-b border-hairline px-5">
        <BrandLogo />
        <InteractiveIconButton
          tone="danger"
          onClick={onCloseMobile}
          label="Close sidebar"
          className="lg:hidden"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </InteractiveIconButton>
      </div>

      <div className="px-3 pt-4">
        <div className="flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/5 px-3 py-2">
          <Activity className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
            Perimeter Active
          </span>
        </div>
      </div>

      <nav aria-label="Console navigation" className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-accent/30 bg-accent/10 text-accent"
                    : "border border-transparent text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`
              }
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </span>
              {item.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                    item.badgeTone === "danger"
                      ? "bg-danger/20 text-danger"
                      : "bg-warning/20 text-warning"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-hairline p-3">
        <div className="rounded-lg border border-hairline bg-surface-2 px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
            Operator Session
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-ink">
            {userEmail ?? "Authenticated User"}
          </p>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-2.5 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-md border border-hairline bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger sm:min-h-[34px]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-canvas/80 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[85vw]">{content}</aside>
        </div>
      )}
    </>
  );
}

