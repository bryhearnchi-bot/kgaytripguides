-- Migration 005: Cleanup old columns (optional)
-- This migration removes the old location column from itinerary table
-- Only run this after verifying the migration was successful

BEGIN;

-- This migration is intentionally conservative
-- We're NOT dropping the old columns immediately
-- Instead, we'll rename them with a deprecated prefix

-- Check if we have data in the new structure
DO $$
DECLARE
    port_count INTEGER;
    party_count INTEGER;
    itinerary_with_ports INTEGER;
    events_with_parties INTEGER;
BEGIN
    SELECT COUNT(*) INTO port_count FROM ports;
    SELECT COUNT(*) INTO party_count FROM parties;
    SELECT COUNT(*) INTO itinerary_with_ports FROM itinerary WHERE port_id IS NOT NULL;
    SELECT COUNT(*) INTO events_with_parties FROM events WHERE party_id IS NOT NULL;

    -- Only proceed if new structure has data
    IF port_count = 0 OR party_count = 0 THEN
        RAISE EXCEPTION 'New tables are empty - migration may not have completed';
    END IF;

    IF itinerary_with_ports = 0 THEN
        RAISE EXCEPTION 'No itinerary items have port_id - migration incomplete';
    END IF;

    IF events_with_parties = 0 THEN
        RAISE EXCEPTION 'No events have party_id - migration incomplete';
    END IF;

    RAISE NOTICE 'Migration verification passed:';
    RAISE NOTICE '  Ports: %', port_count;
    RAISE NOTICE '  Parties: %', party_count;
    RAISE NOTICE '  Itineraries with ports: %', itinerary_with_ports;
    RAISE NOTICE '  Events with parties: %', events_with_parties;
END $$;

-- Rename old columns instead of dropping them (safer)
-- These can be dropped manually later after full verification

-- Check if location column exists and rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'itinerary'
        AND column_name = 'location'
    ) THEN
        ALTER TABLE itinerary RENAME COLUMN location TO _deprecated_location;
        RAISE NOTICE 'Renamed itinerary.location to _deprecated_location';
    END IF;
END $$;

-- Add comments to indicate deprecated columns
COMMENT ON COLUMN itinerary._deprecated_location IS 'DEPRECATED - Use port_id instead. Column retained for rollback safety.';

-- Create a view for backward compatibility (optional)
CREATE OR REPLACE VIEW v_itinerary_legacy AS
SELECT
    i.*,
    p.name as location_name,
    p.country as location_country,
    COALESCE(i._deprecated_location, p.name) as location
FROM itinerary i
LEFT JOIN ports p ON i.port_id = p.id;

COMMENT ON VIEW v_itinerary_legacy IS 'Backward compatibility view that includes both old and new location data';

-- Log the cleanup
DO $$
BEGIN
    RAISE NOTICE 'Cleanup completed successfully';
    RAISE NOTICE 'Old columns have been renamed with _deprecated_ prefix';
    RAISE NOTICE 'They can be dropped manually after full system verification';
END $$;

COMMIT;