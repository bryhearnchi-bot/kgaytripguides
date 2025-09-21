-- ============================================================
-- MIGRATION: Rename cruises to trips
-- Version: 001_rename_cruises_to_trips
-- Description: Renames cruises table to trips and updates all references
-- ============================================================

BEGIN;

-- Set lock timeout to prevent long waits
SET lock_timeout = '10s';
SET statement_timeout = '30s';

-- ============================================================
-- STEP 1: Drop dependent views
-- ============================================================
DROP VIEW IF EXISTS admin_dashboard_stats;

-- ============================================================
-- STEP 2: Drop all foreign key constraints
-- ============================================================

-- Drop FKs pointing TO cruises table
ALTER TABLE itinerary DROP CONSTRAINT IF EXISTS itinerary_cruise_id_fkey;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_cruise_id_fkey;
ALTER TABLE trip_info_sections DROP CONSTRAINT IF EXISTS trip_info_sections_cruise_id_fkey;
ALTER TABLE cruise_talent DROP CONSTRAINT IF EXISTS cruise_talent_cruise_id_fkey;

-- Drop FK FROM cruises table
ALTER TABLE cruises DROP CONSTRAINT IF EXISTS cruises_ship_id_fkey;

-- ============================================================
-- STEP 3: Rename the main table
-- ============================================================
ALTER TABLE cruises RENAME TO trips;

-- ============================================================
-- STEP 4: Rename columns in dependent tables
-- ============================================================
ALTER TABLE cruise_talent RENAME COLUMN cruise_id TO trip_id;
ALTER TABLE events RENAME COLUMN cruise_id TO trip_id;
ALTER TABLE itinerary RENAME COLUMN cruise_id TO trip_id;
ALTER TABLE trip_info_sections RENAME COLUMN cruise_id TO trip_id;
ALTER TABLE invitations RENAME COLUMN cruise_id TO trip_id;

-- ============================================================
-- STEP 5: Rename the cruise_talent table to trip_talent
-- ============================================================
ALTER TABLE cruise_talent RENAME TO trip_talent;

-- ============================================================
-- STEP 6: Recreate foreign key constraints with new names
-- ============================================================

-- Add FK FROM trips table
ALTER TABLE trips
    ADD CONSTRAINT trips_ship_id_fkey
    FOREIGN KEY (ship_id) REFERENCES ships(id);

-- Add FKs TO trips table
ALTER TABLE trip_talent
    ADD CONSTRAINT trip_talent_trip_id_fkey
    FOREIGN KEY (trip_id) REFERENCES trips(id);

ALTER TABLE events
    ADD CONSTRAINT events_trip_id_fkey
    FOREIGN KEY (trip_id) REFERENCES trips(id);

ALTER TABLE itinerary
    ADD CONSTRAINT itinerary_trip_id_fkey
    FOREIGN KEY (trip_id) REFERENCES trips(id);

ALTER TABLE trip_info_sections
    ADD CONSTRAINT trip_info_sections_trip_id_fkey
    FOREIGN KEY (trip_id) REFERENCES trips(id);

-- Note: invitations.trip_id has no FK constraint (by design)

-- ============================================================
-- STEP 7: Rename indexes
-- ============================================================

-- Rename trips table indexes
ALTER INDEX IF EXISTS cruises_pkey RENAME TO trips_pkey;
ALTER INDEX IF EXISTS cruises_slug_unique RENAME TO trips_slug_unique;
ALTER INDEX IF EXISTS cruises_ship_id_idx RENAME TO trips_ship_id_idx;
ALTER INDEX IF EXISTS cruises_ship_id_status_idx RENAME TO trips_ship_id_status_idx;
ALTER INDEX IF EXISTS cruises_status_start_date_idx RENAME TO trips_status_start_date_idx;
ALTER INDEX IF EXISTS idx_cruises_slug RENAME TO idx_trips_slug;
ALTER INDEX IF EXISTS idx_cruises_status RENAME TO idx_trips_status;

-- Rename trip_talent (formerly cruise_talent) indexes
ALTER INDEX IF EXISTS cruise_talent_pkey RENAME TO trip_talent_pkey;
ALTER INDEX IF EXISTS cruise_talent_admin_idx RENAME TO trip_talent_admin_idx;
ALTER INDEX IF EXISTS idx_cruise_talent_cruise_id RENAME TO idx_trip_talent_trip_id;
ALTER INDEX IF EXISTS idx_cruise_talent_talent_id RENAME TO idx_trip_talent_talent_id;

-- Drop and recreate indexes that reference column names directly
DROP INDEX IF EXISTS events_admin_dashboard_idx;
CREATE INDEX events_admin_dashboard_idx ON events(trip_id, date DESC, type);

DROP INDEX IF EXISTS events_stats_idx;
CREATE INDEX events_stats_idx ON events(trip_id, type);

DROP INDEX IF EXISTS idx_events_cruise_id;
CREATE INDEX idx_events_trip_id ON events(trip_id);

DROP INDEX IF EXISTS idx_itinerary_cruise_id;
CREATE INDEX idx_itinerary_trip_id ON itinerary(trip_id);

DROP INDEX IF EXISTS itinerary_cruise_date_idx;
CREATE INDEX itinerary_trip_date_idx ON itinerary(trip_id, date);

DROP INDEX IF EXISTS idx_trip_info_sections_cruise_id;
CREATE INDEX idx_trip_info_sections_trip_id ON trip_info_sections(trip_id);

DROP INDEX IF EXISTS trip_info_sections_cruise_order_idx;
CREATE INDEX trip_info_sections_trip_order_idx ON trip_info_sections(trip_id, order_index);

-- Recreate compound index on trip_talent
DROP INDEX IF EXISTS trip_talent_admin_idx;
CREATE INDEX trip_talent_admin_idx ON trip_talent(trip_id, role);

-- ============================================================
-- STEP 8: Recreate the view with updated references
-- ============================================================
CREATE VIEW admin_dashboard_stats AS
SELECT 'trips'::text AS entity_type,
    count(*) AS total_count,
    count(*) FILTER (WHERE (trips.status = 'upcoming'::text)) AS metric_1,
    count(*) FILTER (WHERE (trips.status = 'ongoing'::text)) AS metric_2,
    count(*) FILTER (WHERE (trips.status = 'past'::text)) AS metric_3
FROM trips
UNION ALL
SELECT 'events'::text AS entity_type,
    count(*) AS total_count,
    count(*) FILTER (WHERE (events.type = 'party'::text)) AS metric_1,
    count(*) FILTER (WHERE (events.type = 'show'::text)) AS metric_2,
    count(*) FILTER (WHERE (events.date >= (CURRENT_DATE - '30 days'::interval))) AS metric_3
FROM events
UNION ALL
SELECT 'talent'::text AS entity_type,
    count(*) AS total_count,
    count(*) FILTER (WHERE (talent.category = 'Drag'::text)) AS metric_1,
    count(*) FILTER (WHERE (talent.category = 'Broadway'::text)) AS metric_2,
    count(*) FILTER (WHERE (talent.category = 'Comedy'::text)) AS metric_3
FROM talent
UNION ALL
SELECT 'ships'::text AS entity_type,
    count(*) AS total_count,
    count(*) FILTER (WHERE ((ships.cruise_line)::text = 'Virgin Voyages'::text)) AS metric_1,
    count(*) FILTER (WHERE ((ships.cruise_line)::text = 'Celebrity'::text)) AS metric_2,
    count(*) FILTER (WHERE ((ships.cruise_line IS NOT NULL) AND ((ships.cruise_line)::text <> ALL ((ARRAY['Virgin Voyages'::character varying, 'Celebrity'::character varying])::text[])))) AS metric_3
FROM ships;

-- ============================================================
-- STEP 9: Add comments for documentation
-- ============================================================
COMMENT ON TABLE trips IS 'Main trips table (formerly cruises) - stores all trip information';
COMMENT ON TABLE trip_talent IS 'Junction table linking trips to talent (formerly cruise_talent)';
COMMENT ON COLUMN trip_talent.trip_id IS 'Foreign key to trips.id (formerly cruise_id)';
COMMENT ON COLUMN events.trip_id IS 'Foreign key to trips.id (formerly cruise_id)';
COMMENT ON COLUMN itinerary.trip_id IS 'Foreign key to trips.id (formerly cruise_id)';
COMMENT ON COLUMN trip_info_sections.trip_id IS 'Foreign key to trips.id (formerly cruise_id)';
COMMENT ON COLUMN invitations.trip_id IS 'Optional reference to trips.id (formerly cruise_id)';

-- ============================================================
-- VALIDATION: Ensure data integrity
-- ============================================================
DO $$
DECLARE
    trips_count INTEGER;
    trip_talent_count INTEGER;
    events_count INTEGER;
    itinerary_count INTEGER;
    sections_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trips_count FROM trips;
    SELECT COUNT(*) INTO trip_talent_count FROM trip_talent;
    SELECT COUNT(*) INTO events_count FROM events;
    SELECT COUNT(*) INTO itinerary_count FROM itinerary;
    SELECT COUNT(*) INTO sections_count FROM trip_info_sections;

    RAISE NOTICE 'Migration completed successfully. Trips: %, Trip_talent: %, Events: %, Itinerary: %, Sections: %',
        trips_count, trip_talent_count, events_count, itinerary_count, sections_count;
END $$;

COMMIT;

-- ============================================================
-- END OF MIGRATION
-- ============================================================