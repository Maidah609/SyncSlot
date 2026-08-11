ALTER TABLE public.event_types
  ADD COLUMN IF NOT EXISTS event_date DATE,
  ADD COLUMN IF NOT EXISTS event_timezone TEXT;