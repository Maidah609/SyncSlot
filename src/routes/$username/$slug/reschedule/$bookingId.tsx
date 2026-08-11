import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { computeSlots, ymdInZone, type WeeklyRule, type Override } from "@/lib/availability";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { createBookingEvent, deleteBookingEvent } from "@/lib/googleCalendar.functions";
import { z } from "zod";

const PROFILE_COLS = "id,name,username,timezone,avatar_url,brand_color,welcome_message,plan,onboarded,created_at,updated_at";

export const Route = createFileRoute("/$username/$slug/reschedule/$bookingId")({
  validateSearch: z.object({ t: z.string().min(1) }),
  loaderDeps: ({ search }) => ({ t: search.t }),
  loader: async ({ params, deps }) => {
    const { data: profile } = await supabase.from("profiles").select(PROFILE_COLS).eq("username", params.username).maybeSingle();
    if (!profile) throw notFound();
    const { data: event } = await supabase.from("event_types").select("*").eq("user_id", profile.id).eq("slug", params.slug).maybeSingle();
    if (!event) throw notFound();
    const { data: rows } = await supabase.rpc("get_public_booking", { p_id: params.bookingId, p_token: deps.t });
    const booking = Array.isArray(rows) ? rows[0] : rows;
    if (!booking) throw notFound();
    return { profile, event, booking };
  },
  head: () => ({ meta: [{ title: "Reschedule — SyncSlot" }, { name: "robots", content: "noindex" }] }),
  component: Reschedule,
});

function Reschedule() {
  const { profile, event, booking } = Route.useLoaderData();
  const { username, slug } = Route.useParams();
  const { t } = Route.useSearch();
  const nav = useNavigate();
  const inviteeTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [selectedDate, setSelectedDate] = useState<string>(() => ymdInZone(new Date(), profile.timezone || inviteeTz).ymd);
  const [submitting, setSubmitting] = useState(false);

  const { data: availabilityData } = useQuery({
    queryKey: ["availability", event.id],
    queryFn: async () => {
      const { data: schedule } = await supabase.from("schedules").select("*").eq("user_id", profile.id).eq("is_default", true).maybeSingle();
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

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < event.max_future_days; i++) arr.push(ymdInZone(addDays(startOfDay(new Date()), i), profile.timezone || "UTC").ymd);
    return arr;
  }, [event.max_future_days, profile.timezone]);

  const slots = useMemo(() => {
    if (!availabilityData) return [];
    return computeSlots({
      dateYMD: selectedDate,
      hostTimezone: profile.timezone || "UTC",
      weeklyRules: (availabilityData.rules as unknown as WeeklyRule[]) ?? [],
      overrides: (availabilityData.overrides as unknown as Override[]) ?? [],
      busy: (bookings ?? []).map(b => ({ start: new Date(b.start_at), end: new Date(b.end_at) })),
      durationMin: event.duration_minutes,
      bufferBefore: event.buffer_before,
      bufferAfter: event.buffer_after,
      minNoticeMin: event.min_notice_mins,
    });
  }, [availabilityData, selectedDate, event, bookings, profile.timezone]);

  const pick = async (s: Date) => {
    setSubmitting(true);
    const end = new Date(s.getTime() + event.duration_minutes * 60_000);
    const { error } = await supabase.rpc("reschedule_public_booking", {
      p_id: booking.id, p_token: t, p_start: s.toISOString(), p_end: end.toISOString(),
    });
    if (!error) {
      try {
        if (booking.google_event_id) {
          await deleteBookingEvent({ data: { hostUserId: booking.host_user_id, eventId: booking.google_event_id } });
        }
        const { eventId } = await createBookingEvent({
          data: {
            hostUserId: booking.host_user_id,
            summary: `${event.title} with ${booking.invitee_name}`,
            description: booking.notes || undefined,
            startISO: s.toISOString(),
            endISO: end.toISOString(),
            inviteeEmail: booking.invitee_email,
            inviteeName: booking.invitee_name,
          },
        });
        if (eventId) {
          await supabase.rpc("attach_public_booking_event", { p_id: booking.id, p_token: t, p_event_id: eventId });
        }
      } catch (err) {
        console.error("Calendar sync failed", err);
      }
    }
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Rescheduled");
    nav({ to: "/$username/$slug/confirmed/$bookingId", params: { username, slug, bookingId: booking.id }, search: { t } });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/$username/$slug/confirmed/$bookingId" params={{ username, slug, bookingId: booking.id }} search={{ t }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <h1 className="mt-4 font-display text-4xl">Reschedule</h1>
      <p className="mt-2 text-muted-foreground">Currently {format(new Date(booking.start_at), "EEEE, MMMM d 'at' p")}. Pick a new time.</p>

      <Card className="mt-8">
        <CardContent className="p-6">
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
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No available slots on this day.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map(s => (
                <button key={s.toISOString()} disabled={submitting} onClick={() => pick(s)}
                  className="rounded-lg border border-border py-2 text-sm hover:border-primary hover:bg-primary/5">
                  {format(s, "p")}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
