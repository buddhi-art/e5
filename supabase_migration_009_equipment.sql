-- E5 Chronicles - Feature 4: Equipment & Asset Management
-- Run this in your Supabase SQL editor

-- ============================================================
-- PART 1: New Types
-- ============================================================
create type equipment_status as enum ('available', 'checked_out', 'maintenance', 'retired');
create type maintenance_status as enum ('scheduled', 'in_progress', 'completed');

-- ============================================================
-- PART 2: New Tables
-- ============================================================

-- 2a. Equipment
create table equipment (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  brand text,
  model text,
  serial_number text unique,
  category text not null,
  purchase_date date,
  purchase_price decimal(10,2),
  current_value decimal(10,2),
  status equipment_status default 'available',
  location text,
  notes text,
  image_url text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2b. Equipment checkouts
create table equipment_checkouts (
  id uuid default uuid_generate_v4() primary key,
  equipment_id uuid references equipment(id) on delete cascade not null,
  checked_out_by uuid references profiles(id) on delete cascade not null,
  checked_out_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expected_return_at timestamp with time zone,
  project_id uuid references projects(id) on delete set null,
  condition_at_checkout text,
  checked_in_at timestamp with time zone,
  condition_at_checkin text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2c. Equipment maintenance
create table equipment_maintenance (
  id uuid default uuid_generate_v4() primary key,
  equipment_id uuid references equipment(id) on delete cascade not null,
  description text not null,
  scheduled_date date not null,
  completed_date date,
  cost decimal(10,2),
  vendor text,
  status maintenance_status default 'scheduled',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- PART 4: Enable RLS
-- ============================================================
alter table equipment enable row level security;
alter table equipment_checkouts enable row level security;
alter table equipment_maintenance enable row level security;

-- ============================================================
-- PART 5: RLS Policies
-- ============================================================

-- Equipment
create policy "Admins manage equipment" on equipment for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees view equipment" on equipment for select using (true);

-- Equipment checkouts
create policy "Admins manage checkouts" on equipment_checkouts for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees view their checkouts" on equipment_checkouts for select
  using (auth.uid() = checked_out_by OR auth.uid() in (select id from profiles where role = 'admin'));

-- Equipment maintenance
create policy "Admins manage maintenance" on equipment_maintenance for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees view maintenance" on equipment_maintenance for select using (true);

-- ============================================================
-- PART 6: Indexes
-- ============================================================
create index idx_equipment_category on equipment(category);
create index idx_equipment_status on equipment(status);
create index idx_equipment_checkouts_equip on equipment_checkouts(equipment_id);
create index idx_equipment_checkouts_user on equipment_checkouts(checked_out_by);
create index idx_equipment_maintenance_equip on equipment_maintenance(equipment_id);
