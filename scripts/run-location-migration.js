import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Adding top_attractions and top_lgbt_venues columns...');

    await client.query(`
      ALTER TABLE locations
      ADD COLUMN IF NOT EXISTS top_attractions JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS top_lgbt_venues JSONB DEFAULT '[]'::jsonb;
    `);

    await client.query(`
      COMMENT ON COLUMN locations.top_attractions IS 'Array of top 3 tourist attractions for this location';
    `);

    await client.query(`
      COMMENT ON COLUMN locations.top_lgbt_venues IS 'Array of top 3 LGBT+/gay bars or venues for this location';
    `);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
