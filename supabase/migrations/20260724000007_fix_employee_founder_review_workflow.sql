-- Secure employee-to-founder review submission. Employees can change only the
-- link/status transition exposed by this function, not arbitrary fields.

BEGIN;

DROP POLICY IF EXISTS "Assigned employees update own package deliverables" ON package_deliverables;

CREATE OR REPLACE FUNCTION public.submit_deliverable_for_founder_review(
  p_deliverable_id UUID,
  p_drive_link TEXT
)
RETURNS TABLE (id UUID, package_id UUID, status TEXT, drive_link TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_drive_link IS NULL OR btrim(p_drive_link) = '' THEN
    RAISE EXCEPTION 'Google Drive link cannot be empty';
  END IF;

  IF btrim(p_drive_link) !~* '^https?://' THEN
    RAISE EXCEPTION 'Drive link must use HTTP or HTTPS';
  END IF;

  RETURN QUERY
  UPDATE package_deliverables AS deliverable
  SET drive_link = btrim(p_drive_link),
      status = 'UNDER_REVIEW',
      updated_at = now()
  WHERE deliverable.id = p_deliverable_id
    AND deliverable.assigned_employee_id = auth.uid()
    AND deliverable.status IN ('ASSIGNED', 'IN_PROGRESS', 'REVISION_REQUESTED', 'not_started', 'in_editing')
  RETURNING deliverable.id, deliverable.package_id, deliverable.status, deliverable.drive_link;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deliverable is not assigned to you or is already locked';
  END IF;

  INSERT INTO package_audit_logs (package_id, actor_id, action)
  SELECT deliverable.package_id,
         auth.uid(),
         format('Submitted Google Drive link for founder review: "%s"', deliverable.title)
  FROM package_deliverables AS deliverable
  WHERE deliverable.id = p_deliverable_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_deliverable_for_founder_review(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_deliverable_for_founder_review(UUID, TEXT) TO authenticated;

COMMIT;