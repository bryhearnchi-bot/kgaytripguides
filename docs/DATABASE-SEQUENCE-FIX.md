# Database Sequence Fix Documentation

## Problem Description

PostgreSQL sequences can become out of sync with the actual data in tables, causing "duplicate key value violates unique constraint" errors when trying to insert new records. This commonly occurs with the `talent` table but can affect any table with auto-incrementing IDs.

### Common Causes
- Manual data insertion with explicit IDs
- Data migration from another database
- Restored backups where sequences weren't properly restored
- Direct SQL inserts that bypass the sequence

## Solution Overview

We've implemented a comprehensive solution with multiple approaches:

1. **Immediate SQL Fix** - For urgent resolution
2. **API Endpoints** - For programmatic fixing
3. **Stored Procedures** - For database-level management
4. **Utility Functions** - For application-level handling

## Quick Fix Instructions

### Option 1: Immediate SQL Fix (Recommended)

1. Open your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run the script from `scripts/fix-talent-sequence.sql`:

```sql
-- Fix the talent sequence
DO $$
DECLARE
  max_id INTEGER;
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM talent;
  next_id := max_id + 1;
  PERFORM setval('talent_id_seq', next_id, false);
  RAISE NOTICE 'Talent sequence fixed! Max ID was %, sequence now set to %', max_id, next_id;
END $$;
```

### Option 2: Run Migration

Apply the migration that fixes all sequences and adds helper functions:

```bash
# The migration file: supabase/migrations/20250128000000_fix_sequences_and_add_procedures.sql
# This will automatically fix all sequences when deployed
```

### Option 3: Use API Endpoint

If you have super admin access, you can use the API endpoint:

```bash
# Fix just the talent table
curl -X POST http://localhost:3001/api/admin/sequences/fix/talent \
  -H "Authorization: Bearer YOUR_TOKEN"

# Fix all tables
curl -X POST http://localhost:3001/api/admin/sequences/fix-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing the Fix

Run the test script to verify the fix worked:

```bash
npx tsx server/test-sequence-fix.ts
```

Expected output:
```
✅ SUCCESS: Talent created with ID [number]
   The sequence is working correctly!
```

## Files Created

### 1. Sequence Fix Utility
**File:** `server/utils/sequence-fix.ts`
- Core utility functions for fixing sequences
- Supports all tables with auto-incrementing IDs
- Generates SQL commands for manual fixes

### 2. Admin API Routes
**File:** `server/routes/admin-sequences.ts`
- `/api/admin/sequences/status` - Check sequence status
- `/api/admin/sequences/fix/:tableName` - Fix specific table
- `/api/admin/sequences/fix-all` - Fix all tables
- `/api/admin/sequences/fix-sql` - Generate fix SQL
- `/api/admin/sequences/stored-procedure-sql` - Get stored procedure creation SQL

### 3. SQL Migration
**File:** `supabase/migrations/20250128000000_fix_sequences_and_add_procedures.sql`
- Creates stored procedures for sequence management
- Fixes all existing sequences
- Adds diagnostic views and functions

### 4. Quick Fix Script
**File:** `scripts/fix-talent-sequence.sql`
- Immediate fix for talent table sequence
- Includes diagnostics and verification
- Can be run directly in Supabase SQL editor

### 5. Test Script
**File:** `server/test-sequence-fix.ts`
- Tests if sequences are working correctly
- Creates and deletes a test talent entry
- Provides clear success/failure messages

## Stored Procedures Added

After running the migration, you'll have these database functions:

1. **`reset_sequence(sequence_name, new_value)`** - Reset any sequence
2. **`fix_table_sequence(table_name)`** - Fix a specific table's sequence
3. **`get_sequence_diagnostics()`** - Get diagnostic info for all sequences

Example usage in SQL:
```sql
-- Fix talent table sequence
SELECT fix_table_sequence('talent');

-- Get diagnostics for all tables
SELECT * FROM get_sequence_diagnostics();
```

## Preventing Future Issues

### Best Practices
1. Always use the application's API for data insertion
2. Avoid manual SQL inserts with explicit IDs
3. After data migrations, always check and fix sequences
4. Use the provided utility functions for bulk operations

### Monitoring
- Check sequence status regularly: `/api/admin/sequences/status`
- Monitor for duplicate key errors in logs
- Run diagnostics after any data import/migration

## Troubleshooting

### If the fix doesn't work:

1. **Check for highest ID conflicts:**
   ```sql
   SELECT id FROM talent ORDER BY id DESC LIMIT 10;
   ```

2. **Manually set sequence to a safe value:**
   ```sql
   SELECT setval('talent_id_seq', 1000, false); -- Use a value higher than any existing ID
   ```

3. **Verify sequences exist:**
   ```sql
   SELECT * FROM pg_sequences WHERE sequencename LIKE '%talent%';
   ```

### Common Error Messages

**"duplicate key value violates unique constraint"**
- Run the sequence fix for the affected table

**"relation does not exist"**
- The sequence name might be different, check with:
  ```sql
  SELECT * FROM pg_sequences WHERE schemaname = 'public';
  ```

**"permission denied"**
- Ensure you're using super admin credentials or the service role key

## Support

If issues persist after trying these solutions:

1. Check the error logs in the application
2. Verify database permissions
3. Ensure Supabase service role key is configured
4. Contact database administrator for manual intervention

## Notes

- The sequence fix is idempotent (safe to run multiple times)
- The fix uses `GREATEST` to ensure sequences never go backwards
- All fixes preserve existing data integrity
- The solution works with Supabase's row-level security