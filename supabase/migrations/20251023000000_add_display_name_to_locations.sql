-- Add display_name column to locations table
-- This allows users to customize how a location name is displayed in the UI
-- while keeping the canonical name unique in the database

ALTER TABLE locations
ADD COLUMN display_name TEXT;

-- Add comment to explain the purpose
COMMENT ON COLUMN locations.display_name IS 'Optional custom display name that overrides the canonical name in the UI. If NULL, the canonical name is used.';
