import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getTableSchema() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'itinerary'
      ORDER BY ordinal_position;
    `);

    console.log('Itinerary table schema:\n');
    result.rows.forEach(row => {
      console.log(
        `  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`
      );
    });
  } catch (error) {
    console.error('❌ Query failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

getTableSchema();
