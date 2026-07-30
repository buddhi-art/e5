-- Invoice number allocation fix (Audit item #40)
-- Run manually. Forward-only; historical migrations unchanged.
--
-- Problem: the application now calls executeInvoiceCreation with invoice_number = ''
-- and expected the RPC to allocate the number. The previous RPC inserted the passed
-- value verbatim, so invoices were created with a BLANK invoice_number.
--
-- Fix: allocate the number INSIDE atomic_create_invoice_with_items using the
-- existing per-year sequence via generate_invoice_number(), inside the same
-- transaction as the insert. This removes the burn-a-number-on-rollback race and
-- guarantees every invoice gets a unique, sequential number.

BEGIN;

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
  v_invoice_number text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> v_created_by OR NOT public.is_admin_or_founder(auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  -- Allocate the invoice number here, in-transaction. If the caller supplied a
  -- non-empty number, respect it (e.g. manual imports); otherwise generate one.
  v_invoice_number := NULLIF(p_invoice->>'invoice_number', '');
  IF v_invoice_number IS NULL THEN
    v_invoice_number := public.generate_invoice_number(
      EXTRACT(YEAR FROM CURRENT_DATE)::text
    );
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
    v_invoice_number, (p_invoice->>'client_id')::uuid,
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

COMMIT;
