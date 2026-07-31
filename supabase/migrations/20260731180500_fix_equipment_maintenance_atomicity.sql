BEGIN;

CREATE OR REPLACE FUNCTION public.update_equipment_maintenance_status(
  p_maintenance_id uuid,
  p_status text,
  p_completed_date date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_equipment_id uuid;
  v_current_status text;
BEGIN
  IF NOT public.is_admin_or_founder(auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  -- Lock the maintenance row to prevent concurrent status changes
  SELECT equipment_id INTO v_equipment_id
  FROM equipment_maintenance
  WHERE id = p_maintenance_id
  FOR UPDATE;

  IF v_equipment_id IS NULL THEN
    RAISE EXCEPTION 'Maintenance record not found';
  END IF;

  SELECT status INTO v_current_status
  FROM equipment
  WHERE id = v_equipment_id
  FOR UPDATE;

  UPDATE equipment_maintenance
  SET status = p_status,
      completed_date = CASE WHEN p_status = 'completed' THEN COALESCE(p_completed_date, CURRENT_DATE) ELSE NULL END
  WHERE id = p_maintenance_id;

  IF p_status = 'completed' THEN
    IF v_current_status = 'maintenance' THEN
      UPDATE equipment SET status = 'available', updated_at = now() WHERE id = v_equipment_id;
    END IF;
  ELSIF p_status = 'in_progress' THEN
    IF v_current_status = 'available' THEN
      UPDATE equipment SET status = 'maintenance', updated_at = now() WHERE id = v_equipment_id;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_equipment_maintenance_status(uuid, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_equipment_maintenance_status(uuid, text, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.schedule_equipment_maintenance(
  p_equipment_id uuid,
  p_description text,
  p_scheduled_date date,
  p_vendor text DEFAULT NULL,
  p_vendor_phone text DEFAULT NULL,
  p_vendor_location text DEFAULT NULL,
  p_cost numeric DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status text;
BEGIN
  IF NOT public.is_admin_or_founder(auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  SELECT status INTO v_current_status
  FROM equipment
  WHERE id = p_equipment_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Equipment not found';
  END IF;

  INSERT INTO equipment_maintenance(
    equipment_id, description, scheduled_date, vendor, vendor_phone, vendor_location, cost, notes, status
  ) VALUES (
    p_equipment_id, p_description, p_scheduled_date, p_vendor, p_vendor_phone, p_vendor_location, p_cost, p_notes, 'scheduled'
  );

  IF p_scheduled_date <= CURRENT_DATE AND v_current_status = 'available' THEN
    UPDATE equipment SET status = 'maintenance', updated_at = now() WHERE id = p_equipment_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_equipment_maintenance(uuid, text, date, text, text, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_equipment_maintenance(uuid, text, date, text, text, text, numeric, text) TO authenticated;

COMMIT;
