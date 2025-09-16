# 🚀 Quick Supabase Import Instructions

You have everything ready! Here's how to import the database manually:

## Step 1: Open Supabase SQL Editor
**Direct link**: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/sql/new

## Step 2: Copy the Import SQL
Open this file and copy ALL contents:
```
database-export/supabase-import.sql
```

Or use the simpler version without RLS:
```
database-export/railway-export.sql
```

## Step 3: Paste and Run
1. Paste the entire SQL into the SQL Editor
2. Click the **RUN** button (or press Cmd+Enter)
3. Wait for completion (should take ~30 seconds)

## Step 4: Verify Import
Go to **Table Editor**: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/editor

Check these tables exist with data:
- ✅ cruises (2 rows)
- ✅ talent (31 rows)
- ✅ ports (17 rows)
- ✅ parties (16 rows)
- ✅ itinerary (17 rows)
- ✅ events (66 rows)

## Step 5: Update Your Local App

Add to your `.env` file:
```env
# Supabase Database
DATABASE_URL=postgresql://postgres:kgayatlantis2025@db.bxiiodeyqvqqcgzzqzvt.supabase.co:5432/postgres
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWlvZGV5cXZxcWNnenpxenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjcwMjksImV4cCI6MjA3MzU0MzAyOX0.Y9juoQm7q_6ky4EUvLI3YR9VIHuhJah5me85CwsKsVc
```

## Step 6: Restart Your App
```bash
# Stop current servers (Ctrl+C)
# Then restart with Supabase:
DATABASE_URL=postgresql://postgres:kgayatlantis2025@db.bxiiodeyqvqqcgzzqzvt.supabase.co:5432/postgres npm run dev
```

## That's it! 🎉

Your app should now be running with Supabase!

---

## Troubleshooting

**If you get "relation already exists" errors:**
- The tables might already exist
- Drop them first: Run `DROP TABLE IF EXISTS cruise_talent, trip_info_sections, event_talent, events, itinerary, parties, ports, talent, cruises CASCADE;`
- Then try import again

**If connection fails:**
- Check if database is paused in Supabase dashboard
- Try the pooler connection: `postgresql://postgres.bxiiodeyqvqqcgzzqzvt:kgayatlantis2025@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

**MCP Server Connection:**
After this import, to get MCP working:
1. Restart Claude Desktop app completely (quit and reopen)
2. The MCP server should connect with the access token we configured