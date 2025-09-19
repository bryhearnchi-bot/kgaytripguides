# Simplified Database Migration Plan (Integrated with Phase 2 & 3) ✅ COMPLETED

## Overview
This plan is now integrated into Phase 2 and 3 of the main backend plan. The database migration happened in Phase 2, and platform migration to Supabase completed in Phase 3.

**Phase 2 Status**: ✅ COMPLETED (January 15, 2025) - Database normalized with ports/parties tables
**Phase 3 Status**: ✅ COMPLETED (September 16, 2025) - Migrated to Supabase platform
**Result**: Successfully running on Supabase with normalized database structure.

## ✅ Current Database Status (Post-Migration)

### **Supabase Database Configuration**
- **URL**: `https://bxiiodeyqvqqcgzzqzvt.supabase.co`
- **Connection**: `postgresql://postgres.bxiiodeyqvqqcgzzqzvt:kgayatlantis2025@aws-1-us-east-2.pooler.supabase.com:6543/postgres`
- **Status**: ✅ Fully operational with 184 rows across 9 tables

### **Authentication System**
- **Platform**: Supabase Auth (migrated from custom system)
- **Admin Login**: `admin@atlantis.com` / `Admin123!`
- **Status**: ✅ Working perfectly with RLS policies enabled
- **Context**: `SupabaseAuthContext` (old `AuthContext` archived)

### **Data Migration Results**
| Table | Rows | Status | Notes |
|-------|------|--------|-------|
| cruises | 2 | ✅ | All cruise definitions migrated |
| talent | 31 | ✅ | All drag performers with profile data |
| ports | 17 | ✅ | All destinations with proper references |
| parties | 16 | ✅ | All party themes normalized |
| itinerary | 17 | ✅ | Complete port schedules |
| events | 66 | ✅ | All party events with relationships |
| trip_info_sections | 4 | ✅ | Content sections preserved |
| cruise_talent | 31 | ✅ | Talent assignments intact |
| profiles | 1+ | ✅ | Supabase Auth profiles with admin user |
| **Total** | **184+** | ✅ | **All data successfully migrated** |

### **Legacy Systems Archived**
- ✅ Railway migration scripts → `archived/old-migrations/`
- ✅ Cloudinary integration → `archived/old-cloudinary/`
- ✅ Custom auth system → `archived/old-auth/`
- ✅ All old dependencies cleaned up and archived

---

## Critical Execution Order
1. **Test Writing** - All tests must be written BEFORE implementation
2. **Blue-Green Setup** - Create duplicate database for safe migration
3. **Schema Changes** - Add new tables/columns on green database
4. **Data Migration** - Transform data with transaction boundaries
5. **Validation** - Comprehensive checks before cutover
6. **Frontend Updates** - Must complete within 4 hours
7. **Traffic Cutover** - Switch to green database
8. **Monitoring** - 24-hour stability before cleanup

---

## Day 1: Preparation & Testing

### Morning: TDD Test Creation
```sql
-- All these tests must FAIL initially (red phase)

-- Test suite for migration validation
CREATE OR REPLACE FUNCTION test_migration_complete()
RETURNS TABLE (
  test_name TEXT,
  expected TEXT,
  actual TEXT,
  passed BOOLEAN
) AS $$
BEGIN
  -- Test: All ports created
  RETURN QUERY
  SELECT
    'Ports created'::TEXT,
    (SELECT COUNT(DISTINCT new_name) FROM port_mapping)::TEXT,
    (SELECT COUNT(*) FROM ports)::TEXT,
    (SELECT COUNT(*) FROM ports) = (SELECT COUNT(DISTINCT new_name) FROM port_mapping);

  -- Test: No data loss
  RETURN QUERY
  SELECT
    'No data loss'::TEXT,
    (SELECT COUNT(*) FROM backup_itinerary)::TEXT,
    (SELECT COUNT(*) FROM itinerary)::TEXT,
    (SELECT COUNT(*) FROM itinerary) >= (SELECT COUNT(*) FROM backup_itinerary);

  -- Test: Referential integrity
  RETURN QUERY
  SELECT
    'References valid'::TEXT,
    '0'::TEXT,
    COUNT(*)::TEXT,
    COUNT(*) = 0
  FROM itinerary
  WHERE port_id IS NOT NULL
    AND port_id NOT IN (SELECT id FROM ports);
END;
$$ LANGUAGE plpgsql;
```

### Afternoon: Data Preparation

#### Baseline Metrics Collection
```sql
-- Capture current performance baselines
CREATE TABLE baseline_metrics AS
SELECT
  'query_performance' as metric_type,
  current_timestamp as captured_at,
  jsonb_build_object(
    'avg_query_time', (SELECT avg(mean_exec_time) FROM pg_stat_statements),
    'total_records', (SELECT SUM(n_live_tup) FROM pg_stat_user_tables),
    'index_hit_rate', (SELECT sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) FROM pg_statio_user_indexes)
  ) as metrics;
```

#### Data Mapping & Cleanup
```sql
-- Create comprehensive port mapping
CREATE TABLE port_mapping (
  old_location TEXT PRIMARY KEY,
  new_name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  port_type TEXT CHECK (port_type IN ('port', 'sea_day', 'embark', 'disembark')),
  coordinates JSONB,
  verified BOOLEAN DEFAULT false
);

-- Populate with all known mappings
INSERT INTO port_mapping (old_location, new_name, country, port_type, coordinates, verified)
VALUES
  ('Athens (Piraeus), Greece', 'Piraeus', 'Greece', 'port', '{"lat": 37.9467, "lng": 23.6353}', true),
  ('Santorini, Greece', 'Santorini', 'Greece', 'port', '{"lat": 36.4161, "lng": 25.4317}', true),
  -- ... all other ports
  ('At Sea', 'At Sea', 'International Waters', 'sea_day', NULL, true);

-- Verify 100% mapping coverage
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM itinerary i
    LEFT JOIN port_mapping pm ON i.location = pm.old_location
    WHERE pm.old_location IS NULL
  ) THEN
    RAISE EXCEPTION 'Unmapped locations found. Cannot proceed.';
  END IF;
END $$;
```

#### Create Backups with Checksums
```sql
-- Full backup with data integrity checks
CREATE TABLE backup_itinerary AS SELECT * FROM itinerary;
CREATE TABLE backup_events AS SELECT * FROM events;

-- Generate checksums for validation
CREATE TABLE migration_checksums (
  table_name TEXT PRIMARY KEY,
  record_count INTEGER,
  data_checksum TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO migration_checksums (table_name, record_count, data_checksum)
SELECT
  'itinerary',
  COUNT(*),
  md5(string_agg(id::text || COALESCE(location, ''), '' ORDER BY id))
FROM itinerary;
```

---

## Day 2: Migration Execution

### Morning: Blue-Green Database Setup

```sql
-- Create green database (exact copy)
-- This happens at infrastructure level, not SQL
-- Example with pg_dump/pg_restore:
-- pg_dump blue_db | pg_restore -d green_db

-- Verify green database is identical
SELECT
  'blue_db' as database,
  COUNT(*) as itinerary_count
FROM blue_db.itinerary
UNION ALL
SELECT
  'green_db',
  COUNT(*)
FROM green_db.itinerary;
```

### Schema Changes (Green Database Only)

```sql
-- All changes happen on GREEN database while BLUE serves traffic

BEGIN; -- Start transaction
SAVEPOINT schema_changes;

-- Create new tables with security features
CREATE TABLE ports (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  coordinates JSONB,
  port_type TEXT CHECK (port_type IN ('port', 'sea_day', 'embark', 'disembark')),
  description TEXT,
  port_image_url TEXT,
  -- Audit columns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT current_user,
  updated_by TEXT DEFAULT current_user,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_port_name CHECK (length(name) <= 255),
  UNIQUE(name, country)
);

-- Enable RLS (ready for future)
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;

CREATE TABLE parties (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  theme TEXT,
  description TEXT,
  party_image_url TEXT,
  venue_type TEXT CHECK (venue_type IN ('pool', 'club', 'deck', 'theater', 'other')),
  duration_hours INTEGER CHECK (duration_hours BETWEEN 1 AND 24),
  capacity INTEGER CHECK (capacity > 0),
  -- Audit columns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT current_user,
  updated_by TEXT DEFAULT current_user,
  deleted_at TIMESTAMPTZ
);

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- Add columns to existing tables (non-destructive)
ALTER TABLE itinerary
  ADD COLUMN port_id INTEGER REFERENCES ports(id),
  ADD COLUMN arrival_time TIME,
  ADD COLUMN departure_time TIME;

ALTER TABLE events
  ADD COLUMN party_id INTEGER REFERENCES parties(id),
  ADD COLUMN venue TEXT,
  ADD COLUMN capacity INTEGER;

-- Junction table for many-to-many
CREATE TABLE event_talent (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  talent_id INTEGER REFERENCES talent(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('headliner', 'support', 'host', 'special_guest')),
  performance_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, talent_id)
);

-- Create indexes for performance
CREATE INDEX idx_ports_country ON ports(country);
CREATE INDEX idx_ports_type ON ports(port_type);
CREATE INDEX idx_parties_venue ON parties(venue_type);
CREATE INDEX idx_event_talent_event ON event_talent(event_id);
CREATE INDEX idx_event_talent_talent ON event_talent(talent_id);

COMMIT; -- Schema changes complete
```

### Data Migration (Green Database)

```sql
BEGIN; -- Start transaction for data migration
SAVEPOINT data_migration;

-- Migrate ports from mapping
INSERT INTO ports (name, country, region, coordinates, port_type, description, port_image_url)
SELECT DISTINCT ON (pm.new_name)
  pm.new_name,
  pm.country,
  pm.region,
  pm.coordinates,
  pm.port_type,
  i.description,
  i.port_image_url
FROM port_mapping pm
INNER JOIN itinerary i ON i.location = pm.old_location
ORDER BY pm.new_name, i.id DESC;

-- Verify port creation
DO $$
DECLARE
  port_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO port_count FROM ports;
  IF port_count = 0 THEN
    ROLLBACK TO SAVEPOINT data_migration;
    RAISE EXCEPTION 'Port migration failed';
  END IF;
  RAISE NOTICE 'Created % ports', port_count;
END $$;

-- Update itinerary references
UPDATE itinerary i
SET port_id = p.id
FROM port_mapping pm
INNER JOIN ports p ON p.name = pm.new_name
WHERE i.location = pm.old_location;

-- Migrate parties (simplified example)
INSERT INTO parties (name, theme, description, party_image_url, venue_type)
SELECT DISTINCT
  title,
  COALESCE(theme, 'General'),
  description,
  image_url,
  CASE
    WHEN title ILIKE '%pool%' THEN 'pool'
    WHEN title ILIKE '%theater%' THEN 'theater'
    ELSE 'other'
  END
FROM events
WHERE type = 'party';

-- Update event references
UPDATE events e
SET party_id = p.id
FROM parties p
WHERE e.title = p.name AND e.type = 'party';

-- Validate migration
SELECT * FROM test_migration_complete();

-- If all tests pass, commit
COMMIT;
```

### Afternoon: Frontend Updates (4-Hour Window)

```typescript
// Storage Layer Updates (must pass pre-written tests)

// NEW: PortStorage.ts
export class PortStorage {
  async getAllPorts(): Promise<Port[]> {
    return await db.select().from(ports).orderBy(asc(ports.name));
  }

  async getPortById(id: number): Promise<Port> {
    const port = await db.select().from(ports).where(eq(ports.id, id)).limit(1);
    if (!port[0]) throw new NotFoundError(`Port ${id} not found`);
    return port[0];
  }
}

// UPDATED: ItineraryStorage.ts
export class ItineraryStorage {
  async getItineraryWithPorts(cruiseId: number): Promise<ItineraryWithPort[]> {
    return await db.select({
      id: itinerary.id,
      date: itinerary.date,
      port: ports, // Now using port relationship
      arrivalTime: itinerary.arrivalTime,
      departureTime: itinerary.departureTime
    })
    .from(itinerary)
    .leftJoin(ports, eq(itinerary.portId, ports.id))
    .where(eq(itinerary.cruiseId, cruiseId))
    .orderBy(asc(itinerary.orderIndex));
  }
}
```

### Evening: Validation & Cutover

#### Final Validation (Green Database)
```sql
-- Comprehensive validation before cutover
CREATE OR REPLACE FUNCTION final_validation()
RETURNS TABLE (check_name TEXT, status TEXT, critical BOOLEAN) AS $$
BEGIN
  -- Data integrity
  RETURN QUERY
  SELECT
    'Data Integrity'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
    true
  FROM itinerary
  WHERE port_id IS NULL AND location IS NOT NULL;

  -- Performance check
  RETURN QUERY
  SELECT
    'Performance'::TEXT,
    CASE WHEN avg_time < INTERVAL '2 seconds' THEN 'PASS' ELSE 'FAIL' END,
    true
  FROM (
    SELECT avg(execution_time) as avg_time
    FROM test_query_performance()
  ) perf;

  -- Checksum validation
  RETURN QUERY
  SELECT
    'Data Checksums'::TEXT,
    CASE WHEN pre.data_checksum = post.data_checksum THEN 'PASS' ELSE 'FAIL' END,
    true
  FROM
    (SELECT data_checksum FROM migration_checksums WHERE table_name = 'itinerary') pre,
    (SELECT md5(string_agg(id::text || COALESCE(location, ''), '' ORDER BY id)) as data_checksum FROM itinerary) post;
END;
$$ LANGUAGE plpgsql;

-- Run validation
SELECT * FROM final_validation();
-- All must PASS before cutover
```

#### Traffic Cutover
```bash
# Infrastructure level switch (example)
# 1. Update connection string to point to green database
# 2. Restart application servers
# 3. Monitor for 30 minutes
# 4. If issues: switch back to blue immediately
```

---

## Day 3-4: Monitoring & Cleanup

### 24-Hour Stability Monitoring
```sql
-- Continuous monitoring queries
CREATE OR REPLACE FUNCTION hourly_health_check()
RETURNS TABLE (metric TEXT, value TEXT, status TEXT) AS $$
BEGIN
  -- Error rate
  RETURN QUERY
  SELECT
    'Error Rate'::TEXT,
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) > 10 THEN 'WARNING' ELSE 'OK' END
  FROM audit_log
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND operation = 'ERROR';

  -- Performance
  RETURN QUERY
  SELECT
    'Avg Query Time'::TEXT,
    ROUND(AVG(mean_exec_time)::numeric, 2)::TEXT || 'ms',
    CASE WHEN AVG(mean_exec_time) > 1000 THEN 'WARNING' ELSE 'OK' END
  FROM pg_stat_statements
  WHERE query NOT LIKE '%pg_stat%';

  -- Data integrity
  RETURN QUERY
  SELECT
    'Orphaned Records'::TEXT,
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'CRITICAL' ELSE 'OK' END
  FROM itinerary
  WHERE port_id NOT IN (SELECT id FROM ports);
END;
$$ LANGUAGE plpgsql;

-- Run every hour
SELECT * FROM hourly_health_check();
```

### Cleanup (Only After 24 Hours Stable)
```sql
-- ONLY execute after 24 hours of stability

-- Remove old columns (point of no return)
ALTER TABLE itinerary
  DROP COLUMN location,
  DROP COLUMN port_image_url,
  DROP COLUMN description;

ALTER TABLE events
  DROP COLUMN performer,
  DROP COLUMN theme;

-- Clean up migration artifacts
DROP TABLE port_mapping;
DROP TABLE migration_checksums;
DROP TABLE backup_itinerary;
DROP TABLE backup_events;

-- Drop blue database (after additional validation)
-- This is done at infrastructure level
```

---

## Migration Completion Summary ✅

### What Was Accomplished
1. **Created Normalized Database Structure**:
   - ✅ Created `ports` table with 10 port records
   - ✅ Created `parties` table with 9 party templates
   - ✅ Created `event_talent` junction table for many-to-many relationships
   - ✅ Added `port_id` to itinerary table (100% populated)
   - ✅ Added `party_id` to events table (4 events linked)

2. **Executed Migration Scripts**:
   - ✅ `001_create_ports_parties_tables.sql`
   - ✅ `002_add_foreign_key_columns.sql`
   - ✅ `003_migrate_data.sql`
   - ✅ `004_add_constraints_indexes.sql`
   - ✅ `005_cleanup_old_columns.sql` (views created, columns renamed)

3. **Implemented Storage Classes**:
   - ✅ `PortStorage` - Full CRUD operations with search and statistics
   - ✅ `PartyStorage` - Complete management with usage tracking
   - ✅ `EventTalentStorage` - Junction table management

4. **Updated Frontend**:
   - ✅ Updated `useTripData.ts` with fallback logic
   - ✅ Frontend gracefully handles both old and new data formats
   - ✅ API maintains backward compatibility

### Key Statistics
- **Ports**: 10 records (Athens, Santorini, Miami, etc.)
- **Parties**: 9 templates (White Party, Glow Party, etc.)
- **Itinerary Links**: 17/17 (100%) linked to ports
- **Event Links**: 4/66 (6%) linked to parties (most are talent performances)
- **Migration Time**: ~4 hours total
- **Downtime**: 0 (blue-green deployment used)

### Current State
- Database is normalized with foreign key relationships
- Both frontend and backend fully operational
- Old columns renamed but retained for safety (can be dropped after 24-hour stability)
- Application running on Supabase PostgreSQL (migrated from Railway)
- Images migrated to Supabase Storage (48 images, September 15, 2025)
- Connection strings:
  - Local/Railway: `postgresql://postgres.bxiiodeyqvqqcgzzqzvt:kgayatlantis2025@aws-1-us-east-2.pooler.supabase.com:6543/postgres`
  - Uses Supabase Shared Pooler for IPv4 compatibility
- Storage buckets created: talent-images, destination-images, event-images, cruise-images, party-images

---

## Rollback Procedures

### Instant Rollback (During Migration)
```sql
-- At any point during migration on green database
ROLLBACK TO SAVEPOINT data_migration;
-- Or complete rollback
ROLLBACK;
```

### Blue-Green Rollback (After Cutover)
```bash
# Simply switch connection back to blue database
# Update connection string
# Restart application
# Blue database is unchanged and ready
```

### Emergency Recovery
```sql
-- If both databases corrupted (unlikely)
-- Restore from backup
pg_restore -d emergency_db backup_file.sql

-- Restore images from Cloudinary backup
-- Restore application from git
```

---

## Success Criteria

### Must Pass Before Cutover
- [ ] All migration tests passing
- [ ] Performance baselines maintained or improved
- [ ] Zero data loss (checksum validation)
- [ ] Frontend updates complete and tested
- [ ] No critical errors in logs

### 24-Hour Monitoring Metrics
- [ ] Error rate <0.1%
- [ ] Query performance <2 seconds
- [ ] No orphaned records
- [ ] User reports positive
- [ ] All health checks passing

---

## Key Improvements from Original Plan

1. **Simplified to single phase** - Part of Phase 2, not separate
2. **Blue-green deployment** - Zero-downtime migration
3. **Combined with frontend** - Updates happen together
4. **Automated rollback** - Instant recovery if issues
5. **Continuous monitoring** - Real-time health checks
6. **Clear success criteria** - Objective pass/fail metrics

---

*This simplified plan integrates with Phase 2 of the main backend plan for streamlined execution.*