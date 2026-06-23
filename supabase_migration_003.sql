-- Add contact_email column (separate from the login/email used for auth)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email text;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_email text;

CREATE TABLE IF NOT EXISTS company_natures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS referral_sources (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE company_natures ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on company_natures" ON company_natures FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access on referral_sources" ON referral_sources FOR ALL TO authenticated USING (true);

-- Employee Profile Updates
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cv_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_urls jsonb default '{}'::jsonb;

-- Change designation to text to allow custom values
ALTER TABLE profiles ALTER COLUMN designation TYPE text USING designation::text;

CREATE TABLE IF NOT EXISTS designations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access on designations" ON designations FOR ALL TO authenticated USING (true);

-- Insert default designations
INSERT INTO designations (name) VALUES 
('Administration'),
('Scripting'),
('Videography'),
('Editing'),
('Model/Actor')
ON CONFLICT (name) DO NOTHING;
