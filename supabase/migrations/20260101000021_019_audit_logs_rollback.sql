-- Rollback Migration 019

-- Drop ALL triggers depending on process_audit_log() before dropping the function
-- (migration 021 adds 5 more, so we must drop them all)
DROP TRIGGER IF EXISTS audit_invoices_trigger ON invoices;
DROP TRIGGER IF EXISTS audit_expenses_trigger ON expenses;
DROP TRIGGER IF EXISTS audit_attendance_trigger ON attendance;
DROP TRIGGER IF EXISTS audit_leave_requests_trigger ON leave_requests;
DROP TRIGGER IF EXISTS audit_equipment_checkouts_trigger ON equipment_checkouts;
DROP TRIGGER IF EXISTS audit_equipment_maintenance_trigger ON equipment_maintenance;
DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;
DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;
DROP TRIGGER IF EXISTS audit_project_budgets_trigger ON project_budgets;

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
