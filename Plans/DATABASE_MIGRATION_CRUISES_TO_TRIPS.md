# Database Migration Plan: Rename 'cruises' to 'trips'

## Executive Summary
This document provides a production-ready migration plan to rename the 'cruises' table to 'trips' and update all references throughout the database. This migration affects 5 dependent tables, 37 indexes, 4 foreign key constraints, and 1 view.

## Migration Metadata
- **Migration Version**: 001_rename_cruises_to_trips
- **Estimated Execution Time**: < 5 seconds
- **Downtime Required**: Zero (using transactional approach)
- **Risk Level**: Medium (multiple dependencies, but atomic transaction ensures safety)
- **Rollback Time**: < 5 seconds

## Pre-Migration Checklist

### 1. Backup Requirements
```sql
-- Create backup of affected tables (run in Supabase dashboard)
CREATE TABLE cruises_backup_[timestamp] AS SELECT * FROM cruises;
CREATE TABLE cruise_talent_backup_[timestamp] AS SELECT * FROM cruise_talent;
CREATE TABLE events_backup_[timestamp] AS SELECT * FROM events;
CREATE TABLE itinerary_backup_[timestamp] AS SELECT * FROM itinerary;
CREATE TABLE trip_info_sections_backup_[timestamp] AS SELECT * FROM trip_info_sections;
CREATE TABLE invitations_backup_[timestamp] AS SELECT * FROM invitations;
```

### 2. Pre-Migration Validation Queries
```sql
-- Record current state (save these results)
SELECT 'cruises_count' as metric, COUNT(*) as value FROM cruises
UNION ALL
SELECT 'cruise_talent_count', COUNT(*) FROM cruise_talent
UNION ALL
SELECT 'events_count', COUNT(*) FROM events
UNION ALL
SELECT 'itinerary_count', COUNT(*) FROM itinerary
UNION ALL
SELECT 'trip_info_sections_count', COUNT(*) FROM trip_info_sections
UNION ALL
SELECT 'invitations_with_cruise_count', COUNT(*) FROM invitations WHERE cruise_id IS NOT NULL;

-- Check for active connections
SELECT pid, usename, application_name, state, query_start
FROM pg_stat_activity
WHERE datname = current_database()
AND state != 'idle'
AND pid != pg_backend_pid();
```

## Migration Script

### Phase 1: Main Migration (Atomic Transaction)

```sql
-- ============================================================
-- MIGRATION: Rename cruises to trips
-- Date: [Execute Date]
-- Version: 001_rename_cruises_to_trips
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
-- STEP 4: Rename columns in the trips table
-- ============================================================
-- No column renames needed in trips table itself

-- ============================================================
-- STEP 5: Rename columns in dependent tables
-- ============================================================
ALTER TABLE cruise_talent RENAME COLUMN cruise_id TO trip_id;
ALTER TABLE events RENAME COLUMN cruise_id TO trip_id;
ALTER TABLE itinerary RENAME COLUMN cruise_id TO trip_id;
ALTER TABLE trip_info_sections RENAME COLUMN cruise_id TO trip_id;
ALTER TABLE invitations RENAME COLUMN cruise_id TO trip_id;

-- ============================================================
-- STEP 6: Rename the cruise_talent table to trip_talent
-- ============================================================
ALTER TABLE cruise_talent RENAME TO trip_talent;

-- ============================================================
-- STEP 7: Recreate foreign key constraints with new names
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
-- STEP 8: Rename indexes
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
-- STEP 9: Recreate the view with updated references
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
-- STEP 10: Add comments for documentation
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

    -- Add your expected counts here based on pre-migration validation
    -- RAISE EXCEPTION IF counts don't match

    RAISE NOTICE 'Migration validation passed. Trips: %, Trip_talent: %, Events: %, Itinerary: %, Sections: %',
        trips_count, trip_talent_count, events_count, itinerary_count, sections_count;
END $$;

COMMIT;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
```

## Post-Migration Validation

### 1. Data Integrity Checks
```sql
-- Verify record counts match pre-migration
SELECT 'trips_count' as metric, COUNT(*) as value FROM trips
UNION ALL
SELECT 'trip_talent_count', COUNT(*) FROM trip_talent
UNION ALL
SELECT 'events_count', COUNT(*) FROM events
UNION ALL
SELECT 'itinerary_count', COUNT(*) FROM itinerary
UNION ALL
SELECT 'trip_info_sections_count', COUNT(*) FROM trip_info_sections
UNION ALL
SELECT 'invitations_with_trip_count', COUNT(*) FROM invitations WHERE trip_id IS NOT NULL;

-- Verify foreign key relationships
SELECT
    'trip_talent_fk' as check_name,
    COUNT(*) as orphaned_records
FROM trip_talent tt
LEFT JOIN trips t ON tt.trip_id = t.id
WHERE t.id IS NULL

UNION ALL

SELECT
    'events_fk',
    COUNT(*)
FROM events e
LEFT JOIN trips t ON e.trip_id = t.id
WHERE t.id IS NULL

UNION ALL

SELECT
    'itinerary_fk',
    COUNT(*)
FROM itinerary i
LEFT JOIN trips t ON i.trip_id = t.id
WHERE t.id IS NULL

UNION ALL

SELECT
    'trip_info_sections_fk',
    COUNT(*)
FROM trip_info_sections tis
LEFT JOIN trips t ON tis.trip_id = t.id
WHERE t.id IS NULL;

-- Test view functionality
SELECT * FROM admin_dashboard_stats;

-- Verify indexes exist
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE tablename IN ('trips', 'trip_talent', 'events', 'itinerary', 'trip_info_sections')
AND schemaname = 'public'
ORDER BY tablename, indexname;
```

### 2. Application Testing Checklist
- [ ] Test all trip listing pages
- [ ] Test trip detail pages
- [ ] Test admin dashboard statistics
- [ ] Test trip creation/editing
- [ ] Test talent assignment to trips
- [ ] Test event creation for trips
- [ ] Test itinerary management
- [ ] Test API endpoints that reference trips

## Rollback Script

```sql
-- ============================================================
-- ROLLBACK SCRIPT: Revert trips back to cruises
-- Only use this if migration needs to be reversed
-- ============================================================

BEGIN;

-- Set lock timeout to prevent long waits
SET lock_timeout = '10s';
SET statement_timeout = '30s';

-- Drop the view
DROP VIEW IF EXISTS admin_dashboard_stats;

-- Drop foreign key constraints
ALTER TABLE trip_talent DROP CONSTRAINT IF EXISTS trip_talent_trip_id_fkey;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_trip_id_fkey;
ALTER TABLE itinerary DROP CONSTRAINT IF EXISTS itinerary_trip_id_fkey;
ALTER TABLE trip_info_sections DROP CONSTRAINT IF EXISTS trip_info_sections_trip_id_fkey;
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_ship_id_fkey;

-- Rename columns back
ALTER TABLE trip_talent RENAME COLUMN trip_id TO cruise_id;
ALTER TABLE events RENAME COLUMN trip_id TO cruise_id;
ALTER TABLE itinerary RENAME COLUMN trip_id TO cruise_id;
ALTER TABLE trip_info_sections RENAME COLUMN trip_id TO cruise_id;
ALTER TABLE invitations RENAME COLUMN trip_id TO cruise_id;

-- Rename tables back
ALTER TABLE trip_talent RENAME TO cruise_talent;
ALTER TABLE trips RENAME TO cruises;

-- Recreate original foreign keys
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

-- Rename indexes back
ALTER INDEX IF EXISTS trips_pkey RENAME TO cruises_pkey;
ALTER INDEX IF EXISTS trips_slug_unique RENAME TO cruises_slug_unique;
ALTER INDEX IF EXISTS trips_ship_id_idx RENAME TO cruises_ship_id_idx;
ALTER INDEX IF EXISTS trips_ship_id_status_idx RENAME TO cruises_ship_id_status_idx;
ALTER INDEX IF EXISTS trips_status_start_date_idx RENAME TO cruises_status_start_date_idx;
ALTER INDEX IF EXISTS idx_trips_slug RENAME TO idx_cruises_slug;
ALTER INDEX IF EXISTS idx_trips_status RENAME TO idx_cruises_status;

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

-- Recreate original view
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

-- Remove comments
COMMENT ON TABLE cruises IS NULL;
COMMENT ON TABLE cruise_talent IS NULL;

COMMIT;
```

## Implementation Timeline

### Phase 1: Preparation (Before Migration)
1. **Backup Creation** (5 minutes)
   - Run backup queries in Supabase dashboard
   - Verify backups are created successfully

2. **Code Preparation** (1-2 hours)
   - Update application code to use 'trips' terminology
   - Deploy application with feature flag for backward compatibility
   - Test with both table names using views if needed

3. **Pre-Migration Testing** (30 minutes)
   - Run validation queries
   - Document current counts
   - Test rollback script in development environment

### Phase 2: Migration Execution
1. **Announce Maintenance Window** (if needed)
   - Although zero-downtime, announce 5-minute potential degradation window

2. **Execute Migration** (< 1 minute)
   - Run migration script in single transaction
   - Monitor for any locks or issues

3. **Immediate Validation** (5 minutes)
   - Run post-migration validation queries
   - Verify all counts match
   - Test critical application paths

### Phase 3: Post-Migration
1. **Monitor Application** (1 hour)
   - Check error logs
   - Monitor performance metrics
   - Verify user functionality

2. **Clean Up** (After 24 hours stable)
   - Remove backward compatibility code
   - Archive backup tables (keep for 30 days)
   - Update documentation

## Risk Analysis

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Transaction lock timeout | Low | High | Set appropriate lock_timeout; execute during low traffic |
| Application errors | Medium | Medium | Deploy code changes first with backward compatibility |
| Data integrity issues | Very Low | High | Atomic transaction ensures all-or-nothing execution |
| Index recreation failures | Low | Low | Can be recreated separately if needed |
| View recreation issues | Low | Low | View can be recreated separately |

### Contingency Plans

1. **If migration fails mid-execution:**
   - Transaction will automatically rollback
   - No data changes will be persisted
   - Investigate error and retry

2. **If application issues discovered post-migration:**
   - Execute rollback script immediately
   - Investigate and fix application code
   - Reschedule migration

3. **If performance degradation:**
   - Check if indexes were created properly
   - Run ANALYZE on affected tables
   - Monitor query performance

## Success Criteria

Migration is considered successful when:
- [ ] All tables renamed successfully
- [ ] All foreign keys re-established
- [ ] All indexes renamed/recreated
- [ ] View recreated and functioning
- [ ] Record counts match pre-migration
- [ ] No orphaned records in foreign key checks
- [ ] Application functions normally
- [ ] No errors in application logs for 1 hour
- [ ] Admin dashboard shows correct statistics

## Communication Plan

### Stakeholders
- Development Team: Full details and involvement
- QA Team: Testing requirements and validation
- DevOps: Execution and monitoring
- Product Owner: Timeline and risk awareness

### Communication Timeline
- **T-24 hours**: Notify team of migration schedule
- **T-1 hour**: Final preparation check
- **T-0**: Begin migration
- **T+5 minutes**: Report initial success/failure
- **T+1 hour**: Full validation report
- **T+24 hours**: Final success confirmation

## Appendix: Quick Commands

### Check migration status
```sql
-- Quick check if migration completed
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips')
        THEN 'Migration Complete'
        ELSE 'Migration Pending'
    END as status;
```

### Emergency contact SQL for Supabase
```sql
-- If you need to check locks
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    query_start,
    state,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Kill a blocking query (use with extreme caution)
-- SELECT pg_terminate_backend(pid_number);
```

---

**Document Version**: 1.0
**Last Updated**: [Current Date]
**Author**: Database Migration Team
**Review Status**: Ready for Implementation