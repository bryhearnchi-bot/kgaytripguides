-- Migration 001: Create ports and parties tables
-- This migration creates the new normalized structure for ports and parties

BEGIN;

-- Create ports table
CREATE TABLE IF NOT EXISTS ports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    port_type VARCHAR(20) CHECK (port_type IN ('port', 'sea_day', 'embark', 'disembark')) DEFAULT 'port',
    coordinates JSONB,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parties table (for party templates)
CREATE TABLE IF NOT EXISTS parties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    theme TEXT,
    venue_type VARCHAR(20) CHECK (venue_type IN ('pool', 'club', 'theater', 'deck', 'lounge')) DEFAULT 'deck',
    capacity INTEGER,
    duration_hours DECIMAL(3,1),
    requirements JSONB,
    image_url TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create event_talent junction table
CREATE TABLE IF NOT EXISTS event_talent (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    talent_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'performer',
    performance_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, talent_id)
);

-- Add comments for documentation
COMMENT ON TABLE ports IS 'Normalized port/location data for cruise itineraries';
COMMENT ON TABLE parties IS 'Reusable party templates for events';
COMMENT ON TABLE event_talent IS 'Junction table linking events to talent with performance details';

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_ports_updated_at BEFORE UPDATE ON ports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON parties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;