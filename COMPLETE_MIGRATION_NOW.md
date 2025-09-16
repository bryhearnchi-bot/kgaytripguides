# 🚨 Complete Supabase Migration - Final Steps

## Current Status
✅ **Tables Created**: All 9 tables successfully created in Supabase
⚠️ **Data Partially Imported**: Only 2 cruises and 5 talent rows imported
❌ **Missing Data**: Need to import remaining 177 rows

## Quick Fix - Import Remaining Data

### Option 1: Via SQL Editor (Recommended - 2 minutes)

1. **Go to SQL Editor**: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/sql/new

2. **Copy and paste this file**: `database-export/data.sql`

3. **Click RUN**

That's it! All 184 rows will be imported.

### Option 2: Use the Combined File

If Option 1 has errors, use the complete file:

1. **Go to SQL Editor**: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/sql/new

2. **First, clear existing partial data**:
```sql
TRUNCATE TABLE cruise_talent, trip_info_sections, event_talent, events, itinerary, parties, ports, talent, cruises CASCADE;
```

3. **Then import everything**: Copy contents of `database-export/railway-export.sql`

4. **Click RUN**

## Verify Import Success

After import, check the **Table Editor**: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/editor

You should see:
- ✅ cruises: 2 rows
- ✅ talent: 31 rows
- ✅ ports: 17 rows
- ✅ parties: 16 rows
- ✅ itinerary: 17 rows
- ✅ events: 66 rows
- ✅ trip_info_sections: 4 rows
- ✅ cruise_talent: 31 rows

**Total: 184 rows**

## Final Step: Update Your App

Add to `.env`:
```bash
DATABASE_URL=postgresql://postgres:kgayatlantis2025@db.bxiiodeyqvqqcgzzqzvt.supabase.co:5432/postgres
```

Restart your app:
```bash
npm run dev
```

## Why Manual Import?

The MCP server has limitations with large SQL batches. The manual SQL Editor handles the full import perfectly in one go.

## Need Help?

- The data is safe in `database-export/data.sql`
- Tables are already created and waiting
- Just need to run the SQL to complete migration

---

**Time to complete: ~2 minutes**