
DROP POLICY IF EXISTS "bookings public insert" ON public.bookings;

CREATE OR REPLACE FUNCTION public.create_public_booking(
  p_event_type_id uuid,
  p_invitee_name text,
  p_invitee_email text,
  p_invitee_timezone text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_notes text
) RETURNS TABLE(id uuid, reschedule_token text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_event record;
  v_id uuid;
  v_token text;
BEGIN
  IF p_start_at <= now() OR p_end_at <= p_start_at THEN RAISE EXCEPTION 'invalid_time'; END IF;
  IF length(coalesce(p_invitee_name,'')) = 0 OR length(coalesce(p_invitee_email,'')) = 0 THEN RAISE EXCEPTION 'invalid_invitee'; END IF;

  SELECT et.id, et.user_id, et.is_active INTO v_event
  FROM public.event_types et WHERE et.id = p_event_type_id;
  IF NOT FOUND OR NOT v_event.is_active THEN RAISE EXCEPTION 'event_not_available'; END IF;

  INSERT INTO public.bookings (event_type_id, host_user_id, invitee_name, invitee_email, invitee_timezone, start_at, end_at, notes)
  VALUES (p_event_type_id, v_event.user_id, p_invitee_name, p_invitee_email, p_invitee_timezone, p_start_at, p_end_at, p_notes)
  RETURNING bookings.id, bookings.reschedule_token INTO v_id, v_token;

  RETURN QUERY SELECT v_id, v_token;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_public_booking(uuid, text, text, text, timestamptz, timestamptz, text) TO anon, authenticated;
