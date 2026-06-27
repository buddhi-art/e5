-- LEAVE TYPES
create table leave_types (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  is_paid boolean default true,
  default_days_per_year integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into leave_types (name, description, is_paid, default_days_per_year) values
  ('Sick Leave', 'Medical and health-related leave', true, 12),
  ('Casual Leave', 'Urgent personal matters', true, 6),
  ('Annual Leave', 'Planned vacation / time off', true, 15),
  ('Unpaid Leave', 'Leave without pay', false, 0);

-- LEAVE BALANCES
create table leave_balances (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  leave_type_id uuid references leave_types(id) on delete cascade not null,
  total_days decimal(5,2) not null,
  used_days decimal(5,2) not null default 0,
  remaining_days decimal(5,2) generated always as (total_days - used_days) stored,
  year integer not null,
  unique(user_id, leave_type_id, year)
);

-- LEAVE REQUESTS
create type leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table leave_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  leave_type_id uuid references leave_types(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  total_days decimal(5,2) not null,
  reason text not null,
  status leave_status default 'pending',
  reviewed_by uuid references profiles(id) on delete set null,
  review_notes text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- HOLIDAYS
create table holidays (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  date date not null,
  is_recurring boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(date)
);

-- RLS
alter table leave_types enable row level security;
create policy "Leave types viewable by all" on leave_types for select using (true);
create policy "Admins manage leave types" on leave_types for all
  using (auth.uid() in (select id from profiles where role = 'admin'));

alter table leave_balances enable row level security;
create policy "Admins manage balances" on leave_balances for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees view own balance" on leave_balances for select
  using (auth.uid() = user_id);

alter table leave_requests enable row level security;
create policy "Admins manage all leave requests" on leave_requests for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees view own requests" on leave_requests for select
  using (auth.uid() = user_id);
create policy "Employees insert own requests" on leave_requests for insert
  with check (auth.uid() = user_id);
create policy "Employees cancel own pending" on leave_requests for update
  using (auth.uid() = user_id AND status = 'pending');

alter table holidays enable row level security;
create policy "Holidays viewable by all" on holidays for select using (true);
create policy "Admins manage holidays" on holidays for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
