import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { CalendarClock, Clock3, Home, LogOut, Settings, Link2, Plug, BarChart3 } from "lucide-react";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { userId: data.user.id };
  },
  component: AuthedLayout,
});

const nav = [
  { to: "/dashboard", label: "Overview", Icon: Home },
  { to: "/dashboard/event-types", label: "Event Types", Icon: CalendarClock },
  { to: "/dashboard/availability", label: "Availability", Icon: Clock3 },
  { to: "/dashboard/bookings", label: "Bookings", Icon: Link2 },
  { to: "/dashboard/integrations", label: "Integrations", Icon: Plug },
  { to: "/dashboard/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", Icon: Settings },
] as const;

function AuthedLayout() {
  const { userId } = Route.useRouteContext();
  const router = useRouter();

  const { data: profile } = useQuery({
    queryKey: ["me", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      return data;
    },
  });

  // Redirect to onboarding if incomplete
  if (profile && (!profile.onboarded || !profile.username)) {
    if (typeof window !== "undefined" && window.location.pathname !== "/onboarding") {
      router.navigate({ to: "/onboarding" });
    }
  }

  const signOut = async () => { await supabase.auth.signOut(); router.navigate({ to: "/" }); };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Logo to="" />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ to, label, Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/dashboard" }}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          {profile?.username && (
            <a href={`/${profile.username}`} target="_blank" rel="noreferrer" className="mb-2 block truncate rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
              syncslot.app/<b className="text-foreground">{profile.username}</b>
            </a>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
