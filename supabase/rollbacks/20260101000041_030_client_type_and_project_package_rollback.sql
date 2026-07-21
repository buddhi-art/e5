-- Rollback Migration 030: Client type (Personal/Company) + Project package selection
SET search_path = public;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_package_check;
ALTER TABLE projects DROP COLUMN IF EXISTS package;

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_client_type_check;
ALTER TABLE clients DROP COLUMN IF EXISTS frequent_contact_number;
ALTER TABLE clients DROP COLUMN IF EXISTS frequent_contact_person;
ALTER TABLE clients DROP COLUMN IF EXISTS client_type;
