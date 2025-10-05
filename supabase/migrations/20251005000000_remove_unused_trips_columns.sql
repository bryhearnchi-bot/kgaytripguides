-- Migration: Remove unused columns from trips table
-- These columns are redundant as we now use foreign keys (ship_id, trip_status_id)
-- and no longer store these values directly on the trips table

-- Step 1: Update admin_dashboard_stats view to use trip_status_id instead of status column
DROP VIEW IF EXISTS admin_dashboard_stats;

CREATE VIEW admin_dashboard_stats AS
SELECT 'cruises'::text AS entity_type,
    count(*) AS total_count,
    count(*) FILTER (WHERE ts.status = 'upcoming') AS metric_1,
    count(*) FILTER (WHERE ts.status = 'ongoing') AS metric_2,
    count(*) FILTER (WHERE ts.status = 'past') AS metric_3
FROM trips t
LEFT JOIN trip_status ts ON t.trip_status_id = ts.id

UNION ALL

SELECT 'events'::text AS entity_type,
    count(*) AS total_count,
    count(*) FILTER (WHERE events.type = 'party') AS metric_1,
    count(*) FILTER (WHERE events.type = 'show') AS metric_2,
    count(*) FILTER (WHERE events.date >= (CURRENT_DATE - '30 days'::interval)) AS metric_3
FROM events

UNION ALL

SELECT 'talent'::text AS entity_type,
    count(*) AS total_count,
    count(*) FILTER (WHERE tc.category = 'Drag & Variety') AS metric_1,
    count(*) FILTER (WHERE tc.category = 'Headliners') AS metric_2,
    count(*) FILTER (WHERE tc.category = 'Vocalists') AS metric_3
FROM talent t
LEFT JOIN talent_categories tc ON t.talent_category_id = tc.id

UNION ALL

SELECT 'ships'::text AS entity_type,
    count(*) AS total_count,
    count(*) FILTER (WHERE ships.cruise_line = 'Virgin Voyages') AS metric_1,
    count(*) FILTER (WHERE ships.cruise_line = 'Celebrity') AS metric_2,
    count(*) FILTER (WHERE ships.cruise_line IS NOT NULL AND ships.cruise_line NOT IN ('Virgin Voyages', 'Celebrity')) AS metric_3
FROM ships;

-- Step 2: Now safe to remove unused columns
ALTER TABLE trips DROP COLUMN IF EXISTS ship_name;
ALTER TABLE trips DROP COLUMN IF EXISTS cruise_line;
ALTER TABLE trips DROP COLUMN IF EXISTS status;
ALTER TABLE trips DROP COLUMN IF EXISTS pricing;
ALTER TABLE trips DROP COLUMN IF EXISTS includes_info;
