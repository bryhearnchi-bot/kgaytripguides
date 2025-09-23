-- ===============================================
-- N+1 QUERY OPTIMIZATION AND MISSING INDEXES
-- K-GAY Travel Guides Database
-- Created: 2025-09-23
-- Purpose: Add missing indexes and optimize for batch operations
-- ===============================================

-- ============================================
-- MISSING UNIQUE INDEXES
-- ============================================

-- Trips table: slug is frequently used for lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_slug_unique
ON trips(slug);
COMMENT ON INDEX idx_trips_slug_unique IS 'Unique index on slug for fast trip lookups by URL slug';

-- ============================================
-- MISSING FOREIGN KEY INDEXES
-- ============================================

-- Events table: trip_id foreign key
CREATE INDEX IF NOT EXISTS idx_events_trip_id_fk
ON events(trip_id);
COMMENT ON INDEX idx_events_trip_id_fk IS 'Foreign key index for efficient event lookups by trip';

-- Itinerary table: trip_id foreign key
CREATE INDEX IF NOT EXISTS idx_itinerary_trip_id_fk
ON itinerary(trip_id);
COMMENT ON INDEX idx_itinerary_trip_id_fk IS 'Foreign key index for efficient itinerary lookups by trip';

-- ============================================
-- FILTERING AND SEARCH INDEXES
-- ============================================

-- Locations table: country filtering
CREATE INDEX IF NOT EXISTS idx_locations_country
ON locations(country);
COMMENT ON INDEX idx_locations_country IS 'Index for filtering locations by country';

-- Talent table: name search
CREATE INDEX IF NOT EXISTS idx_talent_name_search
ON talent(name);
COMMENT ON INDEX idx_talent_name_search IS 'Index for searching talent by name';

-- ============================================
-- JUNCTION TABLE COMPOSITE INDEXES
-- ============================================

-- Trip_talent composite index for N+1 query prevention
CREATE INDEX IF NOT EXISTS idx_trip_talent_composite
ON trip_talent(trip_id, talent_id);
COMMENT ON INDEX idx_trip_talent_composite IS 'Composite index for efficient trip-talent relationship queries';

-- ============================================
-- BATCH OPERATION OPTIMIZATION INDEXES
-- ============================================

-- Events batch insert/update optimization
CREATE INDEX IF NOT EXISTS idx_events_trip_id_id
ON events(trip_id, id);
COMMENT ON INDEX idx_events_trip_id_id IS 'Optimize batch event operations by trip';

-- Itinerary batch insert optimization
CREATE INDEX IF NOT EXISTS idx_itinerary_trip_id_order
ON itinerary(trip_id, order_index);
COMMENT ON INDEX idx_itinerary_trip_id_order IS 'Optimize batch itinerary operations and ordering';

-- ============================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ============================================

-- Published trips by slug (most common public query)
CREATE INDEX IF NOT EXISTS idx_trips_published_slug
ON trips(slug)
WHERE trip_status_id = (SELECT id FROM trip_status WHERE status = 'published');
COMMENT ON INDEX idx_trips_published_slug IS 'Optimize public trip lookups for published trips only';

-- Active events for a trip
CREATE INDEX IF NOT EXISTS idx_events_active_by_trip
ON events(trip_id, date, time)
WHERE date >= CURRENT_DATE;
COMMENT ON INDEX idx_events_active_by_trip IS 'Optimize queries for current and future events';

-- ============================================
-- COVERING INDEXES FOR BATCH OPERATIONS
-- ============================================

-- Itinerary bulk copy operations (covering index)
CREATE INDEX IF NOT EXISTS idx_itinerary_bulk_copy
ON itinerary(trip_id)
INCLUDE (date, day, location_name, arrival_time, departure_time, all_aboard_time,
         location_image_url, description, highlights, order_index, segment,
         location_id, location_type_id);
COMMENT ON INDEX idx_itinerary_bulk_copy IS 'Covering index for efficient bulk itinerary copy operations';

-- Events bulk copy operations (covering index)
CREATE INDEX IF NOT EXISTS idx_events_bulk_copy
ON events(trip_id)
INCLUDE (date, time, title, type, venue, talent_ids, party_theme_id);
COMMENT ON INDEX idx_events_bulk_copy IS 'Covering index for efficient bulk event copy operations';

-- ============================================
-- PERFORMANCE MONITORING FOR N+1 QUERIES
-- ============================================

-- Create a view to detect potential N+1 query patterns
CREATE OR REPLACE VIEW n1_query_patterns AS
WITH query_stats AS (
  SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows,
    -- Extract table name from common query patterns
    CASE
      WHEN query LIKE '%FROM events%' THEN 'events'
      WHEN query LIKE '%FROM itinerary%' THEN 'itinerary'
      WHEN query LIKE '%FROM trips%' THEN 'trips'
      WHEN query LIKE '%FROM talent%' THEN 'talent'
      WHEN query LIKE '%FROM trip_talent%' THEN 'trip_talent'
      ELSE 'other'
    END as table_name,
    -- Detect loop patterns (high call count with low rows per call)
    CASE
      WHEN calls > 100 AND rows/NULLIF(calls, 0) < 2 THEN true
      ELSE false
    END as potential_n1
  FROM pg_stat_statements
  WHERE query NOT LIKE '%pg_stat_statements%'
    AND query NOT LIKE '%COMMIT%'
    AND query NOT LIKE '%BEGIN%'
)
SELECT
  table_name,
  COUNT(*) as query_variations,
  SUM(calls) as total_calls,
  SUM(total_time) as total_time_ms,
  AVG(rows/NULLIF(calls, 0))::decimal(10,2) as avg_rows_per_call,
  SUM(CASE WHEN potential_n1 THEN 1 ELSE 0 END) as potential_n1_queries,
  ARRAY_AGG(
    CASE
      WHEN potential_n1 THEN
        LEFT(regexp_replace(query, '\s+', ' ', 'g'), 100) || '...'
      ELSE NULL
    END
  ) FILTER (WHERE potential_n1 IS TRUE) as sample_n1_queries
FROM query_stats
WHERE table_name != 'other'
GROUP BY table_name
HAVING SUM(calls) > 10
ORDER BY potential_n1_queries DESC, total_calls DESC;

COMMENT ON VIEW n1_query_patterns IS 'Monitor for N+1 query patterns by analyzing call frequency and row counts';

-- ============================================
-- BATCH OPERATION PERFORMANCE VIEW
-- ============================================

CREATE OR REPLACE VIEW batch_operation_stats AS
SELECT
  CASE
    WHEN query LIKE '%INSERT INTO events%' AND query LIKE '%VALUES%(%' THEN 'bulk_insert_events'
    WHEN query LIKE '%INSERT INTO itinerary%' AND query LIKE '%VALUES%(%' THEN 'bulk_insert_itinerary'
    WHEN query LIKE '%UPDATE events%' AND calls > 10 THEN 'bulk_update_events'
    WHEN query LIKE '%UPDATE itinerary%' AND calls > 10 THEN 'bulk_update_itinerary'
    ELSE 'other'
  END as operation_type,
  COUNT(*) as operation_count,
  SUM(calls) as total_executions,
  AVG(mean_time)::decimal(10,2) as avg_time_ms,
  SUM(rows) as total_rows_affected,
  AVG(rows/NULLIF(calls, 0))::decimal(10,2) as avg_rows_per_operation
FROM pg_stat_statements
WHERE (query LIKE '%INSERT INTO events%'
    OR query LIKE '%INSERT INTO itinerary%'
    OR query LIKE '%UPDATE events%'
    OR query LIKE '%UPDATE itinerary%')
  AND query NOT LIKE '%pg_stat_statements%'
GROUP BY operation_type
HAVING operation_type != 'other'
ORDER BY total_executions DESC;

COMMENT ON VIEW batch_operation_stats IS 'Monitor batch operation performance and efficiency';

-- ============================================
-- UPDATE STATISTICS
-- ============================================

-- Update statistics for query planner optimization
ANALYZE trips;
ANALYZE events;
ANALYZE itinerary;
ANALYZE talent;
ANALYZE trip_talent;
ANALYZE locations;

-- ============================================
-- INDEX VALIDATION
-- ============================================

-- List all indexes created by this migration
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname IN (
  'idx_trips_slug_unique',
  'idx_events_trip_id_fk',
  'idx_itinerary_trip_id_fk',
  'idx_locations_country',
  'idx_talent_name_search',
  'idx_trip_talent_composite',
  'idx_events_trip_id_id',
  'idx_itinerary_trip_id_order',
  'idx_trips_published_slug',
  'idx_events_active_by_trip',
  'idx_itinerary_bulk_copy',
  'idx_events_bulk_copy'
)
ORDER BY tablename, indexname;

-- ============================================
-- NOTES
-- ============================================
-- This migration addresses N+1 query problems by:
-- 1. Adding missing foreign key indexes for efficient JOINs
-- 2. Creating composite indexes for batch operations
-- 3. Adding covering indexes to reduce table lookups
-- 4. Creating monitoring views to detect N+1 patterns
-- 5. Optimizing for the new bulk operations in the storage layer
--
-- After applying this migration:
-- 1. Monitor the n1_query_patterns view for remaining issues
-- 2. Check batch_operation_stats for performance improvements
-- 3. Run VACUUM ANALYZE periodically to maintain index efficiency
-- 4. Consider partitioning events and itinerary tables if they grow > 10M rows