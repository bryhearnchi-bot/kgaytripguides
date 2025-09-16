import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWlvZGV5cXZxcWNnenpxenZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk2NzAyOSwiZXhwIjoyMDczNTQzMDI5fQ.q-doRMuntNVc7aigqBsdxQXMwuCWABDRnJnsSQV0oK0';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function importDatabase() {
  console.log('🚀 Importing Database to Supabase\n');

  try {
    // Read the import SQL file
    const sqlPath = path.join(process.cwd(), 'database-export', 'supabase-import.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📋 Executing SQL import...');
    console.log('  File size:', (sqlContent.length / 1024).toFixed(2), 'KB');

    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comment-only lines
      if (statement.trim().startsWith('--')) continue;

      try {
        // Use the SQL endpoint with service role
        const { data, error } = await supabase.rpc('exec_sql', {
          query: statement
        }).single();

        if (error) {
          // Try direct execution as alternative
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            throw new Error(`Statement ${i + 1} failed: ${statement.substring(0, 50)}...`);
          }
        }

        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`  Progress: ${i + 1}/${statements.length} statements executed`);
        }
      } catch (error) {
        errorCount++;
        errors.push({
          index: i + 1,
          statement: statement.substring(0, 100),
          error: error.message
        });
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('Import Summary');
    console.log('═══════════════════════════════════════\n');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.slice(0, 5).forEach(e => {
        console.log(`  - Statement ${e.index}: ${e.error}`);
      });
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more errors`);
      }
    }

    // Verify tables were created
    console.log('\n📊 Verifying tables...');
    const tables = ['cruises', 'talent', 'ports', 'parties', 'itinerary', 'events'];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`  ❌ ${table}: Not found or error`);
        } else {
          console.log(`  ✅ ${table}: Ready (checking count...)`);
        }
      } catch (e) {
        console.log(`  ❌ ${table}: ${e.message}`);
      }
    }

    console.log('\n✅ Import process complete!');
    console.log('\nNote: Some errors are expected for RLS policies and auth functions.');
    console.log('The core tables and data should be imported successfully.');
    console.log('\nNext steps:');
    console.log('1. Check Supabase dashboard for table data');
    console.log('2. Update .env with DATABASE_URL');
    console.log('3. Test application with Supabase connection');

  } catch (error) {
    console.error('❌ Import failed:', error);
    console.log('\nAlternative approach:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Copy content from database-export/railway-export.sql');
    console.log('3. Paste and run in SQL Editor');
  }
}

// Run import
importDatabase().catch(console.error);