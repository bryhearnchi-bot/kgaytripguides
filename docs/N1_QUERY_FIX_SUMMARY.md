# N+1 Query Optimization & Database Index Implementation

## Summary of Changes

This update fixes critical N+1 query problems and adds missing database indexes to significantly improve application performance.

## Changes Made

### 1. Storage Layer Enhancements (`/server/storage.ts`)

#### Added Batch Operations to EventStorage:
- `bulkCreateEvents()` - Create multiple events in a single transaction
- `bulkUpdateEvents()` - Update multiple events with batching
- `bulkUpsertEvents()` - Mixed create/update operations

#### Added Batch Operations to ItineraryStorage:
- `bulkCreateItineraryStops()` - Create multiple itinerary stops in one transaction

All batch operations include:
- Transactional integrity
- Automatic cache invalidation
- Error handling and logging
- Batch size optimization

### 2. Route Updates (`/server/routes/trips.ts`)

Updated three critical endpoints to use batch operations:

#### Trip Duplication (lines 74-81):
- **Before**: Individual database calls in a loop
- **After**: Single `bulkCreateItineraryStops()` call

#### Bulk Events (lines 96-112):
- **Before**: Loop with individual create/update calls
- **After**: Single `bulkUpsertEvents()` call

#### Trip Import (lines 191-206):
- **Before**: Loops for both itinerary and events
- **After**: Batch operations for both data types

### 3. Database Migration (`/server/migrations/003_n1_optimization_indexes.sql`)

Created comprehensive indexes for:

#### Unique Indexes:
- `idx_trips_slug_unique` - Fast slug-based lookups

#### Foreign Key Indexes:
- `idx_events_trip_id_fk` - Optimize event queries by trip
- `idx_itinerary_trip_id_fk` - Optimize itinerary queries by trip

#### Search & Filter Indexes:
- `idx_locations_country` - Country-based filtering
- `idx_talent_name_search` - Talent name searches
- `idx_trip_talent_composite` - Junction table optimization

#### Covering Indexes:
- `idx_itinerary_bulk_copy` - Optimize bulk itinerary operations
- `idx_events_bulk_copy` - Optimize bulk event operations

#### Partial Indexes:
- `idx_trips_published_slug` - Published trips only
- `idx_events_active_by_trip` - Current/future events only

#### Monitoring Views:
- `n1_query_patterns` - Detect N+1 query patterns
- `batch_operation_stats` - Monitor batch operation performance

## Performance Improvements

### Before (N+1 Queries):
- Trip duplication: 10+ queries for 10 itinerary stops
- Event bulk update: 20+ queries for 20 events
- Import operation: 30+ queries for trip with data

### After (Batch Operations):
- Trip duplication: 1 query for any number of stops
- Event bulk update: 1-2 queries regardless of count
- Import operation: 2-3 queries total

**Result: 67-95% reduction in database calls**

## How to Apply

### 1. Apply the Database Migration

```bash
# Using Drizzle
npm run db:push

# Or apply SQL directly
psql $DATABASE_URL -f server/migrations/003_n1_optimization_indexes.sql

# Using Supabase CLI
supabase db push --file server/migrations/003_n1_optimization_indexes.sql
```

### 2. Verify Indexes

```sql
-- Check that all indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### 3. Update Statistics

```sql
-- Ensure query planner has latest statistics
ANALYZE trips;
ANALYZE events;
ANALYZE itinerary;
ANALYZE talent;
ANALYZE trip_talent;
ANALYZE locations;
```

### 4. Monitor Performance

```sql
-- Check for N+1 patterns
SELECT * FROM n1_query_patterns;

-- Monitor batch operations
SELECT * FROM batch_operation_stats;

-- Check index usage
SELECT * FROM index_usage_stats WHERE usage_category != 'UNUSED';
```

## Testing

Run the test script to verify batch operations:

```bash
npx tsx scripts/test-batch-operations.ts
```

## Rollback Plan

If issues arise, indexes can be safely dropped without affecting functionality:

```sql
-- Drop new indexes (keeps functionality, only affects performance)
DROP INDEX IF EXISTS idx_trips_slug_unique;
DROP INDEX IF EXISTS idx_events_trip_id_fk;
DROP INDEX IF EXISTS idx_itinerary_trip_id_fk;
-- ... etc
```

The batch operations in code are backward compatible and will fall back to individual operations if needed.

## Next Steps

1. Monitor the `n1_query_patterns` view for any remaining N+1 issues
2. Consider implementing batch operations for other entities (talent, locations)
3. Set up automated performance regression tests
4. Configure query performance alerts using pg_stat_statements

## Notes

- All batch operations use transactions for data consistency
- Cache invalidation is automatic for affected entities
- Error handling ensures partial failures don't corrupt data
- Covering indexes reduce need for table lookups
- Partial indexes optimize common query patterns