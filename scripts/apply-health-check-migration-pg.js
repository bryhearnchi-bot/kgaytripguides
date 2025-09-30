import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });

async function applyMigration() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

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

    await client.query(sql);
    console.log('✅ Migration applied successfully!');

    // Test the function
    console.log('\nTesting health_check function...');
    const result = await client.query('SELECT public.health_check()');
    console.log('✅ Function test successful:', result.rows[0].health_check);

    await client.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await client.end();
    process.exit(1);
  }
}

applyMigration();