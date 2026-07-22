-- Atomic talent booking migration
-- This migration adds database-level protection against double-booking

BEGIN;

-- 1. Create atomic booking function
CREATE OR REPLACE FUNCTION atomic_talent_booking(
    p_talent_id uuid,
    p_project_id uuid,
    p_booking_date date,
    p_end_date date,
    p_rate_type text,
    p_rate_amount numeric,
    p_description text,
    p_location text,
    p_notes text,
    p_booked_by uuid
) RETURNS uuid AS $$
DECLARE
    v_total_compensation numeric;
    v_days integer;
    v_booking_id uuid;
    v_end_date date;
BEGIN
    -- Lock the talent row to prevent concurrent bookings
    PERFORM 1 FROM talents WHERE id = p_talent_id FOR UPDATE;

    -- Set end date to booking date if not provided
    v_end_date := COALESCE(p_end_date, p_booking_date);

    -- Check for existing bookings in the same date range
    IF EXISTS (
        SELECT 1 FROM talent_bookings
        WHERE talent_id = p_talent_id
        AND status IN ('proposed', 'confirmed')
        AND booking_date <= v_end_date
        AND end_date >= p_booking_date
    ) THEN
        RAISE EXCEPTION 'Talent is already booked for these dates';
    END IF;

    -- Calculate total compensation
    IF p_rate_type = 'per_day' AND p_end_date IS NOT NULL THEN
        v_days := GREATEST(1, p_end_date - p_booking_date + 1);
        v_total_compensation := p_rate_amount * v_days;
    ELSE
        v_total_compensation := p_rate_amount;
    END IF;

    -- Insert the booking
    INSERT INTO talent_bookings (
        talent_id, project_id, booking_date, end_date,
        rate_type, rate_amount, total_compensation,
        description, location, notes, booked_by, status
    ) VALUES (
        p_talent_id, p_project_id, p_booking_date, p_end_date,
        p_rate_type, p_rate_amount, v_total_compensation,
        p_description, p_location, p_notes, p_booked_by, 'proposed'
    ) RETURNING id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add index for faster availability checks
CREATE INDEX IF NOT EXISTS idx_talent_bookings_availability ON talent_bookings (talent_id, booking_date, end_date)
WHERE status IN ('proposed', 'confirmed');

-- 3. Add exclusion constraint as additional protection
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Simplified exclusion constraint that doesn't use COALESCE in the index expression
-- This handles date ranges (multi-day bookings)
ALTER TABLE talent_bookings ADD CONSTRAINT no_overlapping_date_range_bookings
EXCLUDE USING gist (
    talent_id WITH =,
    tsrange(booking_date, end_date, '[)') WITH &&
)
WHERE (status IN ('proposed', 'confirmed') AND end_date IS NOT NULL);

-- Add a separate constraint for single-day bookings
ALTER TABLE talent_bookings ADD CONSTRAINT no_overlapping_single_day_bookings
EXCLUDE USING gist (
    talent_id WITH =,
    tsrange(booking_date, booking_date + 1, '[)') WITH &&
)
WHERE (status IN ('proposed', 'confirmed') AND end_date IS NULL);

COMMIT;