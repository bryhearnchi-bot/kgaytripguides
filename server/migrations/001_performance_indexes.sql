-- ===============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- K-GAY Travel Guides Database
-- Created: 2025-09-23
-- ===============================================

-- ============================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================

-- Trips table composite indexes
CREATE INDEX IF NOT EXISTS idx_trips_status_dates
ON trips(trip_status_id, start_date, end_date);
COMMENT ON INDEX idx_trips_status_dates IS 'Optimize filtering trips by status and date ranges';

CREATE INDEX IF NOT EXISTS idx_trips_type_status
ON trips(trip_type_id, trip_status_id);
COMMENT ON INDEX idx_trips_type_status IS 'Optimize filtering trips by type and status';

-- Events table composite indexes
CREATE INDEX IF NOT EXISTS idx_events_trip_date_type
ON events(trip_id, date, type);
COMMENT ON INDEX idx_events_trip_date_type IS 'Optimize event queries by trip, date, and type';

CREATE INDEX IF NOT EXISTS idx_events_date_time
ON events(date, time);
COMMENT ON INDEX idx_events_date_time IS 'Optimize chronological event queries';

-- Itinerary table composite indexes
CREATE INDEX IF NOT EXISTS idx_itinerary_trip_order
ON itinerary(trip_id, order_index);
COMMENT ON INDEX idx_itinerary_trip_order IS 'Optimize itinerary retrieval in correct order';

CREATE INDEX IF NOT EXISTS idx_itinerary_trip_segment
ON itinerary(trip_id, segment, order_index);
COMMENT ON INDEX idx_itinerary_trip_segment IS 'Optimize segment-based itinerary queries';

-- ============================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================

-- Trips full-text search
CREATE INDEX IF NOT EXISTS idx_trips_search
ON trips USING gin(
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(resort_name, '')
  )
);
COMMENT ON INDEX idx_trips_search IS 'Full-text search on trip names and descriptions';

-- Events full-text search
CREATE INDEX IF NOT EXISTS idx_events_search
ON events USING gin(
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(venue, '')
  )
);
COMMENT ON INDEX idx_events_search IS 'Full-text search on event titles and descriptions';

-- Talent full-text search
CREATE INDEX IF NOT EXISTS idx_talent_search
ON talent USING gin(
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(bio, '') || ' ' ||
    COALESCE(known_for, '')
  )
);
COMMENT ON INDEX idx_talent_search IS 'Full-text search on talent names and bios';

-- Locations full-text search
CREATE INDEX IF NOT EXISTS idx_locations_search
ON locations USING gin(
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(country, '')
  )
);
COMMENT ON INDEX idx_locations_search IS 'Full-text search on location names and descriptions';

-- ============================================
-- JSON FIELD INDEXES
-- ============================================

-- Trips JSON fields
CREATE INDEX IF NOT EXISTS idx_trips_highlights
ON trips USING gin(highlights);
COMMENT ON INDEX idx_trips_highlights IS 'Optimize queries on trip highlights';

CREATE INDEX IF NOT EXISTS idx_trips_pricing
ON trips USING gin(pricing);
COMMENT ON INDEX idx_trips_pricing IS 'Optimize pricing-related queries';

-- Events JSON fields
CREATE INDEX IF NOT EXISTS idx_events_talent_ids
ON events USING gin(talent_ids) WHERE talent_ids IS NOT NULL;
COMMENT ON INDEX idx_events_talent_ids IS 'Optimize talent lookup in events';

-- Talent JSON fields
CREATE INDEX IF NOT EXISTS idx_talent_social_links
ON talent USING gin(social_links) WHERE social_links IS NOT NULL;
COMMENT ON INDEX idx_talent_social_links IS 'Optimize social media queries';

-- ============================================
-- MISSING FOREIGN KEY INDEXES
-- ============================================

-- User/Profile relationship indexes
CREATE INDEX IF NOT EXISTS idx_trips_created_by
ON trips(created_by) WHERE created_by IS NOT NULL;
COMMENT ON INDEX idx_trips_created_by IS 'Optimize creator lookup for trips';

CREATE INDEX IF NOT EXISTS idx_trip_info_updated_by
ON trip_info_sections(updated_by) WHERE updated_by IS NOT NULL;
COMMENT ON INDEX idx_trip_info_updated_by IS 'Optimize updater lookup for info sections';

CREATE INDEX IF NOT EXISTS idx_settings_created_by
ON settings(created_by) WHERE created_by IS NOT NULL;
COMMENT ON INDEX idx_settings_created_by IS 'Optimize creator lookup for settings';

-- ============================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================

-- Active trips index
CREATE INDEX IF NOT EXISTS idx_trips_active
ON trips(start_date, end_date)
WHERE trip_status_id = (SELECT id FROM trip_status WHERE status = 'published');
COMMENT ON INDEX idx_trips_active IS 'Optimize queries for active/published trips';

-- Upcoming events index
CREATE INDEX IF NOT EXISTS idx_events_upcoming
ON events(date, time)
WHERE date >= CURRENT_DATE;
COMMENT ON INDEX idx_events_upcoming IS 'Optimize queries for upcoming events';

-- Active settings index
CREATE INDEX IF NOT EXISTS idx_settings_active_category
ON settings(category, order_index)
WHERE is_active = true;
COMMENT ON INDEX idx_settings_active_category IS 'Optimize active settings queries';

-- Unused invitations index
CREATE INDEX IF NOT EXISTS idx_invitations_pending
ON invitations(email, expires_at)
WHERE used = false AND expires_at > NOW();
COMMENT ON INDEX idx_invitations_pending IS 'Optimize pending invitation queries';

-- ============================================
-- COVERING INDEXES FOR COMMON QUERIES
-- ============================================

-- Trip listing with basic info (covering index)
CREATE INDEX IF NOT EXISTS idx_trips_listing
ON trips(trip_status_id, start_date DESC)
INCLUDE (name, slug, hero_image_url, end_date);
COMMENT ON INDEX idx_trips_listing IS 'Covering index for trip listing pages';

-- Event calendar view (covering index)
CREATE INDEX IF NOT EXISTS idx_events_calendar
ON events(trip_id, date, time)
INCLUDE (title, venue, type);
COMMENT ON INDEX idx_events_calendar IS 'Covering index for event calendar views';

-- Talent assignments (covering index)
CREATE INDEX IF NOT EXISTS idx_trip_talent_complete
ON trip_talent(trip_id, talent_id)
INCLUDE (role, performance_count);
COMMENT ON INDEX idx_trip_talent_complete IS 'Covering index for talent assignment queries';

-- ============================================
-- STATISTICS AND MAINTENANCE
-- ============================================

-- Update table statistics for better query planning
ANALYZE trips;
ANALYZE events;
ANALYZE itinerary;
ANALYZE talent;
ANALYZE trip_talent;
ANALYZE locations;
ANALYZE settings;
ANALYZE profiles;

-- ============================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================

-- Create a view for monitoring slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  rows,
  100.0 * total_time / SUM(total_time) OVER () AS percentage_of_total_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_time DESC
LIMIT 20;

COMMENT ON VIEW slow_queries IS 'Monitor top 20 slowest queries by total execution time';

-- Create a view for monitoring index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  CASE
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 100 THEN 'RARELY_USED'
    WHEN idx_scan < 1000 THEN 'OCCASIONALLY_USED'
    ELSE 'FREQUENTLY_USED'
  END as usage_category
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

COMMENT ON VIEW index_usage_stats IS 'Monitor index usage and identify unused indexes';

-- Create a view for monitoring table bloat
CREATE OR REPLACE VIEW table_bloat_stats AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  CASE
    WHEN n_live_tup > 0 THEN ROUND(100.0 * n_dead_tup / n_live_tup, 2)
    ELSE 0
  END AS bloat_percentage
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

COMMENT ON VIEW table_bloat_stats IS 'Monitor table bloat and dead tuple accumulation';

-- ============================================
-- NOTES
-- ============================================
-- Run VACUUM ANALYZE regularly to maintain index efficiency
-- Monitor pg_stat_user_indexes to identify unused indexes
-- Consider partitioning large tables if they grow beyond 10GB
-- Review execution plans with EXPLAIN ANALYZE for critical queries