-- Migration: Remove description column from amenities table
-- Date: 2025-10-07
-- Description: Amenities only need name, not description

-- Drop the description column
ALTER TABLE amenities DROP COLUMN IF EXISTS description;

-- Add comment to table
COMMENT ON TABLE amenities IS 'Lookup table for amenity names. Amenities are reusable across resorts and ships.';
