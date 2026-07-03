-- Migration 019: Audit Logs & Soft Deletes Atomicity

SET search_path = public;

DO $$ BEGIN
  -- 1. Create audit_logs table
  CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data jsonb,
    new_data jsonb,
    changed_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
  );

  ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
  
  -- Only admins/founders can view audit logs
  DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
  CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (is_admin_or_founder(auth.uid()));
END $$;

-- 2. Create Audit Trigger Function
CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME::text, OLD.id, 'DELETE', row_to_json(OLD)::jsonb, auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME::text, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME::text, NEW.id, 'INSERT', row_to_json(NEW)::jsonb, auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to critical tables
DROP TRIGGER IF EXISTS audit_invoices_trigger ON invoices;
CREATE TRIGGER audit_invoices_trigger
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_expenses_trigger ON expenses;
CREATE TRIGGER audit_expenses_trigger
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_attendance_trigger ON attendance;
CREATE TRIGGER audit_attendance_trigger
AFTER INSERT OR UPDATE OR DELETE ON attendance
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_leave_requests_trigger ON leave_requests;
CREATE TRIGGER audit_leave_requests_trigger
AFTER INSERT OR UPDATE OR DELETE ON leave_requests
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 4. Equipment Checkout Atomicity (FOR UPDATE lock)
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
  -- Lock the row for update to prevent concurrent checkouts
  SELECT status INTO v_status FROM equipment WHERE id = p_equipment_id FOR UPDATE;

  IF v_status != 'available' THEN
    RAISE EXCEPTION 'Equipment is not available for checkout';
  END IF;

  UPDATE equipment SET status = 'in_use' WHERE id = p_equipment_id;

  INSERT INTO equipment_checkouts (equipment_id, user_id, project_id, expected_return_date, purpose)
  VALUES (p_equipment_id, p_user_id, p_project_id, p_expected_return_date, p_purpose);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
