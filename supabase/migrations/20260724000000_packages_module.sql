-- E5 Chronicles - Migration 032: Packages & Invoice Management System
-- Database tables, indexes, constraints and RLS policies for package management

BEGIN;

-- 1. Main Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_number TEXT NOT NULL UNIQUE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    preset_template TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
    payment_method TEXT DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash', 'qr_code', 'cheque', 'esewa', 'khalti', 'other')),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Package Line Items
CREATE TABLE IF NOT EXISTS package_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Package Logistics & On-Site Revision Tracker
CREATE TABLE IF NOT EXISTS package_logistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL UNIQUE,
    revision_count INT NOT NULL DEFAULT 0,
    location_address TEXT,
    shoot_date DATE,
    assigned_staff_ids UUID[] DEFAULT '{}',
    vehicles_taken TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Package Site Visit History Log
CREATE TABLE IF NOT EXISTS package_site_visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    staff_ids UUID[] DEFAULT '{}',
    reason TEXT NOT NULL,
    logged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Package Post-Production Metadata
CREATE TABLE IF NOT EXISTS package_post_prod (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL UNIQUE,
    assigned_editor_ids UUID[] DEFAULT '{}',
    deliverable_links TEXT,
    client_revision_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Package Deliverables Checklist
CREATE TABLE IF NOT EXISTS package_deliverables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_editing', 'client_review', 'approved')),
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Package Payments Received
CREATE TABLE IF NOT EXISTS package_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
    notes TEXT,
    received_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Package Activity Audit Trail
CREATE TABLE IF NOT EXISTS package_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_packages_client_id ON packages(client_id);
CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_deleted_at ON packages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_package_deliverables_package_id ON package_deliverables(package_id);
CREATE INDEX IF NOT EXISTS idx_package_payments_package_id ON package_payments(package_id);

-- Enable RLS on all new tables
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_post_prod ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Admins and founders full access on packages" ON packages;
DROP POLICY IF EXISTS "Authenticated users view active packages" ON packages;
DROP POLICY IF EXISTS "Admins and founders manage package_items" ON package_items;
DROP POLICY IF EXISTS "Authenticated users view package_items" ON package_items;
DROP POLICY IF EXISTS "Admins and founders manage package_logistics" ON package_logistics;
DROP POLICY IF EXISTS "Authenticated users view package_logistics" ON package_logistics;
DROP POLICY IF EXISTS "Admins and founders manage package_site_visits" ON package_site_visits;
DROP POLICY IF EXISTS "Authenticated users view package_site_visits" ON package_site_visits;
DROP POLICY IF EXISTS "Admins and founders manage package_post_prod" ON package_post_prod;
DROP POLICY IF EXISTS "Authenticated users view package_post_prod" ON package_post_prod;
DROP POLICY IF EXISTS "Admins and founders manage package_deliverables" ON package_deliverables;
DROP POLICY IF EXISTS "Authenticated users view package_deliverables" ON package_deliverables;
DROP POLICY IF EXISTS "Admins and founders manage package_payments" ON package_payments;
DROP POLICY IF EXISTS "Authenticated users view package_payments" ON package_payments;
DROP POLICY IF EXISTS "Admins and founders manage package_audit_logs" ON package_audit_logs;
DROP POLICY IF EXISTS "Authenticated users view package_audit_logs" ON package_audit_logs;

-- Policies for packages table
CREATE POLICY "Admins and founders full access on packages" ON packages FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'));

CREATE POLICY "Authenticated users view active packages" ON packages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policies for child tables
CREATE POLICY "Admins and founders manage package_items" ON package_items FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'));
CREATE POLICY "Authenticated users view package_items" ON package_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and founders manage package_logistics" ON package_logistics FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'));
CREATE POLICY "Authenticated users view package_logistics" ON package_logistics FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and founders manage package_site_visits" ON package_site_visits FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'));
CREATE POLICY "Authenticated users view package_site_visits" ON package_site_visits FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and founders manage package_post_prod" ON package_post_prod FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'));
CREATE POLICY "Authenticated users view package_post_prod" ON package_post_prod FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and founders manage package_deliverables" ON package_deliverables FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'));
CREATE POLICY "Authenticated users view package_deliverables" ON package_deliverables FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and founders manage package_payments" ON package_payments FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'));
CREATE POLICY "Authenticated users view package_payments" ON package_payments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and founders manage package_audit_logs" ON package_audit_logs FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'));
CREATE POLICY "Authenticated users view package_audit_logs" ON package_audit_logs FOR SELECT
  USING (auth.role() = 'authenticated');

COMMIT;
