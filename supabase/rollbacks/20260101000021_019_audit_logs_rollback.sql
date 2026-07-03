-- Rollback Migration 019

DROP TRIGGER IF EXISTS audit_invoices_trigger ON invoices;
DROP TRIGGER IF EXISTS audit_expenses_trigger ON expenses;
DROP TRIGGER IF EXISTS audit_attendance_trigger ON attendance;
DROP TRIGGER IF EXISTS audit_leave_requests_trigger ON leave_requests;

DROP FUNCTION IF EXISTS process_audit_log();
DROP TABLE IF EXISTS audit_logs;

CREATE OR REPLACE FUNCTION checkout_equipment(
  p_equipment_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_expected_return_date date,
  p_purpose text
) RETURNS void AS $$
DECLARE
  v_status equipment_status;
BEGIN
  SELECT status INTO v_status FROM equipment WHERE id = p_equipment_id;
  IF v_status != 'available' THEN
    RAISE EXCEPTION 'Equipment is not available for checkout';
  END IF;
  UPDATE equipment SET status = 'in_use' WHERE id = p_equipment_id;
  INSERT INTO equipment_checkouts (equipment_id, user_id, project_id, expected_return_date, purpose)
  VALUES (p_equipment_id, p_user_id, p_project_id, p_expected_return_date, p_purpose);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
