-- Migration 015: Add day_summary to attendance, remove timesheets

-- 1. Add day_summary column to attendance
alter table attendance add column if not exists day_summary text;

-- 2. Drop timesheets table and related objects
drop table if exists timesheet_entries cascade;
drop table if exists timesheets cascade;
drop type if exists timesheet_status;
