-- Rollback Migration 024: Timezone-aware attendance computation
SET search_path = public;

-- 1. Drop trigger and function
DROP TRIGGER IF EXISTS trg_auto_set_attendance_status ON attendance;
DROP FUNCTION IF EXISTS auto_set_attendance_status();
DROP FUNCTION IF EXISTS compute_attendance_status(timestamptz, date);
DROP FUNCTION IF EXISTS business_date();

-- 2. Drop config table
DROP TABLE IF EXISTS attendance_config;
