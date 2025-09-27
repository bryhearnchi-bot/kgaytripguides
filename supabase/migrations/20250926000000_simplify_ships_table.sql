-- Remove unnecessary fields from ships table
-- Migration: Simplify ships table to essential fields only

-- Drop columns that are no longer needed
ALTER TABLE ships DROP COLUMN IF EXISTS ship_code;
ALTER TABLE ships DROP COLUMN IF EXISTS crew_size;
ALTER TABLE ships DROP COLUMN IF EXISTS gross_tonnage;
ALTER TABLE ships DROP COLUMN IF EXISTS length_meters;
ALTER TABLE ships DROP COLUMN IF EXISTS beam_meters;
ALTER TABLE ships DROP COLUMN IF EXISTS built_year;
ALTER TABLE ships DROP COLUMN IF EXISTS refurbished_year;
ALTER TABLE ships DROP COLUMN IF EXISTS ship_class;
ALTER TABLE ships DROP COLUMN IF EXISTS flag;
ALTER TABLE ships DROP COLUMN IF EXISTS stateroom_categories;
ALTER TABLE ships DROP COLUMN IF EXISTS highlights;

-- Keep only essential fields:
-- id, name, cruise_line, capacity, decks, image_url, description,
-- deck_plans, amenities, dining_venues, entertainment_venues,
-- created_at, updated_at