-- E5 Chronicles - Feature 5: Production Calendar / Timeline View
-- Run this in your Supabase SQL editor

-- ============================================================
-- PART 1: Add start_date to existing tasks table
-- ============================================================
alter table tasks add column if not exists start_date date;
