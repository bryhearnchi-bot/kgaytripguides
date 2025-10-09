/**
 * Venue Restructuring Migration Script
 * Runs the clean venue migration on the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting venue restructuring migration...\n');

  try {
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/20251009100000_restructure_venues_clean.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements (basic splitting on semicolons)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      // Skip comments
      if (statement.startsWith('--') || statement.startsWith('/*')) continue;

      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';',
      });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        failCount++;
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
      }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`   Success: ${successCount} statements`);
    console.log(`   Failed: ${failCount} statements`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
