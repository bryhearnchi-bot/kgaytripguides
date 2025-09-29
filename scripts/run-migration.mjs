// Migration runner script for applying Supabase migrations
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Please provide migration file name (e.g., 20250928000000_trip_info_sections_redesign_phase1.sql)');
  process.exit(1);
}

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migrationFile);
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log(`Running migration: ${migrationFile}`);
    console.log('SQL Preview:', migrationSQL.substring(0, 200) + '...');

    // Use Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Migration failed:', response.status, errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('Migration completed successfully!');
    console.log('Result:', result);

  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();