
-- Public read of a booking by id (id acts as an unguessable token for invitee confirmation/cancel/reschedule)
GRANT SELECT ON public.bookings TO anon;
GRANT UPDATE (status, cancellation_reason, start_at, end_at, updated_at) ON public.bookings TO anon;
GRANT SELECT ON public.booking_answers TO anon;
GRANT SELECT ON public.event_types TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.schedules TO anon;
GRANT SELECT ON public.schedule_rules TO anon;
GRANT SELECT ON public.date_overrides TO anon;
GRANT SELECT ON public.booking_questions TO anon;

CREATE POLICY "bookings public read" ON public.bookings FOR SELECT TO anon USING (true);

-- Public (invitee) cancel: knowing the booking id, may set status to CANCELLED if the booking is currently confirmed and in the future.
CREATE POLICY "bookings public cancel" ON public.bookings FOR UPDATE TO anon
  USING (status = 'CONFIRMED' AND start_at > now())
  WITH CHECK (status IN ('CONFIRMED','CANCELLED') AND start_at > now());
