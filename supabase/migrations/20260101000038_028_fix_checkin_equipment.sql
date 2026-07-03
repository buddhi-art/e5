-- Migration 028: Add atomic checkin_equipment RPC
-- The server action now calls this RPC instead of doing two separate UPDATEs,
-- preventing a race condition where equipment appears checked out after check-in.
-- Re-runnable: uses CREATE OR REPLACE
SET search_path = public;

-- =============================================================================
-- 1. Atomic check-in RPC — locks the checkout row, updates both tables in one
--    transaction so there's no window where equipment status is inconsistent.
-- =============================================================================
CREATE OR REPLACE FUNCTION checkin_equipment(
  p_checkout_id uuid,
  p_condition text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_equipment_id uuid;
  v_already_checked_in boolean;
BEGIN
  -- Lock the checkout row to prevent concurrent check-ins
  SELECT equipment_id, checked_in_at IS NOT NULL INTO v_equipment_id, v_already_checked_in
  FROM equipment_checkouts
  WHERE id = p_checkout_id
  FOR UPDATE;

  IF v_equipment_id IS NULL THEN
    RAISE EXCEPTION 'Checkout record not found';
  END IF;

  IF v_already_checked_in THEN
    RAISE EXCEPTION 'Equipment has already been checked in';
  END IF;

  -- Update checkout record
  UPDATE equipment_checkouts
  SET checked_in_at = now(),
      condition_at_checkin = p_condition,
      notes = COALESCE(p_notes, notes)
  WHERE id = p_checkout_id;

  -- Set equipment back to available
  UPDATE equipment
  SET status = 'available',
      updated_at = now()
  WHERE id = v_equipment_id;
END;
$$;
