
REVOKE EXECUTE ON FUNCTION public.accept_team_invite(uuid) FROM PUBLIC, anon;
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
