import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Pencil, MoreVertical, Copy, ExternalLink, Trash2, CalendarPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated/dashboard/event-types/")({
  component: EventTypesList,
});

function EventTypesList() {
  const { userId } = Route.useRouteContext();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [previewEmpty, setPreviewEmpty] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["me-username", userId],
    queryFn: async () => (await supabase.from("profiles").select("username").eq("id", userId).maybeSingle()).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["event-types", userId],
    queryFn: async () => (await supabase.from("event_types").select("*").eq("user_id", userId).order("created_at")).data,
  });

  const { data: schedules } = useQuery({
    queryKey: ["schedules", userId],
    queryFn: async () => (await supabase.from("schedules").select("id,name,is_default").eq("user_id", userId)).data,
  });

  const scheduleName = (id: string | null) => {
    if (!schedules) return "";
    const s = id ? schedules.find(x => x.id === id) : schedules.find(x => x.is_default);
    return s?.name ?? "Standard hours";
  };

  const rows = useMemo(() => {
    const list = previewEmpty ? [] : (data ?? []);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.slug.toLowerCase().includes(q) ||
      (e.description ?? "").toLowerCase().includes(q)
    );
  }, [data, query, previewEmpty]);

  const copyLink = (slug: string) => {
    if (!profile?.username) return toast.error("Set a username in Settings first");
    const url = `${window.location.origin}/${profile.username}/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event type? This cannot be undone.")) return;
    const { error } = await supabase.from("event_types").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["event-types"] });
    toast.success("Deleted");
  };

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">Event types</h1>
          <p className="mt-2 text-muted-foreground">Bookable meeting configurations you share via links.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <label className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <Switch checked={previewEmpty} onCheckedChange={setPreviewEmpty} />
            Preview empty state
          </label>
          <Button asChild size="lg" className="rounded-xl">
            <Link to="/dashboard/event-types/new">
              <Plus className="mr-2 h-4 w-4" /> New event type
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Search */}
      <div className="relative mt-10">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search event types"
          className="h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-sm"
        />
      </div>

      {/* List */}
      <div className="mt-6 space-y-4">
        {isLoading && <p className="p-8 text-sm text-muted-foreground">Loading…</p>}

        {!isLoading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <p className="mt-4 font-display text-2xl">No event types {query ? "match your search" : "yet"}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first bookable meeting template to start receiving bookings.
            </p>
            <Button asChild className="mt-6 rounded-xl">
              <Link to="/dashboard/event-types/new">
                <Plus className="mr-2 h-4 w-4" /> New event type
              </Link>
            </Button>
          </div>
        )}

        {rows.map(e => (
          <article
            key={e.id}
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: e.color ?? "var(--primary)" }}
                    aria-hidden
                  />
                  <h3 className="font-display text-xl">{e.title}</h3>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {e.duration_minutes} min
                  </span>
                  {!e.is_active && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                {e.description && (
                  <p className="mt-3 text-sm text-foreground/80">{e.description}</p>
                )}
                <p className="mt-4 font-mono text-xs text-muted-foreground">
                  syncslot.app/{profile?.username ?? "you"}/{e.slug}
                  <span className="mx-2">·</span>
                  Schedule: {scheduleName(e.schedule_id)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Link to="/dashboard/event-types/$id" params={{ id: e.id }}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label="More">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => copyLink(e.slug)}>
                      <Copy className="mr-2 h-3.5 w-3.5" /> Copy link
                    </DropdownMenuItem>
                    {profile?.username && (
                      <DropdownMenuItem asChild>
                        <a href={`/${profile.username}/${e.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-3.5 w-3.5" /> Preview
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => remove(e.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
