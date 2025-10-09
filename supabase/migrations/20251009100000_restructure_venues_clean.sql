-- Clean Venue Restructuring Migration
-- Removes old venue structure and creates new ship_venues and resort_venues tables
-- Data will be recreated manually - clean slate approach

-- Step 1: Drop all foreign key constraints on events table that reference venues
ALTER TABLE events DROP COLUMN IF EXISTS venue_id;

-- Step 2: Drop old junction tables (these were many-to-many, we don't need them anymore)
DROP TABLE IF EXISTS ship_venues CASCADE;
DROP TABLE IF EXISTS resort_venues CASCADE;
DROP TABLE IF EXISTS trip_venues CASCADE;

-- Step 3: Drop the global venues table (we're replacing this with individualized tables)
DROP TABLE IF EXISTS venues CASCADE;

-- Step 4: Create new ship_venues table (individualized - each ship has its own venues)
CREATE TABLE ship_venues (
  id SERIAL PRIMARY KEY,
  ship_id INTEGER NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  venue_type_id INTEGER NOT NULL REFERENCES venue_types(id) ON DELETE RESTRICT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Create new resort_venues table (individualized - each resort has its own venues)
CREATE TABLE resort_venues (
  id SERIAL PRIMARY KEY,
  resort_id INTEGER NOT NULL REFERENCES resorts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  venue_type_id INTEGER NOT NULL REFERENCES venue_types(id) ON DELETE RESTRICT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 6: Add new venue columns to events table
-- Events will use ship_venue_id for cruise trips, resort_venue_id for resort trips
ALTER TABLE events ADD COLUMN ship_venue_id INTEGER REFERENCES ship_venues(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN resort_venue_id INTEGER REFERENCES resort_venues(id) ON DELETE SET NULL;

-- Step 7: Add comment to explain the new structure
COMMENT ON TABLE ship_venues IS 'Venues that belong to specific ships. Each ship has its own venue list.';
COMMENT ON TABLE resort_venues IS 'Venues that belong to specific resorts. Each resort has its own venue list.';
COMMENT ON COLUMN events.ship_venue_id IS 'Reference to ship_venues table - used for cruise trip events';
COMMENT ON COLUMN events.resort_venue_id IS 'Reference to resort_venues table - used for resort trip events';

-- Step 8: Create indexes for performance
CREATE INDEX ship_venues_ship_id_idx ON ship_venues(ship_id);
CREATE INDEX ship_venues_venue_type_id_idx ON ship_venues(venue_type_id);
CREATE INDEX ship_venues_name_idx ON ship_venues(name);

CREATE INDEX resort_venues_resort_id_idx ON resort_venues(resort_id);
CREATE INDEX resort_venues_venue_type_id_idx ON resort_venues(venue_type_id);
CREATE INDEX resort_venues_name_idx ON resort_venues(name);

CREATE INDEX events_ship_venue_id_idx ON events(ship_venue_id);
CREATE INDEX events_resort_venue_id_idx ON events(resort_venue_id);

-- Note: venue_types table remains unchanged - it's still needed for categorization
