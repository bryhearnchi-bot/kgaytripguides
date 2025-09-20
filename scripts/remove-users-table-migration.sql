-- Migration: Remove users table and consolidate to profiles table only
-- This migration removes the conflicting users table and updates all foreign key references

BEGIN;

-- Step 1: Update profiles table to include all necessary fields from users table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';

-- Step 2: Update role field in profiles to match standardized roles
UPDATE profiles SET role = 'admin' WHERE role = 'super_admin';
UPDATE profiles SET role = 'content_manager' WHERE role IN ('trip_admin', 'content_editor', 'media_manager');
UPDATE profiles SET role = 'viewer' WHERE role NOT IN ('admin', 'content_manager');

-- Step 3: Drop foreign key constraints that reference users table
ALTER TABLE password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_users_id_fk;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_invited_by_users_id_fk;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_used_by_users_id_fk;
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_created_by_users_id_fk;
ALTER TABLE user_cruises DROP CONSTRAINT IF EXISTS user_cruises_user_id_users_id_fk;
ALTER TABLE user_cruises DROP CONSTRAINT IF EXISTS user_cruises_assigned_by_users_id_fk;
ALTER TABLE party_templates DROP CONSTRAINT IF EXISTS party_templates_created_by_users_id_fk;
ALTER TABLE trip_info_sections DROP CONSTRAINT IF EXISTS trip_info_sections_updated_by_users_id_fk;
ALTER TABLE ai_jobs DROP CONSTRAINT IF EXISTS ai_jobs_created_by_users_id_fk;
ALTER TABLE ai_drafts DROP CONSTRAINT IF EXISTS ai_drafts_created_by_users_id_fk;
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_users_id_fk;
ALTER TABLE media DROP CONSTRAINT IF EXISTS media_uploaded_by_users_id_fk;
ALTER TABLE cruises DROP CONSTRAINT IF EXISTS cruises_created_by_users_id_fk;

-- Step 4: Change user ID columns to TEXT to match profiles.id
ALTER TABLE password_reset_tokens ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE invitations ALTER COLUMN invited_by TYPE TEXT;
ALTER TABLE invitations ALTER COLUMN used_by TYPE TEXT;
ALTER TABLE settings ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE user_cruises ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE user_cruises ALTER COLUMN assigned_by TYPE TEXT;
ALTER TABLE party_templates ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE trip_info_sections ALTER COLUMN updated_by TYPE TEXT;
ALTER TABLE ai_jobs ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE ai_drafts ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE audit_log ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE media ALTER COLUMN uploaded_by TYPE TEXT;
ALTER TABLE cruises ALTER COLUMN created_by TYPE TEXT;

-- Step 5: Add new foreign key constraints to reference profiles table
ALTER TABLE password_reset_tokens ADD CONSTRAINT password_reset_tokens_user_id_profiles_id_fk
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE invitations ADD CONSTRAINT invitations_invited_by_profiles_id_fk
    FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE invitations ADD CONSTRAINT invitations_used_by_profiles_id_fk
    FOREIGN KEY (used_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE settings ADD CONSTRAINT settings_created_by_profiles_id_fk
    FOREIGN KEY (created_by) REFERENCES profiles(id);

ALTER TABLE user_cruises ADD CONSTRAINT user_cruises_user_id_profiles_id_fk
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_cruises ADD CONSTRAINT user_cruises_assigned_by_profiles_id_fk
    FOREIGN KEY (assigned_by) REFERENCES profiles(id);

ALTER TABLE party_templates ADD CONSTRAINT party_templates_created_by_profiles_id_fk
    FOREIGN KEY (created_by) REFERENCES profiles(id);

ALTER TABLE trip_info_sections ADD CONSTRAINT trip_info_sections_updated_by_profiles_id_fk
    FOREIGN KEY (updated_by) REFERENCES profiles(id);

ALTER TABLE ai_jobs ADD CONSTRAINT ai_jobs_created_by_profiles_id_fk
    FOREIGN KEY (created_by) REFERENCES profiles(id);

ALTER TABLE ai_drafts ADD CONSTRAINT ai_drafts_created_by_profiles_id_fk
    FOREIGN KEY (created_by) REFERENCES profiles(id);

ALTER TABLE audit_log ADD CONSTRAINT audit_log_user_id_profiles_id_fk
    FOREIGN KEY (user_id) REFERENCES profiles(id);

ALTER TABLE media ADD CONSTRAINT media_uploaded_by_profiles_id_fk
    FOREIGN KEY (uploaded_by) REFERENCES profiles(id);

ALTER TABLE cruises ADD CONSTRAINT cruises_created_by_profiles_id_fk
    FOREIGN KEY (created_by) REFERENCES profiles(id);

-- Step 6: Drop the users table completely
DROP TABLE IF EXISTS users CASCADE;

COMMIT;