-- Update trips table to add resort_id and remove resort_name
-- Migration: Phase 1 - Replace resort_name varchar with resort_id FK

-- Add resort_id column as foreign key to resorts table
ALTER TABLE trips ADD COLUMN resort_id INTEGER REFERENCES resorts(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX trips_resort_id_idx ON trips(resort_id);

-- Remove the old resort_name varchar field (replacing with FK)
-- Note: This will drop any existing resort name data
-- In a production environment, you'd want to migrate this data first
ALTER TABLE trips DROP COLUMN IF EXISTS resort_name;

-- Ensure that trips have either ship_id OR resort_id, but not both
-- Add a check constraint to enforce this business rule
ALTER TABLE trips ADD CONSTRAINT trips_property_check
  CHECK ((ship_id IS NOT NULL AND resort_id IS NULL) OR (ship_id IS NULL AND resort_id IS NOT NULL));