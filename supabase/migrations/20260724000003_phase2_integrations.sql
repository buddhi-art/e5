-- E5 Chronicles - Phase 2 Integrations Migration
-- Adds project comments, client reviews, and asset fields.

BEGIN;

-- 1. Update Projects Table with Asset Links
ALTER TABLE projects ADD COLUMN IF NOT EXISTS raw_footage_link TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brand_assets_link TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_brief_notes TEXT;

-- 2. Project Comments (Unified Thread)
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Client Reviews (External Portal)
CREATE TABLE IF NOT EXISTS client_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token UUID DEFAULT uuid_generate_v4() NOT NULL UNIQUE, -- Secure URL token
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    package_deliverable_id UUID REFERENCES package_deliverables(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_created_at ON project_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_client_reviews_token ON client_reviews(token);
CREATE INDEX IF NOT EXISTS idx_client_reviews_project_id ON client_reviews(project_id);

-- Enable RLS
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reviews ENABLE ROW LEVEL SECURITY;

-- Project Comments Policies
CREATE POLICY "Authenticated users view project comments" ON project_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users insert project comments" ON project_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON project_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON project_comments FOR DELETE USING (auth.uid() = user_id);

-- Client Reviews Policies
CREATE POLICY "Admins and Founders manage client reviews" ON client_reviews FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'));
CREATE POLICY "Authenticated view client reviews" ON client_reviews FOR SELECT USING (auth.role() = 'authenticated');

COMMIT;
