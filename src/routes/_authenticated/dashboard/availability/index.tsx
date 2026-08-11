import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { minutesToHHMM, hhmmToMinutes } from "@/lib/slug";
import { Plus, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated/dashboard/availability/")({
  component: AvailabilityPage,
});

type Day = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
const DAYS: Day[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABEL: Record<Day, string> = {
  SUN: "Sunday", MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday",
};

type Rule = { id?: string; day: Day; start_minute: number; end_minute: number };
type Override = { id?: string; date: string; is_blocked: boolean; start_minute: number | null; end_minute: number | null };

const FALLBACK_TZ = [
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Toronto", "America/Sao_Paulo", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "Europe/Madrid", "Europe/Istanbul", "Africa/Cairo",
  "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Bangkok",
  "Asia/Shanghai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
];

function getTimezones(): string[] {
  try {
    // @ts-ignore
    const v: string[] | undefined = Intl.supportedValuesOf?.("timeZone");
    if (v?.length) return v;
  } catch {}
  return FALLBACK_TZ;
}

function AvailabilityPage() {
  const { userId } = Route.useRouteContext();
  const [schedule, setSchedule] = useState<any>(null);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [rules, setRules] = useState<Rule[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const timezones = useMemo(getTimezones, []);

  useEffect(() => {
    (async () => {
      let { data: s } = await supabase.from("schedules").select("*").eq("user_id", userId).eq("is_default", true).maybeSingle();
      if (!s) {
        const { data: ns } = await supabase.from("schedules").insert({ user_id: userId, name: "Standard hours", is_default: true }).select().single();
        s = ns;
        const defaults = ["MON", "TUE", "WED", "THU", "FRI"].map(d => ({ schedule_id: ns!.id, day: d as Day, start_minute: 540, end_minute: 1020 }));
        await supabase.from("schedule_rules").insert(defaults);
      }
      const [{ data: r }, { data: o }] = await Promise.all([
        supabase.from("schedule_rules").select("*").eq("schedule_id", s!.id),
        supabase.from("date_overrides").select("*").eq("schedule_id", s!.id).order("date"),
      ]);
      setSchedule(s);
      setName(s!.name);
      setTimezone(s!.timezone);
      setRules((r ?? []).map(x => ({ id: x.id, day: x.day as Day, start_minute: x.start_minute, end_minute: x.end_minute })));
      setOverrides((o ?? []).map(x => ({ id: x.id, date: x.date, is_blocked: x.is_blocked, start_minute: x.start_minute, end_minute: x.end_minute })));
      setLoading(false);
    })();
  }, [userId]);

  const dayRules = (d: Day) => rules.filter(r => r.day === d);
  const setDayEnabled = (d: Day, on: boolean) => {
    if (on) setRules([...rules, { day: d, start_minute: 540, end_minute: 1020 }]);
    else setRules(rules.filter(r => r.day !== d));
  };
  const updateRule = (idx: number, patch: Partial<Rule>) =>
    setRules(rules.map((r, i) => i === idx ? { ...r, ...patch } : r));
  const addRule = (d: Day) => setRules([...rules, { day: d, start_minute: 780, end_minute: 1020 }]);
  const removeRuleAt = (idx: number) => setRules(rules.filter((_, i) => i !== idx));
  const copyToWeekdays = (idx: number) => {
    const src = rules[idx];
    if (!src) return;
    const targets: Day[] = ["MON", "TUE", "WED", "THU", "FRI"];
    const next = rules.filter(r => !targets.includes(r.day));
    for (const d of targets) next.push({ day: d, start_minute: src.start_minute, end_minute: src.end_minute });
    setRules(next);
    toast.success("Copied to weekdays");
  };

  const save = async () => {
    if (!schedule) return;
    for (const r of rules) if (r.end_minute <= r.start_minute) return toast.error("End must be after start");
    setSaving(true);
    const { error: e1 } = await supabase.from("schedules").update({ name, timezone }).eq("id", schedule.id);
    if (e1) { setSaving(false); return toast.error(e1.message); }
    await supabase.from("schedule_rules").delete().eq("schedule_id", schedule.id);
    if (rules.length) {
      const { error } = await supabase.from("schedule_rules").insert(rules.map(r => ({ schedule_id: schedule.id, day: r.day, start_minute: r.start_minute, end_minute: r.end_minute })));
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success("Changes saved");
  };

  const addOverride = async () => {
    if (!schedule) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.from("date_overrides").insert({ schedule_id: schedule.id, date: today, is_blocked: true }).select().single();
    if (error) return toast.error(error.message);
    setOverrides([...overrides, data as any].sort((a, b) => a.date.localeCompare(b.date)));
  };

  const updateOverride = async (id: string | undefined, patch: Partial<Override>) => {
    if (!id) return;
    setOverrides(overrides.map(o => o.id === id ? { ...o, ...patch } : o));
    await supabase.from("date_overrides").update(patch).eq("id", id);
  };

  const removeOverride = async (id?: string) => {
    if (!id) return;
    const { error } = await supabase.from("date_overrides").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setOverrides(overrides.filter(o => o.id !== id));
  };

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  // Preview: sorted MON-first
  const previewOrder: Day[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">Availability</h1>
          <p className="mt-2 text-muted-foreground">Set your weekly hours and one-off exceptions.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button size="lg" className="rounded-xl" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Schedule info */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-display text-base">Schedule name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-display text-base">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {timezones.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Weekly hours */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-xl">Weekly hours</h2>
            <div className="mt-4 divide-y divide-border">
              {DAYS.map(d => {
                const drs = dayRules(d);
                const enabled = drs.length > 0;
                return (
                  <div key={d} className="py-4 first:pt-0 last:pb-0">
                    {!enabled ? (
                      <div className="flex items-center gap-4">
                        <Switch checked={false} onCheckedChange={v => setDayEnabled(d, v)} />
                        <span className="w-24 font-medium">{DAY_LABEL[d]}</span>
                        <span className="text-sm text-muted-foreground">Unavailable</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rules.map((r, idx) => r.day === d && (
                          <div key={idx} className="flex flex-wrap items-center gap-2">
                            {idx === rules.findIndex(x => x.day === d) ? (
                              <>
                                <Switch checked={true} onCheckedChange={v => setDayEnabled(d, v)} />
                                <span className="w-24 font-medium">{DAY_LABEL[d]}</span>
                              </>
                            ) : (
                              <span className="w-[calc(2.75rem+6rem+0.5rem)]" />
                            )}
                            <Input
                              type="time"
                              value={minutesToHHMM(r.start_minute)}
                              onChange={e => updateRule(idx, { start_minute: hhmmToMinutes(e.target.value) })}
                              className="w-32 rounded-lg"
                            />
                            <span className="text-muted-foreground">–</span>
                            <Input
                              type="time"
                              value={minutesToHHMM(r.end_minute)}
                              onChange={e => updateRule(idx, { end_minute: hhmmToMinutes(e.target.value) })}
                              className="w-32 rounded-lg"
                            />
                            <Button size="icon" variant="ghost" onClick={() => removeRuleAt(idx)} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => addRule(d)} aria-label="Add interval"><Plus className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => copyToWeekdays(idx)} aria-label="Copy to weekdays"><Copy className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date overrides */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl">Date overrides</h2>
                <p className="text-sm text-muted-foreground">Days that differ from your weekly hours.</p>
              </div>
              <Button variant="ghost" onClick={addOverride}>
                <Plus className="mr-2 h-4 w-4" /> Add override
              </Button>
            </div>

            <div className="mt-5 space-y-2">
              {overrides.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overrides yet.</p>
              ) : overrides.map(o => (
                <div key={o.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <Input
                    type="date"
                    value={o.date}
                    onChange={e => updateOverride(o.id, { date: e.target.value })}
                    className="w-44 rounded-lg"
                  />
                  <label className="flex items-center gap-2 pl-2 pr-3 text-sm">
                    <Switch
                      checked={o.is_blocked}
                      onCheckedChange={v => updateOverride(o.id, { is_blocked: v, start_minute: v ? null : 540, end_minute: v ? null : 1020 })}
                    />
                    Closed
                  </label>
                  {!o.is_blocked && (
                    <>
                      <Input
                        type="time"
                        value={minutesToHHMM(o.start_minute ?? 540)}
                        onChange={e => updateOverride(o.id, { start_minute: hhmmToMinutes(e.target.value) })}
                        className="w-32 rounded-lg"
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="time"
                        value={minutesToHHMM(o.end_minute ?? 1020)}
                        onChange={e => updateOverride(o.id, { end_minute: hhmmToMinutes(e.target.value) })}
                        className="w-32 rounded-lg"
                      />
                    </>
                  )}
                  <div className="ml-auto">
                    <Button size="icon" variant="ghost" onClick={() => removeOverride(o.id)} aria-label="Remove override">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-lg">About schedules</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Any event type can be assigned to a schedule. Changes here affect every event type that uses this schedule.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-lg">Preview this week</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {previewOrder.map(d => {
                const drs = dayRules(d);
                return (
                  <li key={d} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{DAY_LABEL[d]}</span>
                    <span className="font-mono text-xs">
                      {drs.length === 0
                        ? "—"
                        : drs.map(r => `${minutesToHHMM(r.start_minute)}–${minutesToHHMM(r.end_minute)}`).join(", ")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {overrides.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg">Upcoming exceptions</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {overrides.slice(0, 5).map(o => (
                  <li key={o.id} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{format(new Date(o.date + "T12:00:00"), "MMM d")}</span>
                    <span className="text-xs">
                      {o.is_blocked ? "Closed" : `${minutesToHHMM(o.start_minute ?? 0)}–${minutesToHHMM(o.end_minute ?? 0)}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
