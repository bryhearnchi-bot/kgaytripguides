-- Create resorts table
-- Migration: Phase 1 - Resorts structure (parallel to ships)

-- Create resorts table (no dependencies on new tables)
CREATE TABLE resorts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL, -- City, Country
  capacity INTEGER, -- Guest capacity
  room_count INTEGER, -- Number of rooms
  image_url TEXT, -- Hero image of the resort
  description TEXT, -- Resort description
  property_map_url TEXT, -- URL to property map (similar to deck plans)
  check_in_time TEXT, -- e.g., "15:00"
  check_out_time TEXT, -- e.g., "11:00"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX resorts_name_idx ON resorts(name);
CREATE INDEX resorts_location_idx ON resorts(location);
CREATE UNIQUE INDEX resorts_name_location_unique ON resorts(name, location);