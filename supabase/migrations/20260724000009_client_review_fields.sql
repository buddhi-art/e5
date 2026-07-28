-- Complete the external client-review record used by the public review portal.
-- The original integration table predates the review submission workflow.
BEGIN;

ALTER TABLE client_reviews
  ALTER COLUMN project_id DROP NOT NULL;

ALTER TABLE client_reviews
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS feedback TEXT;

ALTER TABLE client_reviews
  DROP CONSTRAINT IF EXISTS client_reviews_status_check;

ALTER TABLE client_reviews
  ADD CONSTRAINT client_reviews_status_check
  CHECK (status IN ('APPROVED', 'REVISION_REQUESTED'));

CREATE INDEX IF NOT EXISTS idx_client_reviews_deliverable_id
  ON client_reviews(package_deliverable_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.submit_client_review(
  p_review_token UUID,
  p_status TEXT,
  p_feedback TEXT DEFAULT NULL
)
RETURNS TABLE (
  deliverable_id UUID,
  package_id UUID,
  title TEXT,
  project_id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  review_link RECORD;
  deliverable RECORD;
BEGIN
  IF p_status NOT IN ('APPROVED', 'REVISION_REQUESTED') THEN
    RAISE EXCEPTION 'Invalid review status';
  END IF;

  IF p_feedback IS NOT NULL AND LENGTH(p_feedback) > 5000 THEN
    RAISE EXCEPTION 'Feedback must be 5,000 characters or fewer';
  END IF;

  SELECT cr.package_deliverable_id
  INTO review_link
  FROM client_reviews AS cr
  WHERE cr.token = p_review_token
    AND cr.is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT d.id, d.package_id, d.title, d.status, p.project_id
  INTO deliverable
  FROM package_deliverables AS d
  JOIN packages AS p ON p.id = d.package_id
  WHERE d.id = review_link.package_deliverable_id
  FOR UPDATE;

  IF NOT FOUND OR deliverable.status <> 'UNDER_REVIEW' THEN
    RETURN;
  END IF;

  INSERT INTO client_reviews (
    project_id,
    package_deliverable_id,
    status,
    feedback,
    is_active
  )
  VALUES (
    deliverable.project_id,
    deliverable.id,
    p_status,
    NULLIF(BTRIM(p_feedback), ''),
    false
  );

  UPDATE package_deliverables AS d
  SET status = p_status, updated_at = timezone('utc'::text, now())
  WHERE d.id = deliverable.id;

  UPDATE client_reviews AS cr
  SET is_active = false
  WHERE cr.token = p_review_token;

  RETURN QUERY SELECT deliverable.id, deliverable.package_id, deliverable.title,
    deliverable.project_id, p_status;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_client_review(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_client_review(UUID, TEXT, TEXT) TO service_role;

COMMIT;