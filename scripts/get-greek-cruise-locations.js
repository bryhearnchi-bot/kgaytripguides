import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getGreekCruiseLocations() {
  const client = await pool.connect();
  try {
    console.log('Fetching Greek Cruise locations...\n');

    const result = await client.query(`
      SELECT
        l.id,
        l.name,
        l.country,
        i.order_index,
        i.arrival_time,
        i.departure_time,
        i.all_aboard_time
      FROM locations l
      INNER JOIN itinerary i ON l.id = i.location_id
      INNER JOIN trips t ON i.trip_id = t.id
      WHERE t.slug = 'greek-isles-2025'
      ORDER BY i.order_index;
    `);

    console.log(`Found ${result.rows.length} locations:\n`);
    result.rows.forEach(row => {
      console.log(`${row.order_index}. ${row.name}, ${row.country} (ID: ${row.id})`);
      console.log(
        `   Arrival: ${row.arrival_time || 'N/A'}, Departure: ${row.departure_time || 'N/A'}`
      );
      console.log('');
    });

    return result.rows;
  } catch (error) {
    console.error('❌ Query failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

getGreekCruiseLocations();
