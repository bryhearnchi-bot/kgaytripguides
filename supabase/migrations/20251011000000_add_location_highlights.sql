-- Add top attractions and LGBT venues to locations table
-- Migration: 20251011000000_add_location_highlights.sql

-- Add JSONB columns for location highlights
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS top_attractions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS top_lgbt_venues JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN locations.top_attractions IS 'Array of top 3 tourist attractions for this location';
COMMENT ON COLUMN locations.top_lgbt_venues IS 'Array of top 3 LGBT+/gay bars or venues for this location';
