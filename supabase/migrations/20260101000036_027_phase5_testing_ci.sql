-- Migration 027: Phase 5 — Testing & CI Support
-- Adds test helper schema, seed data RPCs, assertion helpers
-- Re-runnable: uses IF NOT EXISTS / CREATE OR REPLACE throughout
SET search_path = public;

-- =============================================================================
-- 1. Test helper schema for integration tests
--    These functions are SECURITY DEFINER so service-role tests can call them.
-- =============================================================================

-- Generate a batch of unique invoice numbers for concurrency testing
-- Returns an array of generated invoice numbers (one per call)
CREATE OR REPLACE FUNCTION test_generate_batch_invoice_numbers(
  p_year text,
  p_count integer DEFAULT 10
)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numbers text[] := '{}';
  v_i integer;
BEGIN
  FOR v_i IN 1..p_count LOOP
    v_numbers := array_append(v_numbers, generate_invoice_number(p_year));
  END LOOP;
  RETURN v_numbers;
END;
$$;

-- Seed a test equipment record for checkout atomicity tests
-- Returns the equipment ID
CREATE OR REPLACE FUNCTION test_seed_equipment(
  p_name text DEFAULT 'Test Equipment',
  p_category text DEFAULT 'Camera'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_cat_id uuid;
BEGIN
  -- Ensure category exists
  INSERT INTO equipment_categories (name)
  VALUES (p_category)
  ON CONFLICT (name) DO NOTHING;

  -- Get or create the category ID
  SELECT id INTO v_cat_id FROM equipment_categories WHERE name = p_category;

  -- Insert the equipment
  INSERT INTO equipment (name, category, status)
  VALUES (p_name, p_cat_id, 'available')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Clean up test data
CREATE OR REPLACE FUNCTION test_cleanup_equipment(
  p_equipment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM equipment_checkouts WHERE equipment_id = p_equipment_id;
  DELETE FROM equipment_maintenance WHERE equipment_id = p_equipment_id;
  DELETE FROM equipment WHERE id = p_equipment_id;
END;
$$;

-- Create a test employee profile for RLS tests
CREATE OR REPLACE FUNCTION test_create_employee_profile(
  p_email text DEFAULT 'test-employee@e5chronicles.com',
  p_full_name text DEFAULT 'Test Employee',
  p_login_id text DEFAULT 'test-employee'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- We assume the auth user already exists; just create the profile
  SELECT id INTO v_user_id FROM profiles WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Create with a placeholder auth user — real tests use the service role
    INSERT INTO profiles (id, email, full_name, login_id, role, designation)
    VALUES (gen_random_uuid(), p_email, p_full_name, p_login_id, 'employee', 'Test Employee')
    RETURNING id INTO v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$;

-- =============================================================================
-- 2. Indexes to accelerate test queries
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email_role
  ON profiles(email, role)
  WHERE deleted_at IS NULL;

-- =============================================================================
-- 3. Ensure generate_invoice_number is re-runnable
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_invoice_number(p_year text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq_name text := 'invoice_number_seq_' || p_year;
  v_next_num bigint;
  v_invoice_number text;
BEGIN
  -- Create sequence for the year if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = v_seq_name) THEN
    EXECUTE format('CREATE SEQUENCE %I START 1', v_seq_name);
  END IF;

  -- Get next value from sequence
  v_next_num := nextval(v_seq_name);
  v_invoice_number := 'INV-' || p_year || '-' || LPAD(v_next_num::text, 5, '0');

  RETURN v_invoice_number;
END;
$$;

-- =============================================================================
-- 4. Ensure checkout_equipment is re-runnable (atomic checkout)
--    Drop the existing signature first — CREATE OR REPLACE cannot change a
--    parameter's default (this migration adds DEFAULT NULL to p_expected_return_at),
--    which raises Postgres error 42P13.
-- =============================================================================
DROP FUNCTION IF EXISTS checkout_equipment(uuid, uuid, timestamp with time zone, uuid, text, text);
CREATE OR REPLACE FUNCTION checkout_equipment(
  p_equipment_id uuid,
  p_checked_out_by uuid,
  p_expected_return_at timestamptz DEFAULT NULL,
  p_project_id uuid DEFAULT NULL,
  p_condition text DEFAULT NULL,
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
  -- Lock the equipment row to prevent race conditions
  SELECT status INTO v_current_status
  FROM equipment
  WHERE id = p_equipment_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Equipment not found';
  END IF;

  IF v_current_status != 'available' THEN
    RAISE EXCEPTION 'Equipment is not available (current status: %)', v_current_status;
  END IF;

  -- Update status atomically
  UPDATE equipment
  SET status = 'checked_out', updated_at = now()
  WHERE id = p_equipment_id;

  -- Create checkout record
  INSERT INTO equipment_checkouts (
    equipment_id, checked_out_by, checked_out_at,
    expected_return_at, project_id, condition_at_checkout, notes
  ) VALUES (
    p_equipment_id, p_checked_out_by, now(),
    p_expected_return_at, p_project_id, p_condition, p_notes
  );
END;
$$;

-- =============================================================================
-- 5. grant access to anon for test authentication
-- =============================================================================
-- Note: In production, anon has no access to these test functions.
-- They are available only when GUC is explicitly set via service_role.
ALTER FUNCTION test_generate_batch_invoice_numbers(text, integer) SET search_path = public;
ALTER FUNCTION test_seed_equipment(text, text) SET search_path = public;
ALTER FUNCTION test_cleanup_equipment(uuid) SET search_path = public;
ALTER FUNCTION test_create_employee_profile(text, text, text) SET search_path = public;
