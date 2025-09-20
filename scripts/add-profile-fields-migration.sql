-- Migration to add missing profile fields
-- Run this script to add the new profile fields to the profiles table

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location JSONB,
ADD COLUMN IF NOT EXISTS communication_preferences JSONB,
ADD COLUMN IF NOT EXISTS cruise_updates_opt_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP;

-- Update existing profiles to have default values for boolean fields
UPDATE profiles
SET cruise_updates_opt_in = false
WHERE cruise_updates_opt_in IS NULL;

UPDATE profiles
SET marketing_emails = false
WHERE marketing_emails IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.phone_number IS 'User phone number for notifications';
COMMENT ON COLUMN profiles.bio IS 'User bio/description';
COMMENT ON COLUMN profiles.location IS 'User location object: {"city": "", "state": "", "country": ""}';
COMMENT ON COLUMN profiles.communication_preferences IS 'Communication preferences: {"email": true, "sms": false}';
COMMENT ON COLUMN profiles.cruise_updates_opt_in IS 'Whether user wants cruise update notifications';
COMMENT ON COLUMN profiles.marketing_emails IS 'Whether user wants marketing emails';
COMMENT ON COLUMN profiles.last_sign_in_at IS 'Last successful sign-in timestamp';