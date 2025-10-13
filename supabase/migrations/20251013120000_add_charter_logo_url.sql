-- Add logo_url column to charter_companies table
-- Storage path: images/charters/

ALTER TABLE charter_companies
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN charter_companies.logo_url IS 'URL to charter company logo stored in Supabase storage at images/charters/';
