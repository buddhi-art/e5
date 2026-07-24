-- Migration for Videography Shoot Equipment, Time Taken, Location & Client Meetings
BEGIN;

-- 1. Add equipment, start_time, end_time to package_logistics
ALTER TABLE package_logistics ADD COLUMN IF NOT EXISTS equipments_taken TEXT[] DEFAULT '{}';
ALTER TABLE package_logistics ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE package_logistics ADD COLUMN IF NOT EXISTS end_time TEXT;

-- 2. Add equipment, start_time, end_time, location_address to package_site_visits
ALTER TABLE package_site_visits ADD COLUMN IF NOT EXISTS equipments_taken TEXT[] DEFAULT '{}';
ALTER TABLE package_site_visits ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE package_site_visits ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE package_site_visits ADD COLUMN IF NOT EXISTS location_address TEXT;

COMMIT;
