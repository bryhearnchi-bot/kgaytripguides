-- Create venue_types, amenities, and venues tables
-- Migration: Phase 1 - Core venue and amenity structure

-- Create venue_types table (no dependencies)
CREATE TABLE venue_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial venue types
INSERT INTO venue_types (name) VALUES
  ('dining'),
  ('entertainment'),
  ('bars'),
  ('spa'),
  ('recreation');

-- Create amenities table (no dependencies)
CREATE TABLE amenities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create venues table (depends on venue_types)
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  venue_type_id INTEGER NOT NULL REFERENCES venue_types(id) ON DELETE RESTRICT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX venues_venue_type_id_idx ON venues(venue_type_id);
CREATE INDEX amenities_name_idx ON amenities(name);
CREATE INDEX venues_name_idx ON venues(name);