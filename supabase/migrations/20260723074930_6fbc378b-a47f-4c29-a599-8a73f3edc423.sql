
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'Member',
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(inviter_id, email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inviter manages own invites" ON public.team_invites
  FOR ALL USING (auth.uid() = inviter_id) WITH CHECK (auth.uid() = inviter_id);

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'Member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, member_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own team" ON public.team_members
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = member_id);
CREATE POLICY "Owner manages own team" ON public.team_members
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.accept_team_invite(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv public.team_invites%ROWTYPE;
  _uid uuid := auth.uid();
  _email text;
  _name text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO _inv FROM public.team_invites WHERE token = _token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_not_found';
  END IF;
  IF _inv.status <> 'pending' THEN
    RAISE EXCEPTION 'invite_%', _inv.status;
  END IF;

  SELECT email, coalesce(raw_user_meta_data->>'name', email) INTO _email, _name
  FROM auth.users WHERE id = _uid;

  INSERT INTO public.team_members (owner_id, member_id, email, name, role)
  VALUES (_inv.inviter_id, _uid, _email, _name, _inv.role)
  ON CONFLICT (owner_id, member_id) DO NOTHING;

  UPDATE public.team_invites
    SET status = 'accepted', accepted_at = now(), updated_at = now()
    WHERE id = _inv.id;

  RETURN jsonb_build_object('ok', true, 'inviter_id', _inv.inviter_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_invite(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER team_invites_updated_at BEFORE UPDATE ON public.team_invites
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
