-- Migration 004: Add constraints and indexes
-- This migration adds foreign key constraints and performance indexes

BEGIN;

-- Step 1: Add foreign key constraints
-- These are added after data migration to avoid constraint violations

-- Add foreign key from itinerary to ports
ALTER TABLE itinerary
ADD CONSTRAINT fk_itinerary_port
FOREIGN KEY (port_id)
REFERENCES ports(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add foreign key from events to parties
ALTER TABLE events
ADD CONSTRAINT fk_events_party
FOREIGN KEY (party_id)
REFERENCES parties(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add foreign keys for event_talent junction table
ALTER TABLE event_talent
ADD CONSTRAINT fk_event_talent_event
FOREIGN KEY (event_id)
REFERENCES events(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE event_talent
ADD CONSTRAINT fk_event_talent_talent
FOREIGN KEY (talent_id)
REFERENCES talent(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Step 2: Create indexes for foreign keys (improves JOIN performance)
CREATE INDEX IF NOT EXISTS idx_itinerary_port_id ON itinerary(port_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_trip_id_day ON itinerary(trip_id, day);

CREATE INDEX IF NOT EXISTS idx_events_party_id ON events(party_id);
CREATE INDEX IF NOT EXISTS idx_events_trip_id_date ON events(trip_id, date);

CREATE INDEX IF NOT EXISTS idx_event_talent_event_id ON event_talent(event_id);
CREATE INDEX IF NOT EXISTS idx_event_talent_talent_id ON event_talent(talent_id);
CREATE INDEX IF NOT EXISTS idx_event_talent_performance ON event_talent(event_id, performance_order);

-- Step 3: Create indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_ports_name ON ports(name);
CREATE INDEX IF NOT EXISTS idx_ports_region ON ports(region);
CREATE INDEX IF NOT EXISTS idx_ports_port_type ON ports(port_type);
CREATE INDEX IF NOT EXISTS idx_ports_country ON ports(country);

CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);
CREATE INDEX IF NOT EXISTS idx_parties_venue_type ON parties(venue_type);
CREATE INDEX IF NOT EXISTS idx_parties_usage_count ON parties(usage_count DESC);

-- Step 4: Create partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ports_active_ports ON ports(id) WHERE port_type = 'port';
CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(date) WHERE date >= CURRENT_DATE;

-- Step 5: Add check constraints for data integrity
ALTER TABLE ports
ADD CONSTRAINT chk_ports_coordinates
CHECK (
    coordinates IS NULL OR (
        coordinates ? 'lat' AND
        coordinates ? 'lng' AND
        (coordinates->>'lat')::numeric BETWEEN -90 AND 90 AND
        (coordinates->>'lng')::numeric BETWEEN -180 AND 180
    )
);

ALTER TABLE parties
ADD CONSTRAINT chk_parties_capacity
CHECK (capacity IS NULL OR capacity > 0);

ALTER TABLE parties
ADD CONSTRAINT chk_parties_duration
CHECK (duration_hours IS NULL OR duration_hours > 0);

ALTER TABLE event_talent
ADD CONSTRAINT chk_event_talent_order
CHECK (performance_order IS NULL OR performance_order > 0);

-- Step 6: Create composite unique constraints
ALTER TABLE itinerary
ADD CONSTRAINT unq_itinerary_trip_day_order
UNIQUE (trip_id, day, "order");

-- Step 7: Create statistics for query optimization
ANALYZE ports;
ANALYZE parties;
ANALYZE event_talent;
ANALYZE itinerary;
ANALYZE events;

-- Step 8: Verify constraints are working
DO $$
DECLARE
    constraint_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count constraints
    SELECT COUNT(*)
    INTO constraint_count
    FROM information_schema.table_constraints
    WHERE table_name IN ('ports', 'parties', 'event_talent', 'itinerary', 'events')
    AND constraint_type IN ('FOREIGN KEY', 'CHECK', 'UNIQUE');

    -- Count indexes
    SELECT COUNT(*)
    INTO index_count
    FROM pg_indexes
    WHERE tablename IN ('ports', 'parties', 'event_talent', 'itinerary', 'events');

    RAISE NOTICE 'Constraints and Indexes Summary:';
    RAISE NOTICE '  Total constraints added: %', constraint_count;
    RAISE NOTICE '  Total indexes created: %', index_count;

    IF constraint_count < 10 THEN
        RAISE WARNING 'Fewer constraints than expected';
    END IF;

    IF index_count < 15 THEN
        RAISE WARNING 'Fewer indexes than expected';
    END IF;
END $$;

COMMIT;