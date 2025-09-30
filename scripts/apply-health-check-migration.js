import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying health_check function migration...');

  const sql = `
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN jsonb_build_object(
    'status', 'ok',
    'timestamp', NOW(),
    'database', 'connected',
    'version', version()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION public.health_check() TO anon;

COMMENT ON FUNCTION public.health_check() IS
'Health check function for monitoring system. Returns database status and connection info.';
`;

  const { data, error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('Migration failed:', error);

    // Try alternative approach with direct function call
    console.log('Trying alternative approach...');

    // Create the function directly
    const { data: createData, error: createError } = await supabase.rpc('health_check');

    if (createError && createError.code === '42883') {
      console.log('Function does not exist yet, this is expected.');
      console.log('\nPlease run this SQL manually in the Supabase dashboard:');
      console.log('\n' + sql);
      process.exit(1);
    }

    process.exit(1);
  }

  console.log('Migration applied successfully!');

  // Test the function
  const { data: testData, error: testError } = await supabase.rpc('health_check');

  if (testError) {
    console.error('Function test failed:', testError);
    process.exit(1);
  }

  console.log('Function test successful:', testData);
}

applyMigration().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});