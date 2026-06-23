-- E5 Chronicles - Feature 1: Invoicing + Expenses + Budgeting
-- Run this in your Supabase SQL editor

-- ============================================================
-- PART 1: New Types
-- ============================================================
create type invoice_status as enum ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled');
create type payment_method as enum ('bank_transfer', 'cash', 'cheque', 'esewa', 'khalti', 'connect_ips', 'other');
create type expense_category as enum ('production', 'post_production', 'talent', 'travel', 'gear_rental', 'props_wardrobe', 'food_catering', 'marketing', 'operational', 'other');
create type expense_status as enum ('pending', 'approved', 'reimbursed', 'rejected');

-- ============================================================
-- PART 2: New Tables
-- ============================================================

-- 2a. Invoices
create table invoices (
  id uuid default uuid_generate_v4() primary key,
  invoice_number text not null unique,
  project_id uuid references projects(id) on delete set null,
  client_id uuid references clients(id) on delete cascade not null,
  title text not null,
  description text,
  amount decimal(12,2) not null,
  tax_rate decimal(5,2) default 0,
  tax_amount decimal(12,2) default 0,
  grand_total decimal(12,2) not null,
  currency text default 'NPR',
  status invoice_status default 'draft',
  issue_date date not null default current_date,
  due_date date not null,
  paid_amount decimal(12,2) default 0,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2b. Invoice line items
create table invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references invoices(id) on delete cascade not null,
  description text not null,
  quantity decimal(10,2) not null default 1,
  unit_price decimal(12,2) not null,
  amount decimal(12,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2c. Payments received against invoices
create table payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references invoices(id) on delete cascade not null,
  amount decimal(12,2) not null,
  payment_date date not null default current_date,
  payment_method payment_method not null,
  reference_number text,
  notes text,
  received_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2d. Expenses
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  category expense_category not null,
  amount decimal(12,2) not null,
  description text not null,
  expense_date date not null default current_date,
  receipt_url text,
  is_billable boolean default true,
  status expense_status default 'pending',
  submitted_by uuid references profiles(id) on delete set null,
  approved_by uuid references profiles(id) on delete set null,
  notes text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2e. Project budgets
create table project_budgets (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null unique,
  budget_amount decimal(12,2) not null,
  contingency_percent decimal(5,2) default 10,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- PART 3: Add columns to existing clients table
-- ============================================================
alter table clients add column if not exists billing_address text;
alter table clients add column if not exists tax_id text;
alter table clients add column if not exists payment_terms text;

-- ============================================================
-- PART 4: Enable RLS on all new tables
-- ============================================================
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table project_budgets enable row level security;

-- ============================================================
-- PART 5: RLS Policies
-- ============================================================

-- Invoices: admins full access, employees can view
create policy "Admins full access on invoices" on invoices for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees can view invoices" on invoices for select
  using (true);

-- Invoice items: admin full, employees view
create policy "Admins full access on invoice_items" on invoice_items for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees can view invoice_items" on invoice_items for select
  using (true);

-- Payments: admins only
create policy "Admins manage payments" on payments for all
  using (auth.uid() in (select id from profiles where role = 'admin'));

-- Expenses: admins full, employees can insert & view own
create policy "Admins full access on expenses" on expenses for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees insert own expenses" on expenses for insert
  with check (auth.uid() = submitted_by);
create policy "Employees view own expenses" on expenses for select
  using (auth.uid() = submitted_by);

-- Project budgets: admins only
create policy "Admins manage project_budgets" on project_budgets for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees view project_budgets" on project_budgets for select
  using (true);

-- ============================================================
-- PART 6: Indexes for performance
-- ============================================================
create index idx_invoices_client_id on invoices(client_id);
create index idx_invoices_status on invoices(status);
create index idx_invoices_issue_date on invoices(issue_date);
create index idx_invoice_items_invoice_id on invoice_items(invoice_id);
create index idx_payments_invoice_id on payments(invoice_id);
create index idx_expenses_project_id on expenses(project_id);
create index idx_expenses_submitted_by on expenses(submitted_by);
create index idx_expenses_status on expenses(status);
create index idx_project_budgets_project_id on project_budgets(project_id);
