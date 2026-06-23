-- E5 Chronicles - Feature 6: Talent / Freelancer Database
-- Run this in your Supabase SQL editor

-- ============================================================
-- PART 1: New Types
-- ============================================================
create type talent_type as enum (
  'model', 'actor', 'voice_artist', 'dancer', 'makeup_artist',
  'stylist', 'photographer', 'freelance_editor', 'freelance_videographer',
  'sound_engineer', 'colorist', 'motion_designer', 'other'
);
create type talent_gender as enum ('male', 'female', 'other');
create type booking_status as enum ('proposed', 'confirmed', 'completed', 'cancelled');

-- ============================================================
-- PART 2: New Tables
-- ============================================================

-- 2a. Talents
create table talents (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  stage_name text,
  talent_type talent_type not null,
  phone_number text,
  email text,
  gender talent_gender,
  date_of_birth date,
  location text,
  height_cm numeric(5,1),
  languages text[],
  skills text[],
  rate_type text not null default 'per_project',
  rate_amount decimal(10,2),
  currency text default 'NPR',
  portfolio_urls jsonb default '{}'::jsonb,
  photo_url text,
  notes text,
  is_active boolean default true,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2b. Talent bookings
create table talent_bookings (
  id uuid default uuid_generate_v4() primary key,
  talent_id uuid references talents(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  booking_date date not null,
  end_date date,
  rate_type text not null,
  rate_amount decimal(10,2) not null,
  total_compensation decimal(10,2) not null,
  status booking_status default 'proposed',
  description text,
  location text,
  notes text,
  booked_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2c. Talent project history
create table talent_project_history (
  id uuid default uuid_generate_v4() primary key,
  talent_id uuid references talents(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  role text not null,
  feedback text,
  rating integer check (rating between 1 and 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(talent_id, project_id)
);

-- ============================================================
-- PART 4: Enable RLS
-- ============================================================
alter table talents enable row level security;
alter table talent_bookings enable row level security;
alter table talent_project_history enable row level security;

-- ============================================================
-- PART 5: RLS Policies
-- ============================================================

-- Talents
create policy "Admins manage talents" on talents for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees view talents" on talents for select using (true);

-- Talent bookings
create policy "Admins manage bookings" on talent_bookings for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees view bookings" on talent_bookings for select using (true);

-- Talent project history
create policy "History viewable by all" on talent_project_history for select using (true);
create policy "Admins manage history" on talent_project_history for all
  using (auth.uid() in (select id from profiles where role = 'admin'));

-- ============================================================
-- PART 6: Indexes
-- ============================================================
create index idx_talents_type on talents(talent_type);
create index idx_talents_active on talents(is_active);
create index idx_talent_bookings_talent on talent_bookings(talent_id);
create index idx_talent_bookings_status on talent_bookings(status);
create index idx_talent_project_history_talent on talent_project_history(talent_id);
