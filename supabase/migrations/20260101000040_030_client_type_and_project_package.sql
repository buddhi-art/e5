-- Migration 030: Client type (Personal/Company) + Project package selection

-- 1. Distinguish Personal vs Company clients.
--    company_name stays NOT NULL and is used everywhere as the display name:
--    for a Personal client it holds the individual's Name, for a Company it holds the Company Name.
alter table clients add column if not exists client_type text not null default 'company';

alter table clients
  drop constraint if exists clients_client_type_check;
alter table clients
  add constraint clients_client_type_check check (client_type in ('personal', 'company'));

-- Company-only "Frequent Contact Person" details.
alter table clients add column if not exists frequent_contact_person text;
alter table clients add column if not exists frequent_contact_number text;

-- 2. Project package / service tier.
alter table projects add column if not exists package text;

alter table projects
  drop constraint if exists projects_package_check;
alter table projects
  add constraint projects_package_check
  check (package is null or package in ('basic', 'medium', 'pro', 'ultimate'));