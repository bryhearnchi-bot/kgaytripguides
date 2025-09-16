# Supabase Migration Guide

## Phase 3: Platform Migration to Supabase

### Phase 3.1: Supabase Setup ✅

Database export has been completed successfully. The following files have been generated in the `database-export/` directory:

1. **schema.sql** - Database table definitions
2. **data.sql** - All data from Railway database
3. **railway-export.sql** - Combined schema + data
4. **supabase-import.sql** - Ready-to-import file with Supabase extensions and RLS policies

### Export Summary

- **Total tables exported**: 9
- **Total rows exported**: 184
  - cruises: 2 rows
  - talent: 31 rows
  - ports: 17 rows
  - parties: 16 rows
  - itinerary: 17 rows
  - events: 66 rows
  - trip_info_sections: 4 rows
  - cruise_talent: 31 rows

### Phase 3.2: Migration Steps

#### Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Configure:
   - **Project Name**: kgay-travel-guides
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier

#### Step 2: Import Database

1. Once project is created, go to **SQL Editor** in Supabase dashboard
2. Open the file `database-export/supabase-import.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run" to execute the migration

This will:
- Enable required extensions (uuid-ossp, pgcrypto)
- Create all tables with proper schema
- Import all data from Railway
- Set up Row Level Security (RLS) policies
- Create indexes for performance

#### Step 3: Configure Connection

1. In Supabase dashboard, go to **Settings** → **Database**
2. Copy the connection string (choose "Pooling" mode for production)
3. Create or update `.env.supabase`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Connection (Pooled)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true

# Direct Connection (for migrations)
DIRECT_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### Step 4: Update Application Configuration

1. Update `server/storage.ts`:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

// Use Supabase connection
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

export const db = drizzle(pool);
```

2. Update MCP configuration if needed

#### Step 5: Test the Migration

Run these verification checks:

```bash
# Test database connection
node -e "
import pg from 'pg';
const client = new pg.Client({
  connectionString: 'YOUR_SUPABASE_CONNECTION_STRING'
});
await client.connect();
const result = await client.query('SELECT COUNT(*) FROM cruises');
console.log('Cruises:', result.rows[0].count);
await client.end();
"

# Run the application with new database
DATABASE_URL=YOUR_SUPABASE_CONNECTION_STRING npm run dev
```

### Phase 3.3: Post-Migration Tasks

#### Security Configuration

1. **Row Level Security (RLS)**:
   - Review and adjust the default RLS policies in Supabase dashboard
   - Currently set to allow read access for all, write access for authenticated users
   - Customize based on your authentication strategy

2. **API Keys**:
   - Store service role key securely (server-side only)
   - Use anon key for client-side operations
   - Never expose service role key in frontend code

#### Performance Optimization

1. **Connection Pooling**:
   - Use pooled connection string for production
   - Configure pool size based on expected load

2. **Indexes**:
   - Review query performance in Supabase dashboard
   - Add additional indexes as needed

#### Backup Strategy

1. **Automatic Backups**:
   - Supabase provides daily backups on paid plans
   - Configure Point-in-Time Recovery (PITR) for critical data

2. **Manual Backups**:
   - Use the export script periodically: `node scripts/export-railway-db.js`
   - Store backups in secure location

### Rollback Plan

If issues occur during migration:

1. Application continues running on Railway database (no changes made yet)
2. Export files are preserved in `database-export/` directory
3. Can re-run import after fixing any issues
4. Railway database remains unchanged and operational

### Migration Timeline

- **Phase 3.1**: ✅ Complete - Database exported
- **Phase 3.2**: Ready to execute - Awaiting Supabase project creation
- **Phase 3.3**: Pending - Post-migration optimization

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Migration Guide](https://supabase.com/docs/guides/database/migrating-to-supabase)
- [Drizzle ORM with Supabase](https://orm.drizzle.team/docs/get-started-postgresql#supabase)

## Notes

- All sensitive data (API keys, passwords) should be stored in environment variables
- The export script has preserved all data integrity and foreign key relationships
- RLS policies need to be customized based on your authentication requirements
- Consider enabling Supabase Auth for user management features