-- Migration: Create Ships as Reusable Entity
-- Purpose: Make ships reusable across multiple cruises
-- Date: 2025-01-16

-- Step 1: Create the ships table
CREATE TABLE IF NOT EXISTS ships (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cruise_line VARCHAR(255) NOT NULL,
    ship_code VARCHAR(50), -- Short code like "VL" for Valiant Lady
    capacity INTEGER, -- Passenger capacity
    crew_size INTEGER, -- Number of crew
    gross_tonnage INTEGER, -- Ship size
    length_meters DECIMAL(10, 2), -- Ship length
    beam_meters DECIMAL(10, 2), -- Ship width
    decks INTEGER, -- Number of decks
    built_year INTEGER, -- Year built
    refurbished_year INTEGER, -- Last refurbishment
    ship_class VARCHAR(100), -- Ship class/series
    flag VARCHAR(100), -- Country of registration
    image_url TEXT, -- Hero image of the ship
    deck_plans JSONB, -- Array of deck plan URLs or data
    amenities JSONB, -- Ship amenities and features
    dining_venues JSONB, -- Dining options on board
    entertainment_venues JSONB, -- Entertainment venues
    stateroom_categories JSONB, -- Room types and counts
    description TEXT, -- Ship description
    highlights JSONB, -- Array of highlight features
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ships_name_idx ON ships(name);
CREATE INDEX IF NOT EXISTS ships_cruise_line_idx ON ships(cruise_line);
CREATE UNIQUE INDEX IF NOT EXISTS ships_name_cruise_line_unique ON ships(name, cruise_line);

-- Step 2: Insert existing ships from cruises table (avoiding duplicates)
INSERT INTO ships (name, cruise_line, created_at, updated_at)
SELECT DISTINCT
    ship_name as name,
    COALESCE(cruise_line, 'Unknown') as cruise_line,
    NOW() as created_at,
    NOW() as updated_at
FROM cruises
WHERE ship_name IS NOT NULL
ON CONFLICT (name, cruise_line) DO NOTHING;

-- Step 3: Add ship_id column to cruises table
ALTER TABLE cruises
ADD COLUMN IF NOT EXISTS ship_id INTEGER REFERENCES ships(id);

-- Step 4: Update cruises table to link to ships
UPDATE cruises c
SET ship_id = s.id
FROM ships s
WHERE c.ship_name = s.name
  AND (c.cruise_line = s.cruise_line OR (c.cruise_line IS NULL AND s.cruise_line = 'Unknown'));

-- Step 5: Create index on the foreign key for performance
CREATE INDEX IF NOT EXISTS cruises_ship_id_idx ON cruises(ship_id);

-- Step 6: Add some sample data for the existing ships
UPDATE ships
SET
    ship_code = 'VL',
    capacity = 2770,
    crew_size = 1160,
    gross_tonnage = 110000,
    length_meters = 278,
    beam_meters = 38,
    decks = 17,
    built_year = 2021,
    ship_class = 'Lady Ships',
    flag = 'Malta',
    description = 'Valiant Lady is the second ship in Virgin Voyages'' fleet, offering adults-only cruising with a focus on wellness, entertainment, and unique dining experiences.',
    highlights = '["Adults-only", "20+ dining options", "Spa & wellness center", "Tattoo parlor at sea", "No buffets", "No formal nights"]'::jsonb,
    amenities = '["The Manor nightclub", "The Red Room theater", "Athletic Club", "Redemption Spa", "The Perch outdoor lounge", "The Dock beach club"]'::jsonb,
    dining_venues = '[
        {"name": "Wake", "type": "Steak & Seafood"},
        {"name": "Razzle Dazzle", "type": "Vegetarian Forward"},
        {"name": "Pink Agave", "type": "Mexican"},
        {"name": "The Test Kitchen", "type": "Experimental"},
        {"name": "Gunbae", "type": "Korean BBQ"},
        {"name": "Extra Virgin", "type": "Italian"}
    ]'::jsonb
WHERE name = 'Valiant Lady' AND cruise_line = 'Virgin Voyages';

UPDATE ships
SET
    ship_code = 'RL',
    capacity = 2770,
    crew_size = 1160,
    gross_tonnage = 110000,
    length_meters = 278,
    beam_meters = 38,
    decks = 17,
    built_year = 2023,
    ship_class = 'Lady Ships',
    flag = 'Malta',
    description = 'Resilient Lady is the third ship in Virgin Voyages'' fleet, continuing the brand''s commitment to sustainable, adults-only cruising with innovative design and experiences.',
    highlights = '["Adults-only", "20+ dining options", "Spa & wellness center", "Sustainability focused", "No single-use plastics", "Female-founded brand"]'::jsonb,
    amenities = '["The Manor nightclub", "The Red Room theater", "Athletic Club", "Redemption Spa", "The Perch outdoor lounge", "The Dock beach club"]'::jsonb,
    dining_venues = '[
        {"name": "Wake", "type": "Steak & Seafood"},
        {"name": "Razzle Dazzle", "type": "Vegetarian Forward"},
        {"name": "Pink Agave", "type": "Mexican"},
        {"name": "The Test Kitchen", "type": "Experimental"},
        {"name": "Gunbae", "type": "Korean BBQ"},
        {"name": "Extra Virgin", "type": "Italian"}
    ]'::jsonb
WHERE name = 'Virgin Resilient Lady' AND cruise_line = 'Virgin Voyages';

-- Note: In Phase 2, we can consider:
-- 1. Dropping ship_name and cruise_line from cruises table (after verifying all data migrated)
-- 2. Making ship_id NOT NULL (after ensuring all cruises have ships)
-- 3. Adding more ship details as needed

-- Verify migration success
SELECT
    'Ships created' as status,
    COUNT(*) as count
FROM ships
UNION ALL
SELECT
    'Cruises linked to ships' as status,
    COUNT(*) as count
FROM cruises
WHERE ship_id IS NOT NULL;