-- Phase 3: Database Optimization Migration
-- Created: 2025-09-29
-- Purpose: Add indexes for performance, drop duplicates, configure autovacuum

-- =====================================================
-- PART 1: JUNCTION TABLE INDEXES
-- =====================================================
-- trip_section_assignments is the many-to-many junction table
-- These indexes optimize the most common query patterns

-- Index for looking up sections by trip
CREATE INDEX IF NOT EXISTS idx_trip_section_assignments_trip_id
ON trip_section_assignments(trip_id);

-- Index for looking up trips by section
CREATE INDEX IF NOT EXISTS idx_trip_section_assignments_section_id
ON trip_section_assignments(section_id);

-- Composite index for the join query (trip + section lookup)
CREATE INDEX IF NOT EXISTS idx_trip_section_assignments_trip_section
ON trip_section_assignments(trip_id, section_id);

-- Index for ordering sections within a trip
CREATE INDEX IF NOT EXISTS idx_trip_section_assignments_order
ON trip_section_assignments(trip_id, order_index);

-- =====================================================
-- PART 2: PROFILES TABLE INDEXES
-- =====================================================
-- email already has unique constraint (automatic index)
-- Add indexes for common query patterns

-- Index for role-based queries (e.g., "get all admins")
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role) WHERE role IS NOT NULL;

-- Index for active user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_active
ON profiles(is_active) WHERE is_active = true;

-- Index for user search by location
CREATE INDEX IF NOT EXISTS idx_profiles_location
ON profiles(city, state_province, country)
WHERE city IS NOT NULL;

-- =====================================================
-- PART 3: EVENTS TABLE INDEXES
-- =====================================================
-- Optimize event queries by trip and date

-- Index for trip events lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_events_trip_id_date
ON events(trip_id, date);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_events_type
ON events(type);

-- Index for party theme lookups
CREATE INDEX IF NOT EXISTS idx_events_party_theme_id
ON events(party_theme_id) WHERE party_theme_id IS NOT NULL;

-- =====================================================
-- PART 4: TRIP_INFO_SECTIONS INDEXES
-- =====================================================
-- Index for section type filtering (general vs trip_specific)
CREATE INDEX IF NOT EXISTS idx_trip_info_sections_section_type
ON trip_info_sections(section_type);

-- Note: trip_id is intentionally nullable (for general sections)
-- so no FK index needed

-- =====================================================
-- PART 5: SECURITY_AUDIT_LOG INDEXES
-- =====================================================
-- Optimize audit log queries for compliance and monitoring

-- Index for user activity lookups
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id_created
ON security_audit_log(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Index for action-based queries (e.g., "show all login attempts")
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action_created
ON security_audit_log(action, created_at DESC);

-- Index for table-specific audit queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_table_name
ON security_audit_log(table_name, created_at DESC)
WHERE table_name IS NOT NULL;

-- =====================================================
-- PART 6: ITINERARY TABLE INDEXES
-- =====================================================
-- Optimize itinerary lookups

-- Index for trip itinerary queries
CREATE INDEX IF NOT EXISTS idx_itinerary_trip_id_order
ON itinerary(trip_id, order_index);

-- Index for location lookups
CREATE INDEX IF NOT EXISTS idx_itinerary_location_id
ON itinerary(location_id) WHERE location_id IS NOT NULL;

-- =====================================================
-- PART 7: TRIP_TALENT JUNCTION TABLE INDEXES
-- =====================================================
-- Optimize many-to-many trip-talent relationships

-- Index for "get talent for trip" queries
CREATE INDEX IF NOT EXISTS idx_trip_talent_trip_id
ON trip_talent(trip_id);

-- Index for "get trips for talent" queries
CREATE INDEX IF NOT EXISTS idx_trip_talent_talent_id
ON trip_talent(talent_id);

-- =====================================================
-- PART 8: CHECK AND DROP DUPLICATE INDEXES
-- =====================================================
-- Note: Run this query manually to identify duplicates:
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_indexes
-- JOIN pg_stat_user_indexes USING (schemaname, tablename, indexname)
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
--
-- Check for duplicate indexes on the same columns and drop manually if found

-- =====================================================
-- PART 9: CONFIGURE AUTOVACUUM
-- =====================================================
-- Tune autovacuum for tables with frequent updates

-- Increase autovacuum frequency for audit log (inserts frequently)
ALTER TABLE security_audit_log SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- Vacuum at 5% dead rows (default 20%)
  autovacuum_analyze_scale_factor = 0.02  -- Analyze at 2% changes (default 10%)
);

-- Tune profiles table (updates frequently)
ALTER TABLE profiles SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Tune events table (frequent updates)
ALTER TABLE events SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- =====================================================
-- PART 10: ANALYZE TABLES
-- =====================================================
-- Update statistics for query planner

ANALYZE trip_section_assignments;
ANALYZE profiles;
ANALYZE events;
ANALYZE trip_info_sections;
ANALYZE security_audit_log;
ANALYZE itinerary;
ANALYZE trip_talent;
ANALYZE trips;
ANALYZE talent;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify indexes were created:
--
-- -- Check indexes on trip_section_assignments
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'trip_section_assignments';
--
-- -- Check table sizes
-- SELECT
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
--   pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
--   pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- NOTES FOR VACUUM FULL
-- =====================================================
-- VACUUM FULL should be run during maintenance window
-- It requires an exclusive lock and can take significant time
--
-- To check table bloat first:
--
-- SELECT
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
--   n_dead_tup,
--   n_live_tup,
--   CASE WHEN n_live_tup > 0
--     THEN round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 1)
--     ELSE 0
--   END as dead_tuple_percent
-- FROM pg_stat_user_tables
-- WHERE schemaname = 'public'
-- ORDER BY n_dead_tup DESC;
--
-- Run VACUUM FULL only if dead_tuple_percent > 20%
-- VACUUM FULL security_audit_log;  -- Run during maintenance window if needed

-- Migration complete!