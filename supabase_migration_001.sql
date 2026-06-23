-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joining_date date;

-- Change designation from enum to text so admin can add custom roles
ALTER TABLE profiles ALTER COLUMN designation TYPE text USING designation::text;

-- Drop the old enum type (if it exists and is no longer in use)
DROP TYPE IF EXISTS employee_designation;
