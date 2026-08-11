
-- Enums
CREATE TYPE public.plan AS ENUM ('FREE', 'PRO', 'TEAM');
CREATE TYPE public.location_type AS ENUM ('GOOGLE_MEET', 'ZOOM', 'PHONE', 'IN_PERSON', 'CUSTOM');
CREATE TYPE public.booking_status AS ENUM ('CONFIRMED', 'CANCELLED', 'RESCHEDULED');
CREATE TYPE public.question_type AS ENUM ('TEXT', 'MULTI_CHOICE', 'YES_NO');
CREATE TYPE public.day_of_week AS ENUM ('SUN','MON','TUE','WED','THU','FRI','SAT');

-- Timestamp trigger fn
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  email TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  avatar_url TEXT,
  brand_color TEXT,
  welcome_message TEXT,
  plan public.plan NOT NULL DEFAULT 'FREE',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles owner insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles owner update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles owner delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1))
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- schedules
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Working hours',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schedules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedules TO authenticated;
GRANT ALL ON public.schedules TO service_role;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules public read" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "schedules owner write" ON public.schedules FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER schedules_set_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- schedule_rules (weekly recurring blocks)
CREATE TABLE public.schedule_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  day public.day_of_week NOT NULL,
  start_minute INTEGER NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440),
  end_minute INTEGER NOT NULL CHECK (end_minute > 0 AND end_minute <= 1440),
  CHECK (end_minute > start_minute)
);
GRANT SELECT ON public.schedule_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_rules TO authenticated;
GRANT ALL ON public.schedule_rules TO service_role;
ALTER TABLE public.schedule_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedule_rules public read" ON public.schedule_rules FOR SELECT USING (true);
CREATE POLICY "schedule_rules owner write" ON public.schedule_rules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.schedules s WHERE s.id = schedule_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.schedules s WHERE s.id = schedule_id AND s.user_id = auth.uid()));

-- date_overrides
CREATE TABLE public.date_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  start_minute INTEGER,
  end_minute INTEGER
);
GRANT SELECT ON public.date_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.date_overrides TO authenticated;
GRANT ALL ON public.date_overrides TO service_role;
ALTER TABLE public.date_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "date_overrides public read" ON public.date_overrides FOR SELECT USING (true);
CREATE POLICY "date_overrides owner write" ON public.date_overrides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.schedules s WHERE s.id = schedule_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.schedules s WHERE s.id = schedule_id AND s.user_id = auth.uid()));

-- event_types
CREATE TABLE public.event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  location_type public.location_type NOT NULL DEFAULT 'GOOGLE_MEET',
  location_value TEXT,
  color TEXT DEFAULT '#6E9695',
  is_active BOOLEAN NOT NULL DEFAULT true,
  buffer_before INTEGER NOT NULL DEFAULT 0,
  buffer_after INTEGER NOT NULL DEFAULT 0,
  min_notice_mins INTEGER NOT NULL DEFAULT 60,
  max_future_days INTEGER NOT NULL DEFAULT 60,
  daily_limit INTEGER,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
GRANT SELECT ON public.event_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_types TO authenticated;
GRANT ALL ON public.event_types TO service_role;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_types public read active" ON public.event_types FOR SELECT USING (is_active = true);
CREATE POLICY "event_types owner read all" ON public.event_types FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "event_types owner write" ON public.event_types FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_types owner update" ON public.event_types FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_types owner delete" ON public.event_types FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER event_types_set_updated_at BEFORE UPDATE ON public.event_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- booking_questions
CREATE TABLE public.booking_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id UUID NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type public.question_type NOT NULL DEFAULT 'TEXT',
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  position INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.booking_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_questions TO authenticated;
GRANT ALL ON public.booking_questions TO service_role;
ALTER TABLE public.booking_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking_questions public read" ON public.booking_questions FOR SELECT USING (true);
CREATE POLICY "booking_questions owner write" ON public.booking_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.event_types et WHERE et.id = event_type_id AND et.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.event_types et WHERE et.id = event_type_id AND et.user_id = auth.uid()));

-- bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id UUID NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_name TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_timezone TEXT NOT NULL DEFAULT 'UTC',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'CONFIRMED',
  cancellation_reason TEXT,
  reschedule_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  meeting_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bookings_host_idx ON public.bookings(host_user_id, start_at);
CREATE INDEX bookings_event_type_idx ON public.bookings(event_type_id, start_at);
CREATE UNIQUE INDEX bookings_reschedule_token_idx ON public.bookings(reschedule_token);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings host read" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = host_user_id);
CREATE POLICY "bookings public insert" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings host update" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = host_user_id) WITH CHECK (auth.uid() = host_user_id);
CREATE POLICY "bookings host delete" ON public.bookings FOR DELETE TO authenticated USING (auth.uid() = host_user_id);
CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- booking_answers
CREATE TABLE public.booking_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.booking_questions(id) ON DELETE CASCADE,
  answer TEXT
);
GRANT SELECT, INSERT ON public.booking_answers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_answers TO authenticated;
GRANT ALL ON public.booking_answers TO service_role;
ALTER TABLE public.booking_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking_answers host read" ON public.booking_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.host_user_id = auth.uid()));
CREATE POLICY "booking_answers public insert" ON public.booking_answers FOR INSERT WITH CHECK (true);

-- calendar_accounts (Google only)
CREATE TABLE public.calendar_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  account_email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_accounts TO authenticated;
GRANT ALL ON public.calendar_accounts TO service_role;
ALTER TABLE public.calendar_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_accounts owner all" ON public.calendar_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
