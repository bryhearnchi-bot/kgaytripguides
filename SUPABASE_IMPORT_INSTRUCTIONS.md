# Supabase Database Import Instructions

## Quick Import Steps

Your Supabase project is ready at: `bxiiodeyqvqqcgzzqzvt.supabase.co`

### Step 1: Access SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt)
2. Click on **SQL Editor** in the left sidebar

### Step 2: Import Database

Choose one of these options:

#### Option A: Full Import with RLS (Recommended)
1. Open file: `database-export/supabase-import.sql`
2. Copy ALL contents (Cmd+A, Cmd+C)
3. Paste into SQL Editor
4. Click **Run** button

This includes:
- Extensions (uuid-ossp, pgcrypto)
- All tables with proper schema
- All data (184 rows)
- Basic RLS policies

#### Option B: Simple Import (Schema + Data only)
1. Open file: `database-export/railway-export.sql`
2. Copy ALL contents
3. Paste into SQL Editor
4. Click **Run** button

This includes:
- All tables
- All data
- No RLS policies (add later)

### Step 3: Verify Import

After running the SQL, verify in the **Table Editor**:

Expected row counts:
- `cruises`: 2 rows
- `talent`: 31 rows
- `ports`: 17 rows
- `parties`: 16 rows
- `itinerary`: 17 rows
- `events`: 66 rows
- `trip_info_sections`: 4 rows
- `cruise_talent`: 31 rows

### Step 4: Get Database Password

1. Go to **Settings** → **Database** in Supabase dashboard
2. Find **Connection string** section
3. Click **Reveal** to show your database password
4. Copy the password (starts after `postgres:` and before `@`)

### Step 5: Update Environment Variables

Create or update `.env.production`:

```env
# Supabase Configuration
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWlvZGV5cXZxcWNnenpxenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjcwMjksImV4cCI6MjA3MzU0MzAyOX0.Y9juoQm7q_6ky4EUvLI3YR9VIHuhJah5me85CwsKsVc

# Database Connection (replace [YOUR-PASSWORD] with actual password from Step 4)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.bxiiodeyqvqqcgzzqzvt.supabase.co:5432/postgres

# For connection pooling (production)
DATABASE_URL_POOLED=postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Keep service role key secure (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWlvZGV5cXZxcWNnenpxenZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk2NzAyOSwiZXhwIjoyMDczNTQzMDI5fQ.q-doRMuntNVc7aigqBsdxQXMwuCWABDRnJnsSQV0oK0
```

### Step 6: Test Connection

Run this test after updating `.env.production`:

```bash
# Source the new environment
source .env.production

# Test connection
node -e "
import pg from 'pg';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const result = await client.query('SELECT COUNT(*) FROM cruises');
console.log('Connection successful! Cruises:', result.rows[0].count);
await client.end();
"
```

### Step 7: Update Application

1. Update `server/storage.ts` to use Supabase:

```typescript
const connectionString = process.env.DATABASE_URL;
```

2. Restart the application:

```bash
# Stop current servers (Ctrl+C in each terminal)
# Then restart with new database
DATABASE_URL=[your-supabase-url] npm run dev
```

## Troubleshooting

### If import fails:
1. Check for existing tables - drop them first if needed
2. Run statements in smaller batches
3. Check SQL Editor output for specific errors

### If connection fails:
1. Verify password is correct (no special character issues)
2. Check if database is paused (Settings → Database → Status)
3. Try pooled connection string instead

### Common Issues:
- **"permission denied"**: Use service role key for admin operations
- **"relation does not exist"**: Tables weren't created - re-run schema.sql
- **"duplicate key"**: Data already exists - drop tables and retry

## Next Steps

After successful import:

1. ✅ Test application with Supabase database
2. ✅ Configure Row Level Security policies
3. ✅ Set up automated backups
4. ✅ Enable monitoring and alerts
5. ✅ Update deployment configuration

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Connection Strings Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)
- Project Dashboard: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt