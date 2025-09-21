-- ============================================================
-- ROLLBACK SCRIPT: Revert trips back to cruises
-- Only use this if migration needs to be reversed
-- Version: 001_rename_cruises_to_trips_rollback
-- ============================================================

BEGIN;

-- Set lock timeout to prevent long waits
SET lock_timeout = '10s';
SET statement_timeout = '30s';

-- ============================================================
-- STEP 1: Drop the view
-- ============================================================
DROP VIEW IF EXISTS admin_dashboard_stats;

-- ============================================================
-- STEP 2: Drop foreign key constraints
-- ============================================================
ALTER TABLE trip_talent DROP CONSTRAINT IF EXISTS trip_talent_trip_id_fkey;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_trip_id_fkey;
ALTER TABLE itinerary DROP CONSTRAINT IF EXISTS itinerary_trip_id_fkey;
ALTER TABLE trip_info_sections DROP CONSTRAINT IF EXISTS trip_info_sections_trip_id_fkey;
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_ship_id_fkey;

-- ============================================================
-- STEP 3: Rename columns back
-- ============================================================
ALTER TABLE trip_talent RENAME COLUMN trip_id TO cruise_id;
ALTER TABLE events RENAME COLUMN trip_id TO cruise_id;
ALTER TABLE itinerary RENAME COLUMN trip_id TO cruise_id;
ALTER TABLE trip_info_sections RENAME COLUMN trip_id TO cruise_id;
ALTER TABLE invitations RENAME COLUMN trip_id TO cruise_id;

-- ============================================================
-- STEP 4: Rename tables back
-- ============================================================
ALTER TABLE trip_talent RENAME TO cruise_talent;
ALTER TABLE trips RENAME TO cruises;

-- ============================================================
-- STEP 5: Recreate original foreign keys
-- ============================================================
ALTER TABLE cruises
    ADD CONSTRAINT cruises_ship_id_fkey
    FOREIGN KEY (ship_id) REFERENCES ships(id);

ALTER TABLE cruise_talent
    ADD CONSTRAINT cruise_talent_cruise_id_fkey
    FOREIGN KEY (cruise_id) REFERENCES cruises(id);

ALTER TABLE events
    ADD CONSTRAINT events_cruise_id_fkey
    FOREIGN KEY (cruise_id) REFERENCES cruises(id);

ALTER TABLE itinerary
    ADD CONSTRAINT itinerary_cruise_id_fkey
    FOREIGN KEY (cruise_id) REFERENCES cruises(id);

ALTER TABLE trip_info_sections
    ADD CONSTRAINT trip_info_sections_cruise_id_fkey
    FOREIGN KEY (cruise_id) REFERENCES cruises(id);

-- ============================================================
-- STEP 6: Rename indexes back
-- ============================================================

-- Rename main table indexes
ALTER INDEX IF EXISTS trips_pkey RENAME TO cruises_pkey;
ALTER INDEX IF EXISTS trips_slug_unique RENAME TO cruises_slug_unique;
ALTER INDEX IF EXISTS trips_ship_id_idx RENAME TO cruises_ship_id_idx;
ALTER INDEX IF EXISTS trips_ship_id_status_idx RENAME TO cruises_ship_id_status_idx;
ALTER INDEX IF EXISTS trips_status_start_date_idx RENAME TO cruises_status_start_date_idx;
ALTER INDEX IF EXISTS idx_trips_slug RENAME TO idx_cruises_slug;
ALTER INDEX IF EXISTS idx_trips_status RENAME TO idx_cruises_status;

-- Rename cruise_talent indexes
ALTER INDEX IF EXISTS trip_talent_pkey RENAME TO cruise_talent_pkey;
ALTER INDEX IF EXISTS trip_talent_admin_idx RENAME TO cruise_talent_admin_idx;
ALTER INDEX IF EXISTS idx_trip_talent_trip_id RENAME TO idx_cruise_talent_cruise_id;
ALTER INDEX IF EXISTS idx_trip_talent_talent_id RENAME TO idx_cruise_talent_talent_id;

-- Recreate original indexes
DROP INDEX IF EXISTS events_admin_dashboard_idx;
CREATE INDEX events_admin_dashboard_idx ON events(cruise_id, date DESC, type);

DROP INDEX IF EXISTS events_stats_idx;
CREATE INDEX events_stats_idx ON events(cruise_id, type);

DROP INDEX IF EXISTS idx_events_trip_id;
CREATE INDEX idx_events_cruise_id ON events(cruise_id);

DROP INDEX IF EXISTS idx_itinerary_trip_id;
CREATE INDEX idx_itinerary_cruise_id ON itinerary(cruise_id);

DROP INDEX IF EXISTS itinerary_trip_date_idx;
CREATE INDEX itinerary_cruise_date_idx ON itinerary(cruise_id, date);

DROP INDEX IF EXISTS idx_trip_info_sections_trip_id;
CREATE INDEX idx_trip_info_sections_cruise_id ON trip_info_sections(cruise_id);

DROP INDEX IF EXISTS trip_info_sections_trip_order_idx;
CREATE INDEX trip_info_sections_cruise_order_idx ON trip_info_sections(cruise_id, order_index);

DROP INDEX IF EXISTS trip_talent_admin_idx;
CREATE INDEX cruise_talent_admin_idx ON cruise_talent(cruise_id, role);

-- ============================================================
-- STEP 7: Recreate original view
-- ============================================================
CREATE VIEW admin_dashboard_stats AS
SELECT 'cruises'::text AS entity_type,
    count(*) AS total_count,
    count(*) FILTER (WHERE (cruises.status = 'upcoming'::text)) AS metric_1,
    count(*) FILTER (WHERE (cruises.status = 'ongoing'::text)) AS metric_2,
    count(*) FILTER (WHERE (cruises.status = 'past'::text)) AS metric_3
FROM cruises
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
-- STEP 8: Remove comments
-- ============================================================
COMMENT ON TABLE cruises IS NULL;
COMMENT ON TABLE cruise_talent IS NULL;
COMMENT ON COLUMN cruise_talent.cruise_id IS NULL;
COMMENT ON COLUMN events.cruise_id IS NULL;
COMMENT ON COLUMN itinerary.cruise_id IS NULL;
COMMENT ON COLUMN trip_info_sections.cruise_id IS NULL;
COMMENT ON COLUMN invitations.cruise_id IS NULL;

-- ============================================================
-- VALIDATION
-- ============================================================
DO $$
DECLARE
    cruises_count INTEGER;
    cruise_talent_count INTEGER;
    events_count INTEGER;
    itinerary_count INTEGER;
    sections_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cruises_count FROM cruises;
    SELECT COUNT(*) INTO cruise_talent_count FROM cruise_talent;
    SELECT COUNT(*) INTO events_count FROM events;
    SELECT COUNT(*) INTO itinerary_count FROM itinerary;
    SELECT COUNT(*) INTO sections_count FROM trip_info_sections;

    RAISE NOTICE 'Rollback completed successfully. Cruises: %, Cruise_talent: %, Events: %, Itinerary: %, Sections: %',
        cruises_count, cruise_talent_count, events_count, itinerary_count, sections_count;
END $$;

COMMIT;

-- ============================================================
-- END OF ROLLBACK
-- ============================================================