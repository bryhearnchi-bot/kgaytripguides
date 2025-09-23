-- Migration: Rename cruise terminology to trip terminology
-- This migration is safe and can be run on production without data loss

-- 1. Rename column cruise_updates_opt_in to trip_updates_opt_in in profiles table
ALTER TABLE profiles
RENAME COLUMN cruise_updates_opt_in TO trip_updates_opt_in;

-- 2. Rename index cruise_talent_talent_idx to trip_talent_talent_idx
-- First, drop the old index if it exists
DROP INDEX IF EXISTS cruise_talent_talent_idx;

-- Create the new index with the correct name
CREATE INDEX IF NOT EXISTS trip_talent_talent_idx
ON trip_talent (talent_id);

-- Add a comment to document the change
COMMENT ON COLUMN profiles.trip_updates_opt_in IS 'Whether the user has opted in to receive trip-related updates';

-- Verify the changes (these are informational queries, won't affect the migration)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name = 'trip_updates_opt_in';

-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'trip_talent' AND indexname = 'trip_talent_talent_idx';