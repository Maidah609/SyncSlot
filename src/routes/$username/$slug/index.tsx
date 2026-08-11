import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Clock, Globe2 } from "lucide-react";
import { computeSlots, ymdInZone, type WeeklyRule, type Override } from "@/lib/availability";
import { toast } from "sonner";
import { getHostBusyTimes, createBookingEvent } from "@/lib/googleCalendar.functions";

const PROFILE_COLS = "id,name,username,timezone,avatar_url,brand_color,welcome_message,plan,onboarded,created_at,updated_at";

export const Route = createFileRoute("/$username/$slug/")({
  loader: async ({ params }) => {
    const { data: profile } = await supabase.from("profiles").select(PROFILE_COLS).eq("username", params.username).maybeSingle();
    if (!profile) throw notFound();
    const { data: event } = await supabase.from("event_types").select("*").eq("user_id", profile.id).eq("slug", params.slug).eq("is_active", true).maybeSingle();
    if (!event) throw notFound();
    const { data: questions } = await supabase.from("booking_questions").select("*").eq("event_type_id", event.id).order("position");
    return { profile, event, questions: questions ?? [] };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.event.title} — ${loaderData.profile.name || loaderData.profile.username}` },
      { name: "description", content: loaderData.event.description || `Book a ${loaderData.event.duration_minutes}-minute meeting.` },
      { property: "og:title", content: `${loaderData.event.title} with ${loaderData.profile.name || loaderData.profile.username}` },
      { property: "og:description", content: loaderData.event.description || `Pick a time — ${loaderData.event.duration_minutes} minutes.` },
    ] : [{ title: "Not found" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => <div className="p-20 text-center"><h1 className="font-display text-5xl">Not found</h1><p className="mt-2 text-muted-foreground">This event doesn't exist.</p></div>,
  component: BookingFlow,
});

function BookingFlow() {
  const { profile, event, questions } = Route.useLoaderData();
  const nav = useNavigate();
  const inviteeTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [selectedDate, setSelectedDate] = useState<string>(() => ymdInZone(new Date(), profile.timezone || inviteeTz).ymd);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data: availabilityData } = useQuery({
    queryKey: ["availability", event.id],
    queryFn: async () => {
      const { data: schedule } = await supabase.from("schedules")
        .select("*").eq("user_id", profile.id)
        .eq(event.schedule_id ? "id" : "is_default", event.schedule_id || (true as any))
        .maybeSingle();
      if (!schedule) return { rules: [], overrides: [] };
      const [{ data: rules }, { data: overrides }] = await Promise.all([
        supabase.from("schedule_rules").select("*").eq("schedule_id", schedule.id),
        supabase.from("date_overrides").select("*").eq("schedule_id", schedule.id),
      ]);
      return { rules: rules ?? [], overrides: overrides ?? [] };
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["public-bookings", profile.id],
    queryFn: async () => {
      const from = new Date().toISOString();
      const to = addDays(new Date(), event.max_future_days).toISOString();
      const { data } = await supabase.rpc("get_host_busy_times", { p_host: profile.id, p_from: from, p_to: to });
      return (data as { start_at: string; end_at: string }[]) ?? [];
    },
  });

  const { data: gcalBusy } = useQuery({
    queryKey: ["gcal-busy", profile.id, event.max_future_days],
    queryFn: async () => {
      const timeMin = new Date().toISOString();
      const timeMax = addDays(new Date(), event.max_future_days).toISOString();
      const { busy } = await getHostBusyTimes({ data: { hostUserId: profile.id, timeMin, timeMax } });
      return busy;
    },
  });

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < event.max_future_days; i++) {
      const d = addDays(startOfDay(new Date()), i);
      arr.push(ymdInZone(d, profile.timezone || "UTC").ymd);
    }
    return arr;
  }, [event.max_future_days, profile.timezone]);

  const slots = useMemo(() => {
    if (!availabilityData) return [];
    const bookingBusy = (bookings ?? []).map(b => ({ start: new Date(b.start_at), end: new Date(b.end_at) }));
    const externalBusy = (gcalBusy ?? []).map(b => ({ start: new Date(b.start), end: new Date(b.end) }));
    return computeSlots({
      dateYMD: selectedDate,
      hostTimezone: profile.timezone || "UTC",
      weeklyRules: (availabilityData.rules as unknown as WeeklyRule[]) ?? [],
      overrides: (availabilityData.overrides as unknown as Override[]) ?? [],
      busy: [...bookingBusy, ...externalBusy],
      durationMin: event.duration_minutes,
      bufferBefore: event.buffer_before,
      bufferAfter: event.buffer_after,
      minNoticeMin: event.min_notice_mins,
    });
  }, [availabilityData, selectedDate, event, bookings, gcalBusy, profile.timezone]);

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    for (const q of questions as any[]) {
      if (q.required && !(answers[q.id] ?? "").trim()) return toast.error(`"${q.label}" is required`);
    }
    setSubmitting(true);
    const end = new Date(selectedSlot.getTime() + event.duration_minutes * 60_000);
    const { data: created, error } = await supabase.rpc("create_public_booking", {
      p_event_type_id: event.id,
      p_invitee_name: invName,
      p_invitee_email: invEmail,
      p_invitee_timezone: inviteeTz,
      p_start_at: selectedSlot.toISOString(),
      p_end_at: end.toISOString(),
      p_notes: notes,
    });
    const row = Array.isArray(created) ? created[0] : (created as any);
    if (error || !row) { setSubmitting(false); return toast.error(error?.message ?? "Booking failed"); }
    const bookingId: string = row.id;
    const token: string = row.reschedule_token;

    const answerRows = (questions as any[])
      .filter((q: any) => (answers[q.id] ?? "").trim().length > 0)
      .map((q: any) => ({ question_id: q.id, answer: answers[q.id] }));
    if (answerRows.length) {
      await supabase.rpc("save_booking_answers", { p_booking_id: bookingId, p_token: token, p_answers: answerRows });
    }

    try {
      const { eventId } = await createBookingEvent({
        data: {
          hostUserId: profile.id,
          summary: `${event.title} with ${invName}`,
          description: notes || undefined,
          startISO: selectedSlot.toISOString(),
          endISO: end.toISOString(),
          inviteeEmail: invEmail,
          inviteeName: invName,
        },
      });
      if (eventId) {
        await supabase.rpc("attach_public_booking_event", { p_id: bookingId, p_token: token, p_event_id: eventId });
      }
    } catch (err) {
      console.error("Calendar sync failed", err);
    }

    setSubmitting(false);
    nav({
      to: "/$username/$slug/confirmed/$bookingId",
      params: { username: profile.username!, slug: event.slug, bookingId },
      search: { t: token },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/$username" params={{ username: profile.username! }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>

        <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
          <div>
            <p className="text-sm text-muted-foreground">{profile.name}</p>
            <h1 className="mt-1 font-display text-3xl">{event.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {event.duration_minutes} min</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Globe2 className="h-3.5 w-3.5" /> {inviteeTz}</p>
            {event.description && <p className="mt-4 text-sm text-muted-foreground">{event.description}</p>}
          </div>

          <Card>
            <CardContent className="p-6">
              {!selectedSlot ? (
                <>
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                    {days.slice(0, 14).map(d => {
                      const dObj = new Date(d + "T12:00:00");
                      const isSel = d === selectedDate;
                      return (
                        <button key={d} onClick={() => setSelectedDate(d)}
                          className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${isSel ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
                          <div className="text-xs">{format(dObj, "EEE")}</div>
                          <div className="font-medium">{format(dObj, "MMM d")}</div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mb-3 text-sm font-medium">Available times</p>
                  {slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No available slots on this day.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {slots.map(s => (
                        <button key={s.toISOString()} onClick={() => setSelectedSlot(s)}
                          className="rounded-lg border border-border py-2 text-sm hover:border-primary hover:bg-primary/5">
                          {format(s, "p")}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={confirm} className="space-y-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm text-muted-foreground">You picked</p>
                    <p className="font-medium">{format(selectedSlot, "EEEE, MMMM d")} at {format(selectedSlot, "p")}</p>
                    <button type="button" onClick={() => setSelectedSlot(null)} className="mt-1 text-xs text-primary hover:underline">Change</button>
                  </div>
                  <div className="space-y-2"><Label>Name</Label><Input required value={invName} onChange={e => setInvName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" required value={invEmail} onChange={e => setInvEmail(e.target.value)} /></div>

                  {questions.map((q: any) => (
                    <div key={q.id} className="space-y-2">
                      <Label>{q.label}{q.required && <span className="text-destructive"> *</span>}</Label>
                      {q.type === "TEXT" && (
                        <Textarea rows={2} value={answers[q.id] ?? ""} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} />
                      )}
                      {q.type === "YES_NO" && (
                        <RadioGroup value={answers[q.id] ?? ""} onValueChange={v => setAnswers({ ...answers, [q.id]: v })} className="flex gap-4">
                          <div className="flex items-center gap-2"><RadioGroupItem value="Yes" id={`${q.id}-y`} /><Label htmlFor={`${q.id}-y`} className="font-normal">Yes</Label></div>
                          <div className="flex items-center gap-2"><RadioGroupItem value="No" id={`${q.id}-n`} /><Label htmlFor={`${q.id}-n`} className="font-normal">No</Label></div>
                        </RadioGroup>
                      )}
                      {q.type === "MULTI_CHOICE" && (
                        <RadioGroup value={answers[q.id] ?? ""} onValueChange={v => setAnswers({ ...answers, [q.id]: v })} className="space-y-1">
                          {(q.options as string[]).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2"><RadioGroupItem value={opt} id={`${q.id}-${i}`} /><Label htmlFor={`${q.id}-${i}`} className="font-normal">{opt}</Label></div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  ))}

                  <div className="space-y-2"><Label>Anything you'd like to share? (optional)</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
                  <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Booking..." : "Confirm booking"}</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
