-- Remove JSONB columns from ships table
-- Migration: Phase 1 - Clean up ships table by removing old JSONB fields
-- These are being replaced by junction table relationships

-- Remove the amenities JSONB column (replaced by ship_amenities junction table)
ALTER TABLE ships DROP COLUMN IF EXISTS amenities;

-- Remove the dining_venues JSONB column (replaced by ship_venues junction table)
ALTER TABLE ships DROP COLUMN IF EXISTS dining_venues;

-- Remove the entertainment_venues JSONB column (replaced by ship_venues junction table)
ALTER TABLE ships DROP COLUMN IF EXISTS entertainment_venues;

-- Ships table is now clean with only proper relational fields:
-- id, name, cruise_line, capacity, decks, image_url, description, deck_plans_url, created_at, updated_at
-- Amenities and venues are now properly normalized in separate tables with junction tables