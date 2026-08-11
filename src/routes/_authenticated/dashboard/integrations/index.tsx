import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { connectAppUser } from "@/integrations/lovable/appUserConnectorClient";
import {
  startGoogleCalendarConnect,
  saveGoogleCalendarConnection,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
} from "@/lib/googleCalendar.functions";
import { CalendarDays, Video, Webhook, Copy, Plus, Check } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated/dashboard/integrations/")({
  component: IntegrationsPage,
});

type Status = "connected" | "disconnected" | "soon";

function StatusDot({ status }: { status: Status }) {
  const color =
    status === "connected" ? "bg-primary" : status === "soon" ? "bg-muted-foreground/30" : "bg-muted-foreground/40";
  return <span className={`h-2.5 w-2.5 rounded-full ${color}`} />;
}

function IntegrationCard({
  title,
  description,
  status,
  primary,
  onConnect,
  onDisconnect,
}: {
  title: string;
  description: string;
  status: Status;
  primary?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl">{title}</h3>
        <StatusDot status={status} />
      </div>
      {primary && status === "connected" && (
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
          <Check className="h-3 w-3" /> Primary
        </span>
      )}
      <p className="mt-3 flex-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">
        {status === "connected" ? (
          <Button variant="outline" className="w-full" onClick={onDisconnect}>Disconnect</Button>
        ) : status === "soon" ? (
          <Button className="w-full" disabled>Coming soon</Button>
        ) : (
          <Button className="w-full" onClick={onConnect}>Connect</Button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ Icon, label, hint }: { Icon: any; label: string; hint: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="font-display text-lg">{label}</span>
      <span className="text-muted-foreground">— {hint}</span>
    </div>
  );
}

function IntegrationsPage() {
  const { userId } = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: gcal } = useQuery({
    queryKey: ["gcal-status"],
    queryFn: () => getGoogleCalendarStatus(),
  });

  const [hooks, setHooks] = useState<string[]>([]);
  const [newHook, setNewHook] = useState("");
  const storageKey = `syncslot:webhooks:${userId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setHooks(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const saveHooks = (list: string[]) => {
    setHooks(list);
    localStorage.setItem(storageKey, JSON.stringify(list));
  };

  const addHook = () => {
    const v = newHook.trim();
    if (!v) return;
    try { new URL(v); } catch { return toast.error("Enter a valid URL"); }
    saveHooks([...hooks, v]);
    setNewHook("");
    toast.success("Webhook added");
  };

  const connectGCal = async () => {
    const result = await connectAppUser({
      connectorId: "google_calendar",
      gatewayBaseUrl: "https://connector-gateway.lovable.dev",
      start: (targetOrigin) => startGoogleCalendarConnect({ data: targetOrigin }),
    });
    if (!result.success) return toast.error(result.error ?? "Failed to connect");
    if (!result.connectionAPIKey) return toast.error("Offline access not allowed");
    await saveGoogleCalendarConnection({ data: { connectionAPIKey: result.connectionAPIKey } });
    toast.success("Google Calendar connected");
    qc.invalidateQueries({ queryKey: ["gcal-status"] });
  };

  const disconnectGCal = async () => {
    await disconnectGoogleCalendar();
    toast.success("Google Calendar disconnected");
    qc.invalidateQueries({ queryKey: ["gcal-status"] });
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-4xl md:text-5xl">Integrations</h1>
          <p className="mt-2 text-muted-foreground">Connect calendars, video tools, and outgoing webhooks.</p>
        </div>
        <ThemeToggle />
      </header>

      <div className="mt-8 h-px bg-border" />

      <section className="mt-8">
        <SectionHeader Icon={CalendarDays} label="Calendars" hint="Check for conflicts and create events." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <IntegrationCard
            title="Google Calendar"
            description="Two-way sync for busy times and event creation."
            status={gcal?.connected ? "connected" : "disconnected"}
            primary
            onConnect={connectGCal}
            onDisconnect={disconnectGCal}
          />
          <IntegrationCard title="Apple iCloud" description="Check for conflicts on your iCloud calendar." status="soon" />
          <IntegrationCard title="CalDAV" description="Connect any CalDAV-compatible calendar service." status="soon" />
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader Icon={Video} label="Video conferencing" hint="Auto-generate meeting links." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <IntegrationCard
            title="Google Meet"
            description="Auto-generate Meet links for confirmed bookings."
            status={gcal?.connected ? "connected" : "disconnected"}
            primary
            onConnect={connectGCal}
            onDisconnect={disconnectGCal}
          />
          <IntegrationCard title="Zoom" description="Create unique Zoom links for each booking." status="soon" />
          <IntegrationCard title="Jitsi Meet" description="Free open-source video meetings for every booking." status="soon" />
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader Icon={Webhook} label="Webhooks" hint="Send booking events to your own endpoints." />
        <div className="space-y-3">
          {hooks.map((h, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4">
              <span className="truncate font-mono text-sm">{h}</span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(h); toast.success("Copied"); }}
                  className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Copy"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => saveHooks(hooks.filter((_, j) => j !== i))}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-2 py-2">
            <Input
              value={newHook}
              onChange={e => setNewHook(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addHook(); }}
              placeholder="https://your-app.com/webhooks/syncslot"
              className="h-10 border-0 bg-transparent focus-visible:ring-0"
            />
            <Button onClick={addHook} className="shrink-0"><Plus className="mr-1.5 h-4 w-4" /> Add</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
