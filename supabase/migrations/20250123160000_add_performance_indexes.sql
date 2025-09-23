-- Migration: Add performance indexes for optimized queries
-- Date: 2025-01-23
-- Purpose: Phase 6 - Add missing indexes to improve query performance

-- ============================================
-- TRIPS TABLE INDEXES
-- ============================================

-- Unique index on slug for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_slug
ON trips(slug);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_trips_status
ON trips(status);

-- Index on dates for time-based queries
CREATE INDEX IF NOT EXISTS idx_trips_start_date
ON trips(start_date);

CREATE INDEX IF NOT EXISTS idx_trips_end_date
ON trips(end_date);

-- Composite index for status + dates (common query pattern)
CREATE INDEX IF NOT EXISTS idx_trips_status_dates
ON trips(status, start_date, end_date);

-- ============================================
-- EVENTS TABLE INDEXES
-- ============================================

-- Index on trip_id for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_events_trip_id
ON events(trip_id);

-- Index on type for filtering
CREATE INDEX IF NOT EXISTS idx_events_type
ON events(type);

-- Index on date for time-based queries
CREATE INDEX IF NOT EXISTS idx_events_date
ON events(date);

-- Composite index for trip + date (common query pattern)
CREATE INDEX IF NOT EXISTS idx_events_trip_date
ON events(trip_id, date, time);

-- ============================================
-- ITINERARY TABLE INDEXES
-- ============================================

-- Index on trip_id for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_itinerary_trip_id
ON itinerary(trip_id);

-- Index on order_index for sorting
CREATE INDEX IF NOT EXISTS idx_itinerary_order
ON itinerary(trip_id, order_index);

-- Index on location_id for joins
CREATE INDEX IF NOT EXISTS idx_itinerary_location_id
ON itinerary(location_id);

-- ============================================
-- LOCATIONS TABLE INDEXES
-- ============================================

-- Index on country for filtering
CREATE INDEX IF NOT EXISTS idx_locations_country
ON locations(country);

-- Index on location_type_id for filtering
CREATE INDEX IF NOT EXISTS idx_locations_type_id
ON locations(location_type_id);

-- Index on slug for lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_slug
ON locations(slug);

-- ============================================
-- TALENT TABLE INDEXES
-- ============================================

-- Index on name for search queries
CREATE INDEX IF NOT EXISTS idx_talent_name
ON talent(name);

-- Index on talent_category_id for filtering
CREATE INDEX IF NOT EXISTS idx_talent_category_id
ON talent(talent_category_id);

-- Full text search index for talent bio and known_for
CREATE INDEX IF NOT EXISTS idx_talent_search
ON talent USING gin(to_tsvector('english', coalesce(bio, '') || ' ' || coalesce(known_for, '')));

-- ============================================
-- TRIP_TALENT JUNCTION TABLE INDEXES
-- ============================================

-- Composite index for many-to-many lookups
CREATE INDEX IF NOT EXISTS idx_trip_talent_composite
ON trip_talent(trip_id, talent_id);

-- Reverse index for talent lookups
CREATE INDEX IF NOT EXISTS idx_trip_talent_reverse
ON trip_talent(talent_id, trip_id);

-- ============================================
-- TRIP_INFO_SECTIONS TABLE INDEXES
-- ============================================

-- Index on trip_id for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_trip_info_sections_trip_id
ON trip_info_sections(trip_id);

-- Index on order_index for sorting
CREATE INDEX IF NOT EXISTS idx_trip_info_sections_order
ON trip_info_sections(trip_id, order_index);

-- ============================================
-- PROFILES TABLE INDEXES (Supabase Auth)
-- ============================================

-- Index on email for lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email);

-- Index on role for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status
ON profiles(status);

-- ============================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================

-- Create a view to monitor slow queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- queries slower than 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Create a view to monitor index usage
CREATE OR REPLACE VIEW v_index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Create a view to find unused indexes
CREATE OR REPLACE VIEW v_unused_indexes AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE 'pg_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

-- Update statistics for query planner optimization
ANALYZE trips;
ANALYZE events;
ANALYZE itinerary;
ANALYZE locations;
ANALYZE talent;
ANALYZE trip_talent;
ANALYZE trip_info_sections;
ANALYZE profiles;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Add comment to track migration
COMMENT ON SCHEMA public IS 'Phase 6 performance indexes applied - 2025-01-23';