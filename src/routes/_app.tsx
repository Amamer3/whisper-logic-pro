import { createFileRoute, Outlet, Link, useRouter, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import {
  Mic, LayoutDashboard, History, Sparkles, Settings, CreditCard,
  LogOut, Menu, X, BookTemplate
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/record", label: "New Recording", icon: Mic },
  { to: "/studio", label: "AI Studio", icon: Sparkles },
  { to: "/templates", label: "Templates", icon: BookTemplate },
  { to: "/history", label: "History", icon: History },
  { to: "/pricing", label: "Plans", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <SidebarContent onSignOut={() => signOut().then(() => router.navigate({ to: "/" }))} userEmail={user.email ?? ""} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
            <SidebarContent onSignOut={() => signOut().then(() => router.navigate({ to: "/" }))} userEmail={user.email ?? ""} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-border px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-hero text-primary-foreground">
              <Mic className="h-3.5 w-3.5" />
            </span>
            VoiceFlow
          </Link>
        </header>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ onSignOut, userEmail }: { onSignOut: () => void; userEmail: string }) {
  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5 font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-elevated">
          <Mic className="h-4 w-4" />
        </span>
        <span>VoiceFlow</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{userEmail}</div>
            <div className="text-[10px] text-muted-foreground">Free plan</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onSignOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
