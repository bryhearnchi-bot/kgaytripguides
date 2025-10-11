import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addLocationHighlights() {
  console.log('Adding top_attractions and top_lgbt_venues columns to locations table...');

  // First, let's check if columns already exist
  const { data: existingData, error: checkError } = await supabase
    .from('locations')
    .select('top_attractions, top_lgbt_venues')
    .limit(1);

  if (!checkError) {
    console.log('Columns already exist!');
    return;
  }

  // Add the columns via raw SQL
  const alterSQL = `
    ALTER TABLE locations
    ADD COLUMN IF NOT EXISTS top_attractions JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS top_lgbt_venues JSONB DEFAULT '[]'::jsonb;

    COMMENT ON COLUMN locations.top_attractions IS 'Array of top 3 tourist attractions for this location';
    COMMENT ON COLUMN locations.top_lgbt_venues IS 'Array of top 3 LGBT+/gay bars or venues for this location';
  `;

  console.log('\nPlease run this SQL in the Supabase SQL Editor:');
  console.log('='.repeat(80));
  console.log(alterSQL);
  console.log('='.repeat(80));
  console.log('\nOr run: node scripts/apply-sql-migration.js');
}

addLocationHighlights().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
