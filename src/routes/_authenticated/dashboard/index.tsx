import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { format, startOfWeek, addDays, endOfWeek, isSameDay } from "date-fns";
import { CalendarPlus, Clock, ExternalLink, Plus, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

import meetingsImg from "@/assets/dashboard-meetings.jpg";
import availabilityImg from "@/assets/dashboard-availability.jpg";
import integrationsImg from "@/assets/dashboard-integrations.jpg";
import analyticsImg from "@/assets/dashboard-analytics.jpg";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardHome() {
  const { userId } = Route.useRouteContext();
  const [previewEmpty, setPreviewEmpty] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["me", userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()).data,
  });
  const { data: bookings } = useQuery({
    queryKey: ["bookings-upcoming", userId],
    queryFn: async () =>
      (await supabase
        .from("bookings")
        .select("*, event_types(title)")
        .eq("host_user_id", userId)
        .eq("status", "CONFIRMED")
        .gte("start_at", new Date().toISOString())
        .order("start_at")
        .limit(20)).data,
  });
  const { data: eventTypes } = useQuery({
    queryKey: ["event-types", userId],
    queryFn: async () => (await supabase.from("event_types").select("*").eq("user_id", userId).order("created_at")).data,
  });
  const { data: calendars } = useQuery({
    queryKey: ["calendar-accounts", userId],
    queryFn: async () => (await supabase.from("calendar_accounts").select("id").eq("user_id", userId)).data,
  });

  const firstName = profile?.name?.split(" ")[0] ?? "there";
  const publicUrl = profile?.username ? `${window.location.origin}/${profile.username}` : "";

  const activeCount = eventTypes?.filter(e => e.is_active).length ?? 0;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeek = bookings?.filter(b => {
    const d = new Date(b.start_at);
    return d >= weekStart && d <= weekEnd;
  }) ?? [];

  const byDay = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      return { day, count: thisWeek.filter(b => isSameDay(new Date(b.start_at), day)).length };
    });
  }, [thisWeek, weekStart]);
  const maxCount = Math.max(1, ...byDay.map(d => d.count));

  const isEmpty = previewEmpty || !eventTypes || eventTypes.length === 0;

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-4xl md:text-5xl">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-2 text-muted-foreground">Here's what's on your calendar.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <label className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <Switch checked={previewEmpty} onCheckedChange={setPreviewEmpty} />
            Preview empty state
          </label>
          <Button asChild size="lg">
            <Link to="/dashboard/event-types/new">
              <Plus className="mr-1.5 h-4 w-4" /> New event type
            </Link>
          </Button>
          <ThemeToggle />
          <UserMenu />
        </div>

      </header>

      {isEmpty ? (
        <EmptyState publicPath={profile?.username ? `syncslot.app/${profile.username}` : "syncslot.app/you"} />
      ) : (
        <>
          {/* Stat cards with imagery */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard image={meetingsImg} label="Upcoming meetings" value={bookings?.length ?? 0} />
            <StatCard image={availabilityImg} label="Bookings this week" value={thisWeek.length} />
            <StatCard image={analyticsImg} label="Active event types" value={activeCount} />
            <StatCard image={integrationsImg} label="Connected calendars" value={calendars?.length ?? 0} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {/* Upcoming meetings */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-5">
                <h2 className="font-display text-xl">Upcoming meetings</h2>
                <Link to="/dashboard/bookings" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                  View all
                </Link>
              </div>
              <CardContent className="p-0">
                {bookings && bookings.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {bookings.slice(0, 5).map(b => {
                      const d = new Date(b.start_at);
                      return (
                        <li key={b.id} className="flex items-center gap-5 px-5 py-4">
                          <div className="w-12 shrink-0 text-center">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              {format(d, "MMM")}
                            </p>
                            <p className="font-display text-2xl leading-tight">{format(d, "d")}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{(b as any).event_types?.title ?? "Meeting"}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              with {b.invitee_name} · {format(d, "p")}
                            </p>
                          </div>
                          <Link
                            to="/dashboard/bookings"
                            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
                          >
                            Details
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="p-6 text-sm text-muted-foreground">No upcoming bookings yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Right column */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-display text-lg">Quick actions</h3>
                  <div className="mt-4 space-y-2">
                    <QuickAction to="/dashboard/event-types/new" icon={<CalendarPlus className="h-4 w-4" />}>
                      Create event type
                    </QuickAction>
                    <QuickAction to="/dashboard/availability" icon={<Clock className="h-4 w-4" />}>
                      Edit availability
                    </QuickAction>
                    {publicUrl && (
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-secondary/50"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open my booking page
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="font-display text-lg">This week</h3>
                  <p className="text-sm text-muted-foreground">Bookings by day</p>
                  <div className="mt-6 flex h-32 items-end justify-between gap-2">
                    {byDay.map((d, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t bg-primary/70"
                          style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count ? 8 : 4 }}
                        />
                        <span className="text-[10px] text-muted-foreground">{format(d.day, "EEEEE")}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ image, label, value }: { image: string; label: string; value: number }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-20 w-full overflow-hidden">
        <img src={image} alt="" width={1024} height={640} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <CardContent className="p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="mt-2 font-display text-4xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function QuickAction({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-secondary/50"
    >
      {icon}
      {children}
    </Link>
  );
}

type Step = { n: number; title: string; body: string; cta: string; to: string };

function EmptyState({ publicPath }: { publicPath: string }) {
  const steps: Step[] = [
    { n: 1, title: "Create your first event type", body: "A 30-minute meeting works well to start.", cta: "Start", to: "/dashboard/event-types/new" },
    { n: 2, title: "Set your availability", body: "Pick the weekly hours you're happy to be booked.", cta: "Open", to: "/dashboard/availability" },
    { n: 3, title: "Share your link", body: `Send ${publicPath} to someone.`, cta: "Copy link", to: "/dashboard/settings" },
  ];

  return (
    <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm md:p-14">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-6 font-display text-4xl md:text-5xl">Let's get your first booking.</h2>
        <p className="mt-3 text-muted-foreground">Three small steps and your booking page is live.</p>
      </div>

      <ul className="mx-auto mt-10 max-w-3xl space-y-4">
        {steps.map(s => (
          <li
            key={s.n}
            className="flex items-center gap-5 rounded-2xl border border-border bg-background/60 p-5 transition-colors hover:border-primary/40"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-medium text-foreground">
              {s.n}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 text-primary hover:text-primary">
              <Link to={s.to}>{s.cta}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
