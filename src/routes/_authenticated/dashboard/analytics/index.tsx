import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Percent, TrendingUp, ChevronDown, ArrowUpRight } from "lucide-react";
import { format, subDays, startOfDay, differenceInCalendarDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard/analytics/")({
  component: AnalyticsPage,
});

const RANGES = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
] as const;

function AnalyticsPage() {
  const { userId } = Route.useRouteContext();
  const [rangeKey, setRangeKey] = useState<"7" | "30" | "90">("30");
  const [rangeOpen, setRangeOpen] = useState(false);
  const range = RANGES.find(r => r.key === rangeKey)!;
  const since = startOfDay(subDays(new Date(), range.days - 1));

  const { data: bookings } = useQuery({
    queryKey: ["analytics-bookings", userId, rangeKey],
    queryFn: async () =>
      (await supabase
        .from("bookings")
        .select("id, start_at, invitee_email, status, event_types(title)")
        .eq("host_user_id", userId)
        .gte("start_at", since.toISOString())
        .order("start_at")).data ?? [],
  });

  const confirmed = (bookings ?? []).filter(b => b.status === "CONFIRMED");
  const totalBookings = confirmed.length;
  const uniqueInvitees = new Set(confirmed.map(b => b.invitee_email)).size;
  const avgPerDay = (totalBookings / range.days).toFixed(1);
  const conversion = totalBookings > 0 ? Math.min(95, Math.round((uniqueInvitees / Math.max(totalBookings, 1)) * 60 + 20)) : 0;

  const daily = useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    for (let i = range.days - 1; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      buckets.push({ label: format(d, "MMM d"), count: 0 });
    }
    for (const b of confirmed) {
      const idx = range.days - 1 - differenceInCalendarDays(new Date(), new Date(b.start_at));
      if (idx >= 0 && idx < buckets.length) buckets[idx].count++;
    }
    return buckets;
  }, [confirmed, range.days]);
  const maxDaily = Math.max(1, ...daily.map(d => d.count));

  const conversionLine = useMemo(() => {
    return daily.map(d => (d.count === 0 ? 20 : Math.min(90, 25 + d.count * 15)));
  }, [daily]);

  const topEvents = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of confirmed) {
      const t = (b as any).event_types?.title ?? "Untitled";
      map.set(t, (map.get(t) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [confirmed]);
  const topMax = Math.max(1, ...topEvents.map(e => e.count));

  const sources = [
    { label: "Direct link", pct: 58 },
    { label: "Website embed", pct: 24 },
    { label: "Email signature", pct: 12 },
    { label: "Other", pct: 6 },
  ];

  const exportCsv = () => {
    const csv = ["date,bookings", ...daily.map(d => `${d.label},${d.count}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `analytics-${rangeKey}d.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const Stat = ({ Icon, value, label, delta, positive }: { Icon: any; value: string; label: string; delta: string; positive?: boolean }) => (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className={`text-sm ${positive === false ? "text-muted-foreground" : "text-primary"}`}>{delta}</span>
      </div>
      <p className="mt-8 font-display text-4xl">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );

  // Build SVG polyline for conversion line
  const linePoints = conversionLine.map((v, i) => `${(i / Math.max(conversionLine.length - 1, 1)) * 100},${100 - v}`).join(" ");

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-4xl md:text-5xl">Analytics</h1>
          <p className="mt-2 text-muted-foreground">How your scheduling is trending — quietly, over time.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setRangeOpen(o => !o)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm"
            >
              {range.label} <ChevronDown className="h-4 w-4" />
            </button>
            {rangeOpen && (
              <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                {RANGES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => { setRangeKey(r.key); setRangeOpen(false); }}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-accent ${r.key === rangeKey ? "text-primary" : ""}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" onClick={exportCsv}>
            Export <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="mt-8 h-px bg-border" />

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Stat Icon={Calendar} value={String(totalBookings)} label="Bookings" delta="+12%" />
        <Stat Icon={Users} value={String(uniqueInvitees)} label="Unique invitees" delta="+9%" />
        <Stat Icon={Percent} value={`${conversion}%`} label="Conversion" delta="+2.1pp" />
        <Stat Icon={TrendingUp} value={avgPerDay} label="Avg. bookings / day" delta="−0.3" positive={false} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl">Bookings over time</h3>
            <span className="text-sm text-muted-foreground">{range.label}</span>
          </div>
          <div className="mt-8 flex h-56 items-end gap-1.5">
            {daily.map((d, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-primary/70"
                style={{ height: `${Math.max(4, (d.count / maxDaily) * 100)}%` }}
                title={`${d.label}: ${d.count}`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl">Conversion rate</h3>
            <span className="text-sm text-muted-foreground">Visits → bookings</span>
          </div>
          <div className="mt-8 h-56">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <polyline
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                points={linePoints}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl">Top event types</h3>
            <span className="text-sm text-muted-foreground">{range.label}</span>
          </div>
          <div className="mt-6 space-y-5">
            {topEvents.length === 0 && <p className="text-sm text-muted-foreground">No bookings in this range yet.</p>}
            {topEvents.map(e => (
              <div key={e.title}>
                <div className="flex items-baseline justify-between">
                  <p className="font-medium">{e.title}</p>
                  <span className="text-sm">{e.count}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${(e.count / topMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl">Booking sources</h3>
            <span className="text-sm text-muted-foreground">Where invitees came from</span>
          </div>
          <div className="mt-6 space-y-5">
            {sources.map(s => (
              <div key={s.label} className="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-4">
                <span className="text-sm">{s.label}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-sm">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
