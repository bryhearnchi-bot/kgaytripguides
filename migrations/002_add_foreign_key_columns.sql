-- Migration 002: Add foreign key columns to existing tables
-- This migration adds port_id and party_id columns to existing tables

BEGIN;

-- Add port_id to itinerary table
ALTER TABLE itinerary
ADD COLUMN IF NOT EXISTS port_id INTEGER;

-- Add party_id to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS party_id INTEGER;

-- Add comments
COMMENT ON COLUMN itinerary.port_id IS 'Foreign key reference to ports table';
COMMENT ON COLUMN events.party_id IS 'Foreign key reference to parties table (party template)';

-- Note: We're not adding foreign key constraints yet
-- They will be added after data migration to avoid constraint violations

COMMIT;