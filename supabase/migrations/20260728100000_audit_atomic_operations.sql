-- Audit remediation: public review access through scoped RPCs and atomic mutations.
BEGIN;

-- Public review pages/actions use the anon key. These functions expose only the
-- record addressed by an active, unguessable review token.
CREATE OR REPLACE FUNCTION public.get_client_review_page(p_review_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link record;
  v_deliverable record;
  v_reviews jsonb;
BEGIN
  SELECT cr.package_deliverable_id
    INTO v_link
  FROM public.client_reviews cr
  WHERE cr.token = p_review_token AND cr.is_active = true;

  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT d.id, d.title, d.status, d.drive_link, d.revision_history,
         p.package_number, p.title AS package_title, c.company_name
    INTO v_deliverable
  FROM public.package_deliverables d
  JOIN public.packages p ON p.id = d.package_id
  JOIN public.clients c ON c.id = p.client_id
  WHERE d.id = v_link.package_deliverable_id;

  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::jsonb)
    INTO v_reviews
  FROM (
    SELECT id, status, feedback, created_at
    FROM public.client_reviews
    WHERE package_deliverable_id = v_link.package_deliverable_id
      AND status IS NOT NULL
  ) r;

  RETURN jsonb_build_object(
    'token', p_review_token,
    'deliverable', jsonb_build_object(
      'id', v_deliverable.id,
      'title', v_deliverable.title,
      'status', v_deliverable.status,
      'drive_link', v_deliverable.drive_link,
      'revision_history', v_deliverable.revision_history
    ),
    'client_name', v_deliverable.company_name,
    'reviews', v_reviews
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_client_review_page(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_client_review_page(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_client_review(uuid, text, text) TO anon, authenticated;

-- Ensure the review function itself creates staff notifications atomically.
CREATE OR REPLACE FUNCTION public.submit_client_review(
  p_review_token uuid,
  p_status text,
  p_feedback text DEFAULT NULL
)
RETURNS TABLE (deliverable_id uuid, package_id uuid, title text, project_id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  review_link record;
  deliverable record;
BEGIN
  IF p_status NOT IN ('APPROVED', 'REVISION_REQUESTED') THEN
    RAISE EXCEPTION 'Invalid review status';
  END IF;
  IF p_feedback IS NOT NULL AND length(p_feedback) > 5000 THEN
    RAISE EXCEPTION 'Feedback must be 5,000 characters or fewer';
  END IF;

  SELECT cr.package_deliverable_id INTO review_link
  FROM public.client_reviews cr
  WHERE cr.token = p_review_token AND cr.is_active = true
  FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT d.id, d.package_id, d.title, d.status, p.project_id
    INTO deliverable
  FROM public.package_deliverables d
  JOIN public.packages p ON p.id = d.package_id
  WHERE d.id = review_link.package_deliverable_id
  FOR UPDATE;
  IF NOT FOUND OR deliverable.status <> 'UNDER_REVIEW' THEN RETURN; END IF;

  INSERT INTO public.client_reviews (project_id, package_deliverable_id, status, feedback, is_active)
  VALUES (deliverable.project_id, deliverable.id, p_status,
          NULLIF(btrim(p_feedback), ''), false);

  UPDATE public.package_deliverables
  SET status = p_status, updated_at = timezone('utc', now())
  WHERE id = deliverable.id;

  UPDATE public.client_reviews SET is_active = false WHERE token = p_review_token;

  INSERT INTO public.notifications (user_id, type, title, description, href)
  SELECT pr.id, 'client_review', 'Client Review: ' || p_status,
         'The client has ' || CASE WHEN p_status = 'APPROVED' THEN 'approved' ELSE 'requested a revision for' END
         || ' deliverable "' || deliverable.title || '".',
         '/admin/packages/' || deliverable.package_id
  FROM public.profiles pr
  WHERE pr.deleted_at IS NULL AND (pr.role = 'admin' OR pr.designation = 'Founder');

  RETURN QUERY SELECT deliverable.id, deliverable.package_id, deliverable.title,
    deliverable.project_id, p_status;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_client_review(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_client_review(uuid, text, text) TO anon, authenticated;

-- Anonymous clients use the scoped RPCs; they cannot query review tables directly.
DROP POLICY IF EXISTS "Public review token access" ON public.client_reviews;

-- Atomic invoice creation. Totals are calculated with PostgreSQL NUMERIC values,
-- and invoice + all line items commit or roll back together.
CREATE OR REPLACE FUNCTION public.atomic_create_invoice_with_items(
  p_invoice jsonb,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id uuid;
  v_created_by uuid := (p_invoice->>'created_by')::uuid;
  v_subtotal numeric(12,2);
  v_discount_amount numeric(12,2);
  v_tax_amount numeric(12,2);
  v_grand_total numeric(12,2);
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> v_created_by OR NOT public.is_admin_or_founder(auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  SELECT COALESCE(sum((item->>'quantity')::numeric * (item->>'unit_price')::numeric), 0)
    INTO v_subtotal
  FROM jsonb_array_elements(p_items) item;

  v_discount_amount := CASE WHEN p_invoice->>'discount_type' = 'percentage'
    THEN v_subtotal * COALESCE((p_invoice->>'discount_value')::numeric, 0) / 100
    ELSE COALESCE((p_invoice->>'discount_value')::numeric, 0) END;
  v_tax_amount := (v_subtotal - v_discount_amount)
    * COALESCE((p_invoice->>'tax_rate')::numeric, 0) / 100;
  v_grand_total := v_subtotal - v_discount_amount + v_tax_amount;

  INSERT INTO public.invoices (
    invoice_number, client_id, project_id, title, description, amount,
    discount_type, discount_value, discount_amount, advance_received,
    tax_rate, tax_amount, grand_total, balance_due, currency, issue_date,
    due_date, notes, created_by
  ) VALUES (
    p_invoice->>'invoice_number', (p_invoice->>'client_id')::uuid,
    NULLIF(p_invoice->>'project_id', '')::uuid, p_invoice->>'title',
    NULLIF(p_invoice->>'description', ''), v_subtotal,
    COALESCE(p_invoice->>'discount_type', 'fixed'), COALESCE((p_invoice->>'discount_value')::numeric, 0),
    v_discount_amount, COALESCE((p_invoice->>'advance_received')::numeric, 0),
    COALESCE((p_invoice->>'tax_rate')::numeric, 0), v_tax_amount, v_grand_total,
    v_grand_total - COALESCE((p_invoice->>'advance_received')::numeric, 0),
    COALESCE(NULLIF(p_invoice->>'currency', ''), 'NPR'),
    COALESCE(NULLIF(p_invoice->>'issue_date', ''), CURRENT_DATE::text)::date,
    (p_invoice->>'due_date')::date, NULLIF(p_invoice->>'notes', ''), v_created_by
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, amount)
  SELECT v_invoice_id, item->>'description', (item->>'quantity')::numeric,
         (item->>'unit_price')::numeric,
         (item->>'quantity')::numeric * (item->>'unit_price')::numeric
  FROM jsonb_array_elements(p_items) item;

  RETURN v_invoice_id;
END;
$$;
REVOKE ALL ON FUNCTION public.atomic_create_invoice_with_items(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atomic_create_invoice_with_items(jsonb, jsonb) TO authenticated;

-- Restrict comment reads to admins/founders and employees assigned to the parent task.
DROP POLICY IF EXISTS "Subtask comments viewable by everyone" ON public.subtask_comments;
DROP POLICY IF EXISTS "Assigned users and admins view subtask comments" ON public.subtask_comments;
CREATE POLICY "Assigned users and admins view subtask comments"
  ON public.subtask_comments FOR SELECT
  USING (
    public.is_admin_or_founder(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.subtasks st
      JOIN public.tasks t ON t.id = st.task_id
      WHERE st.id = subtask_comments.subtask_id
        AND t.assigned_to = auth.uid()
    )
  );

-- Atomic archive operations used by admin actions.
CREATE OR REPLACE FUNCTION public.archive_employee_atomic(p_employee_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_or_founder(auth.uid()) THEN RAISE EXCEPTION 'permission_denied'; END IF;
  UPDATE public.tasks SET assigned_to = NULL WHERE assigned_to = p_employee_id AND status <> 'completed';
  UPDATE public.profiles SET deleted_at = COALESCE(deleted_at, now()) WHERE id = p_employee_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_client_atomic(p_client_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_now timestamptz := now();
BEGIN
  IF NOT public.is_admin_or_founder(auth.uid()) THEN RAISE EXCEPTION 'permission_denied'; END IF;
  UPDATE public.clients SET deleted_at = COALESCE(deleted_at, v_now) WHERE id = p_client_id;
  UPDATE public.projects SET deleted_at = COALESCE(deleted_at, v_now) WHERE client_id = p_client_id AND deleted_at IS NULL;
  UPDATE public.invoices SET deleted_at = COALESCE(deleted_at, v_now), updated_at = v_now WHERE client_id = p_client_id AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_equipment_atomic(p_equipment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status text;
BEGIN
  IF NOT public.is_admin_or_founder(auth.uid()) THEN RAISE EXCEPTION 'permission_denied'; END IF;
  SELECT status::text INTO v_status FROM public.equipment WHERE id = p_equipment_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Equipment not found'; END IF;
  IF EXISTS (SELECT 1 FROM public.equipment_checkouts WHERE equipment_id = p_equipment_id AND checked_in_at IS NULL) THEN
    RAISE EXCEPTION 'Equipment is currently checked out';
  END IF;
  UPDATE public.equipment SET status = 'retired', deleted_at = COALESCE(deleted_at, now()), updated_at = now()
  WHERE id = p_equipment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_employee_atomic(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.archive_client_atomic(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.archive_equipment_atomic(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_employee_atomic(uuid), public.archive_client_atomic(uuid), public.archive_equipment_atomic(uuid) TO authenticated;

COMMIT;
