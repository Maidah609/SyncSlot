import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated/dashboard/bookings/")({
  component: BookingsPage,
});

type Tab = "upcoming" | "past" | "cancelled";

function BookingsPage() {
  const { userId } = Route.useRouteContext();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [q, setQ] = useState("");

  const { data: all } = useQuery({
    queryKey: ["bookings-all", userId],
    queryFn: async () =>
      (await supabase
        .from("bookings")
        .select("*, event_types(title, duration_minutes)")
        .eq("host_user_id", userId)
        .order("start_at", { ascending: false })).data ?? [],
  });

  const now = new Date();
  const groups = useMemo(() => {
    const rows = all ?? [];
    const upcoming = rows.filter(b => b.status === "CONFIRMED" && new Date(b.start_at) >= now).sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at));
    const past = rows.filter(b => b.status === "CONFIRMED" && new Date(b.start_at) < now);
    const cancelled = rows.filter(b => b.status === "CANCELLED");
    return { upcoming, past, cancelled };
  }, [all]);

  const current = groups[tab];
  const filtered = current.filter(b => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (b.invitee_name?.toLowerCase().includes(s) || b.invitee_email?.toLowerCase().includes(s) || b.event_types?.title?.toLowerCase().includes(s));
  });

  const cancel = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    const { error } = await supabase.from("bookings").update({ status: "CANCELLED" }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["bookings-all"] });
    toast.success("Cancelled");
  };

  const exportCsv = () => {
    const rows = filtered;
    const headers = ["Date", "Time", "Event", "Duration", "Invitee", "Email", "Timezone", "Status"];
    const csv = [headers.join(",")].concat(
      rows.map(b => [
        format(new Date(b.start_at), "yyyy-MM-dd"),
        format(new Date(b.start_at), "HH:mm"),
        b.event_types?.title ?? "",
        `${b.event_types?.duration_minutes ?? ""}m`,
        b.invitee_name ?? "",
        b.invitee_email ?? "",
        b.invitee_timezone ?? "",
        b.status,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bookings-${tab}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const TabBtn = ({ id, label, count }: { id: Tab; label: string; count: number }) => (
    <button
      onClick={() => setTab(id)}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
        tab === id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs ${tab === id ? "bg-background text-foreground" : "bg-muted text-muted-foreground"}`}>{count}</span>
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-4xl md:text-5xl">Bookings</h1>
          <p className="mt-2 text-muted-foreground">Every meeting, past and future.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="mt-8 h-px bg-border" />

      <div className="mt-6 grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-wrap items-center gap-2">
          <TabBtn id="upcoming" label="Upcoming" count={groups.upcoming.length} />
          <TabBtn id="past" label="Past" count={groups.past.length} />
          <TabBtn id="cancelled" label="Cancelled" count={groups.cancelled.length} />
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search invitee or type" className="h-11 rounded-2xl pl-10" />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No bookings.</div>
        )}
        {filtered.map((b, i) => {
          const d = new Date(b.start_at);
          return (
            <div key={b.id} className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 px-6 py-5 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="w-14 text-center">
                <div className="font-display text-xs uppercase tracking-wider text-muted-foreground">{format(d, "MMM")}</div>
                <div className="font-display text-2xl leading-none">{format(d, "d")}</div>
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{b.event_types?.title ?? "Meeting"}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {b.invitee_name} · {format(d, "h:mm a")} · {b.event_types?.duration_minutes}m · {b.invitee_timezone ?? "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {tab === "upcoming" && (
                  <button onClick={() => cancel(b.id)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                )}
                <button className="text-sm font-medium text-foreground hover:underline">Details</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
