-- Migration: Add location attractions and LGBT venues tables
-- Date: 2025-10-12

-- Create location_attractions table
CREATE TABLE IF NOT EXISTS location_attractions (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- e.g., "Historical", "Cultural", "Nature", "Entertainment"
  image_url TEXT,
  website_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create location_lgbt_venues table
CREATE TABLE IF NOT EXISTS location_lgbt_venues (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  venue_type VARCHAR(100), -- e.g., "Bar", "Club", "Restaurant", "Hotel", "Beach"
  description TEXT,
  address TEXT,
  image_url TEXT,
  website_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_location_attractions_location_id ON location_attractions(location_id);
CREATE INDEX IF NOT EXISTS idx_location_lgbt_venues_location_id ON location_lgbt_venues(location_id);
CREATE INDEX IF NOT EXISTS idx_location_attractions_order ON location_attractions(location_id, order_index);
CREATE INDEX IF NOT EXISTS idx_location_lgbt_venues_order ON location_lgbt_venues(location_id, order_index);

-- Add RLS policies for location_attractions
ALTER TABLE location_attractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to location_attractions"
  ON location_attractions FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage location_attractions"
  ON location_attractions FOR ALL
  USING (auth.role() = 'authenticated');

-- Add RLS policies for location_lgbt_venues
ALTER TABLE location_lgbt_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to location_lgbt_venues"
  ON location_lgbt_venues FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage location_lgbt_venues"
  ON location_lgbt_venues FOR ALL
  USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE location_attractions IS 'Top attractions and points of interest for each location';
COMMENT ON TABLE location_lgbt_venues IS 'LGBT-friendly venues (bars, clubs, restaurants, etc.) for each location';
COMMENT ON COLUMN location_attractions.category IS 'Categories: Historical, Cultural, Nature, Entertainment, Shopping, Dining';
COMMENT ON COLUMN location_lgbt_venues.venue_type IS 'Types: Bar, Club, Restaurant, Hotel, Beach, Cafe, Theater';
