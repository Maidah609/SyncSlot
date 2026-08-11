
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten public booking insert: require future start, matching host, and non-empty invitee fields
DROP POLICY IF EXISTS "bookings public insert" ON public.bookings;
CREATE POLICY "bookings public insert" ON public.bookings FOR INSERT WITH CHECK (
  start_at > now()
  AND end_at > start_at
  AND length(invitee_name) > 0
  AND length(invitee_email) > 0
  AND EXISTS (
    SELECT 1 FROM public.event_types et
    WHERE et.id = event_type_id AND et.user_id = host_user_id AND et.is_active = true
  )
);

DROP POLICY IF EXISTS "booking_answers public insert" ON public.booking_answers;
CREATE POLICY "booking_answers public insert" ON public.booking_answers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
      AND b.created_at > now() - interval '5 minutes'
  )
);
