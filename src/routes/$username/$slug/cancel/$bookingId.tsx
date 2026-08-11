import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarX } from "lucide-react";
import { deleteBookingEvent } from "@/lib/googleCalendar.functions";
import { z } from "zod";

export const Route = createFileRoute("/$username/$slug/cancel/$bookingId")({
  validateSearch: z.object({ t: z.string().min(1) }),
  loaderDeps: ({ search }) => ({ t: search.t }),
  loader: async ({ params, deps }) => {
    const { data: rows } = await supabase.rpc("get_public_booking", { p_id: params.bookingId, p_token: deps.t });
    const booking = Array.isArray(rows) ? rows[0] : rows;
    if (!booking) throw notFound();
    const { data: et } = await supabase.from("event_types").select("title").eq("id", booking.event_type_id).maybeSingle();
    return { booking, et };
  },
  head: () => ({ meta: [{ title: "Cancel booking — SyncSlot" }, { name: "robots", content: "noindex" }] }),
  component: CancelBooking,
});

function CancelBooking() {
  const { booking, et } = Route.useLoaderData();
  const { username, slug } = Route.useParams();
  const { t } = Route.useSearch();
  const nav = useNavigate();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (booking.status === "CANCELLED") {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-6 text-center">
        <div className="w-full">
          <h1 className="font-display text-4xl">Already cancelled</h1>
          <Link to="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to SyncSlot</Link>
        </div>
      </div>
    );
  }

  const doCancel = async () => {
    setSubmitting(true);
    const { error } = await supabase.rpc("cancel_public_booking", { p_id: booking.id, p_token: t, p_reason: reason });
    if (!error && booking.google_event_id) {
      try {
        await deleteBookingEvent({ data: { hostUserId: booking.host_user_id, eventId: booking.google_event_id } });
      } catch (err) {
        console.error("Calendar delete failed", err);
      }
    }
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled");
    nav({ to: "/$username/$slug/confirmed/$bookingId", params: { username, slug, bookingId: booking.id }, search: { t } });
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <CalendarX className="h-10 w-10 text-destructive" />
      <h1 className="mt-4 font-display text-4xl">Cancel this booking?</h1>
      <p className="mt-2 text-muted-foreground">{et?.title} · {format(new Date(booking.start_at), "EEEE, MMMM d 'at' p")}</p>
      <div className="mt-6 space-y-2">
        <Label>Reason (optional)</Label>
        <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Let the host know why..." />
      </div>
      <div className="mt-6 flex gap-3">
        <Button variant="destructive" onClick={doCancel} disabled={submitting}>{submitting ? "Cancelling..." : "Cancel booking"}</Button>
        <Link to="/$username/$slug/confirmed/$bookingId" params={{ username, slug, bookingId: booking.id }} search={{ t }} className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm">Keep it</Link>
      </div>
    </div>
  );
}
