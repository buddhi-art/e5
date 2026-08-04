CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If auth.uid() is NULL, this is likely a service_role execution which should be allowed.
  IF auth.uid() IS NOT NULL 
     AND NOT public.is_admin_or_founder(auth.uid())
     AND (
       NEW.role IS DISTINCT FROM OLD.role
       OR NEW.designation IS DISTINCT FROM OLD.designation
     ) THEN
    RAISE EXCEPTION 'Only an admin or founder can change role or designation'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
