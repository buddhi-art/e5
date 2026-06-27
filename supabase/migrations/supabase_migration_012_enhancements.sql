-- E5 Chronicles - Migration 012: Project Enhancements
-- Invoice discount/advance, vendor fields, client meetings, project dates, dynamic categories

-- ============================================================
-- 1. Add discount and advance_received to invoices
-- ============================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS advance_received NUMERIC(12,2) DEFAULT 0;

-- ============================================================
-- 2. Add start_date and end_date to projects
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;

-- ============================================================
-- 3. Add vendor fields to equipment
-- ============================================================
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS vendor_name TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS vendor_phone TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS vendor_location TEXT;

-- ============================================================
-- 4. Add vendor fields to equipment_maintenance
-- ============================================================
ALTER TABLE equipment_maintenance ADD COLUMN IF NOT EXISTS vendor_phone TEXT;
ALTER TABLE equipment_maintenance ADD COLUMN IF NOT EXISTS vendor_location TEXT;

-- ============================================================
-- 5. Create client_meetings table
-- ============================================================
CREATE TABLE IF NOT EXISTS client_meetings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    location TEXT,
    notes TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE client_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client meetings viewable by admins" ON client_meetings FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can insert meetings" ON client_meetings FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can update meetings" ON client_meetings FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- ============================================================
-- 6. Create expense_categories table
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expense categories viewable by all" ON expense_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON expense_categories FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Insert default categories
INSERT INTO expense_categories (name) VALUES
    ('Production'),
    ('Post Production'),
    ('Talent'),
    ('Travel'),
    ('Gear Rental'),
    ('Props & Wardrobe'),
    ('Food & Catering'),
    ('Marketing'),
    ('Operational'),
    ('Other')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 7. Create equipment_categories table
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment categories viewable by all" ON equipment_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON equipment_categories FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Insert default categories
INSERT INTO equipment_categories (name) VALUES
    ('Camera'),
    ('Lens'),
    ('Light'),
    ('Audio'),
    ('Grip'),
    ('Other')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 8. Create talent_types table for dynamic talent types
-- ============================================================
CREATE TABLE IF NOT EXISTS talent_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE talent_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talent types viewable by all" ON talent_types FOR SELECT USING (true);
CREATE POLICY "Admins can insert talent types" ON talent_types FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Insert default talent types
INSERT INTO talent_types (name) VALUES
    ('model'),
    ('actor'),
    ('voice_artist'),
    ('dancer'),
    ('makeup_artist'),
    ('stylist'),
    ('photographer'),
    ('freelance_editor'),
    ('freelance_videographer'),
    ('sound_engineer'),
    ('colorist'),
    ('motion_designer'),
    ('other')
ON CONFLICT (name) DO NOTHING;
