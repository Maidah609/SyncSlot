import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CheckCircle2, CalendarX, RefreshCcw } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/$username/$slug/confirmed/$bookingId")({
  validateSearch: z.object({ t: z.string().min(1) }),
  loaderDeps: ({ search }) => ({ t: search.t }),
  loader: async ({ params, deps }) => {
    const { data: rows } = await supabase.rpc("get_public_booking", { p_id: params.bookingId, p_token: deps.t });
    const booking = Array.isArray(rows) ? rows[0] : rows;
    if (!booking) throw notFound();
    const { data: et } = await supabase.from("event_types").select("title,duration_minutes,location_type,location_value").eq("id", booking.event_type_id).maybeSingle();
    return { booking, et };
  },
  head: () => ({ meta: [{ title: "Booking confirmed — SyncSlot" }, { name: "robots", content: "noindex" }] }),
  component: Confirmed,
});

function Confirmed() {
  const { booking, et } = Route.useLoaderData();
  const { username, slug } = Route.useParams();
  const { t } = Route.useSearch();
  const canModify = booking.status === "CONFIRMED" && new Date(booking.start_at) > new Date();
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-6">
      <div className="w-full text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-6 font-display text-4xl">{booking.status === "CANCELLED" ? "Booking cancelled" : "You're booked!"}</h1>
        {booking.status !== "CANCELLED" && <p className="mt-2 text-muted-foreground">Save this page — you can reschedule or cancel from here.</p>}
        <div className="mt-8 rounded-xl border border-border bg-card p-6 text-left">
          <p className="font-medium">{et?.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{format(new Date(booking.start_at), "EEEE, MMMM d")} · {format(new Date(booking.start_at), "p")} — {format(new Date(booking.end_at), "p")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{et?.duration_minutes} min · {et?.location_type?.replace("_", " ").toLowerCase()}</p>
          {et?.location_value && <p className="mt-1 text-sm text-muted-foreground">{et.location_value}</p>}
        </div>
        {canModify && (
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/$username/$slug/reschedule/$bookingId" params={{ username, slug, bookingId: booking.id }} search={{ t }}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:border-primary">
              <RefreshCcw className="h-4 w-4" /> Reschedule
            </Link>
            <Link to="/$username/$slug/cancel/$bookingId" params={{ username, slug, bookingId: booking.id }} search={{ t }}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-destructive hover:border-destructive">
              <CalendarX className="h-4 w-4" /> Cancel
            </Link>
          </div>
        )}
        <Link to="/" className="mt-8 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to SyncSlot</Link>
      </div>
    </div>
  );
}
