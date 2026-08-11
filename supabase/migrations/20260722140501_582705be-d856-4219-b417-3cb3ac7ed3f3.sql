
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, name, username, timezone, avatar_url, brand_color, welcome_message, plan, onboarded, created_at, updated_at)
  ON public.profiles TO anon;

DROP POLICY IF EXISTS "bookings public read" ON public.bookings;
DROP POLICY IF EXISTS "bookings public cancel" ON public.bookings;

CREATE OR REPLACE FUNCTION public.get_host_busy_times(p_host uuid, p_from timestamptz, p_to timestamptz)
RETURNS TABLE(start_at timestamptz, end_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT start_at, end_at FROM public.bookings
  WHERE host_user_id = p_host AND status = 'CONFIRMED'
    AND start_at >= p_from AND start_at <= p_to;
$$;
GRANT EXECUTE ON FUNCTION public.get_host_busy_times(uuid, timestamptz, timestamptz) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_booking(p_id uuid, p_token text)
RETURNS TABLE(
  id uuid, event_type_id uuid, host_user_id uuid,
  start_at timestamptz, end_at timestamptz,
  status booking_status, invitee_name text, invitee_email text, invitee_timezone text,
  notes text, cancellation_reason text, google_event_id text
)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT id, event_type_id, host_user_id, start_at, end_at, status,
         invitee_name, invitee_email, invitee_timezone, notes, cancellation_reason, google_event_id
  FROM public.bookings
  WHERE id = p_id AND reschedule_token = p_token;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_booking(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.cancel_public_booking(p_id uuid, p_token text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.bookings SET status = 'CANCELLED', cancellation_reason = p_reason
  WHERE id = p_id AND reschedule_token = p_token
    AND status = 'CONFIRMED' AND start_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_booking_or_token'; END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_public_booking(uuid, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.reschedule_public_booking(p_id uuid, p_token text, p_start timestamptz, p_end timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_start <= now() OR p_end <= p_start THEN RAISE EXCEPTION 'invalid_time'; END IF;
  UPDATE public.bookings SET start_at = p_start, end_at = p_end
  WHERE id = p_id AND reschedule_token = p_token
    AND status = 'CONFIRMED' AND start_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_booking_or_token'; END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.reschedule_public_booking(uuid, text, timestamptz, timestamptz) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.attach_public_booking_event(p_id uuid, p_token text, p_event_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.bookings SET google_event_id = p_event_id
  WHERE id = p_id AND reschedule_token = p_token;
END;
$$;
GRANT EXECUTE ON FUNCTION public.attach_public_booking_event(uuid, text, text) TO anon, authenticated;

DROP POLICY IF EXISTS "booking_answers public insert" ON public.booking_answers;

CREATE OR REPLACE FUNCTION public.save_booking_answers(p_booking_id uuid, p_token text, p_answers jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.bookings WHERE id = p_booking_id AND reschedule_token = p_token) THEN
    RAISE EXCEPTION 'invalid_booking_or_token';
  END IF;
  FOR r IN SELECT * FROM jsonb_array_elements(p_answers) LOOP
    INSERT INTO public.booking_answers (booking_id, question_id, answer)
    VALUES (p_booking_id, (r->>'question_id')::uuid, r->>'answer');
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.save_booking_answers(uuid, text, jsonb) TO anon, authenticated;

DROP POLICY IF EXISTS "booking_questions public read" ON public.booking_questions;
CREATE POLICY "booking_questions public read active"
  ON public.booking_questions FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.event_types et
    WHERE et.id = booking_questions.event_type_id AND et.is_active = true));

DROP POLICY IF EXISTS "schedules public read" ON public.schedules;
CREATE POLICY "schedules public read active"
  ON public.schedules FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.event_types et
    WHERE et.user_id = schedules.user_id AND et.is_active = true
      AND (et.schedule_id = schedules.id OR (et.schedule_id IS NULL AND schedules.is_default = true))));

DROP POLICY IF EXISTS "schedule_rules public read" ON public.schedule_rules;
CREATE POLICY "schedule_rules public read active"
  ON public.schedule_rules FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.schedules s
    JOIN public.event_types et
      ON et.user_id = s.user_id AND et.is_active = true
     AND (et.schedule_id = s.id OR (et.schedule_id IS NULL AND s.is_default = true))
    WHERE s.id = schedule_rules.schedule_id));

DROP POLICY IF EXISTS "date_overrides public read" ON public.date_overrides;
CREATE POLICY "date_overrides public read active"
  ON public.date_overrides FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.schedules s
    JOIN public.event_types et
      ON et.user_id = s.user_id AND et.is_active = true
     AND (et.schedule_id = s.id OR (et.schedule_id IS NULL AND s.is_default = true))
    WHERE s.id = date_overrides.schedule_id));
