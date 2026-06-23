-- E5 Chronicles Supabase Schema

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
create type user_role as enum ('admin', 'employee');
create type employee_designation as enum ('administration', 'scripting', 'videography', 'editing', 'model/actor');

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role default 'employee',
  designation employee_designation,
  full_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Clients Table
create table clients (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  nature_of_company text,
  contact_person text,
  social_urls jsonb default '{}'::jsonb, -- e.g., {"tiktok": "url", "facebook": "url"}
  phone_number text,
  logo_url text,
  location text,
  status text default 'active', -- active, potential, past
  referral_source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Projects Table
create type project_status as enum ('not_started', 'in_progress', 'completed', 'on_hold');

create table projects (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  title text not null,
  status project_status default 'not_started',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tasks Table
create type production_phase as enum ('Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5');
create type task_status as enum ('pending', 'in_progress', 'completed');

create table tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  phase production_phase not null,
  assigned_to uuid references profiles(id) on delete set null,
  title text not null,
  description text,
  deadline timestamp with time zone,
  status task_status default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Comments Table (Admin comments on tasks)
create table comments (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Attendance Table
create type attendance_status as enum ('present', 'absent', 'late', 'half-day');

create table attendance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null default current_date,
  status attendance_status not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date) -- One attendance record per user per day
);

-- RLS (Row Level Security) Policies

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table attendance enable row level security;

-- Profiles: Admins can read all, Employees can read all (to see names), everyone can update their own
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Admins can update all profiles" on profiles for update using (
  auth.uid() in (select id from profiles where role = 'admin')
);

-- Clients: Admins can do everything, employees can only read
create policy "Clients viewable by everyone" on clients for select using (true);
create policy "Admins can insert clients" on clients for insert with check (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can update clients" on clients for update using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can delete clients" on clients for delete using (auth.uid() in (select id from profiles where role = 'admin'));

-- Projects: Admins can do everything, employees can only read
create policy "Projects viewable by everyone" on projects for select using (true);
create policy "Admins can insert projects" on projects for insert with check (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can update projects" on projects for update using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can delete projects" on projects for delete using (auth.uid() in (select id from profiles where role = 'admin'));

-- Tasks: Admins can do everything, employees can read all and update their own assigned tasks
create policy "Tasks viewable by everyone" on tasks for select using (true);
create policy "Admins can insert tasks" on tasks for insert with check (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can update all tasks" on tasks for update using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees can update their assigned tasks" on tasks for update using (auth.uid() = assigned_to);
create policy "Admins can delete tasks" on tasks for delete using (auth.uid() in (select id from profiles where role = 'admin'));

-- Comments: Admins can do everything, employees can read
create policy "Comments viewable by everyone" on comments for select using (true);
create policy "Admins can insert comments" on comments for insert with check (auth.uid() in (select id from profiles where role = 'admin'));

-- Attendance: Admins can view all, employees can view their own and insert their own
create policy "Attendance viewable by admins" on attendance for select using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees can view own attendance" on attendance for select using (auth.uid() = user_id);
create policy "Employees can insert own attendance" on attendance for insert with check (auth.uid() = user_id);
create policy "Admins can update attendance" on attendance for update using (auth.uid() in (select id from profiles where role = 'admin'));

-- Function to handle new user creation and profile generation automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New User'), 'employee');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
