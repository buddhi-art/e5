-- Migration 024: Timezone-aware attendance computation (Asia/Kathmandu UTC+5:45)
-- Adds a database function that computes attendance status based on check-in time
-- in the business timezone, and updates the status automatically.
-- Re-runnable: uses CREATE OR REPLACE throughout
SET search_path = public;

-- =============================================================================
-- 1. Timezone-aware attendance status computation
--    Business timezone: Asia/Kathmandu (UTC+5:45)
--    Cutoffs (Nepal Time):
--      - check-in before 10:15 AM → present
--      - check-in between 10:15 AM and 11:00 AM → late
--      - check-in after 11:00 AM → half-day (unless absent override)
--      - no check-in → absent
--    These cutoffs are stored in a small config table so they can be adjusted
--    without code changes.
-- =============================================================================
CREATE TABLE IF NOT EXISTS attendance_config (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton row
    timezone text NOT NULL DEFAULT 'Asia/Kathmandu',
    present_cutoff time NOT NULL DEFAULT '10:15:00',    -- before this = present
    late_cutoff time NOT NULL DEFAULT '11:00:00',       -- before this = late, after = half-day
    updated_at timestamptz DEFAULT now()
);

-- Seed default config if not exists
INSERT INTO attendance_config (id, timezone, present_cutoff, late_cutoff)
VALUES (1, 'Asia/Kathmandu', '10:15:00', '11:00:00')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. Function: compute attendance status from check-in time
--    Returns the appropriate status based on the config cutoffs.
--    If check_in_time is NULL, returns 'absent'.
-- =============================================================================
CREATE OR REPLACE FUNCTION compute_attendance_status(
    p_check_in_time timestamptz,
    p_date date DEFAULT CURRENT_DATE
)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_tz text;
    v_present_cutoff time;
    v_late_cutoff time;
    v_local_time time;
    v_status text;
BEGIN
    -- Get config (use defaults if config table hasn't been created yet)
    SELECT COALESCE(timezone, 'Asia/Kathmandu'),
           COALESCE(present_cutoff, '10:15:00'::time),
           COALESCE(late_cutoff, '11:00:00'::time)
    INTO v_tz, v_present_cutoff, v_late_cutoff
    FROM attendance_config
    WHERE id = 1;

    -- If no check-in, absent
    IF p_check_in_time IS NULL THEN
        RETURN 'absent';
    END IF;

    -- Convert check-in time to business timezone and extract time component
    v_local_time := (p_check_in_time AT TIME ZONE 'UTC' AT TIME ZONE v_tz)::time;

    -- Compare against cutoffs
    IF v_local_time <= v_present_cutoff THEN
        v_status := 'present';
    ELSIF v_local_time <= v_late_cutoff THEN
        v_status := 'late';
    ELSE
        v_status := 'half-day';
    END IF;

    RETURN v_status;
END;
$$;

-- =============================================================================
-- 3. Trigger: auto-set attendance status on check-in
--    When an employee checks in, compute the status from the check-in time
--    in the business timezone.
-- =============================================================================
CREATE OR REPLACE FUNCTION auto_set_attendance_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status text;
BEGIN
    -- Only fire when check_in_time is set (initial insert or update)
    IF TG_OP = 'INSERT' AND NEW.check_in_time IS NOT NULL THEN
        NEW.status := compute_attendance_status(NEW.check_in_time, NEW.date)::attendance_status;
    ELSIF TG_OP = 'UPDATE' AND NEW.check_in_time IS DISTINCT FROM OLD.check_in_time THEN
        -- Only auto-compute if status wasn't manually set
        IF OLD.status IS NULL OR OLD.check_in_time IS NULL THEN
            NEW.status := compute_attendance_status(NEW.check_in_time, NEW.date)::attendance_status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_set_attendance_status ON attendance;

-- Only create the trigger if the attendance table has check_in_time column
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'attendance'
          AND column_name = 'check_in_time'
    ) THEN
        CREATE TRIGGER trg_auto_set_attendance_status
            BEFORE INSERT OR UPDATE OF check_in_time ON attendance
            FOR EACH ROW
            EXECUTE FUNCTION auto_set_attendance_status();
    END IF;
END $$;

-- =============================================================================
-- 4. Function: get business date in Asia/Kathmandu
--    Returns the current date in the business timezone.
-- =============================================================================
CREATE OR REPLACE FUNCTION business_date()
RETURNS date
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_tz text;
BEGIN
    SELECT COALESCE(timezone, 'Asia/Kathmandu')
    INTO v_tz
    FROM attendance_config
    WHERE id = 1;

    RETURN (now() AT TIME ZONE 'UTC' AT TIME ZONE v_tz)::date;
END;
$$;

-- =============================================================================
-- 5. Update attendance helper: fix existing rows that were computed without
--    timezone awareness. Only runs on rows that have check_in_time but status
--    doesn't match the timezone-aware computation.
--    This is a one-time migration aid.
-- =============================================================================
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'attendance'
          AND column_name = 'check_in_time'
    ) THEN
        UPDATE attendance
        SET status = compute_attendance_status(check_in_time, date)::attendance_status
        WHERE check_in_time IS NOT NULL
          AND status IS DISTINCT FROM compute_attendance_status(check_in_time, date)::attendance_status;
    END IF;
END $$;
