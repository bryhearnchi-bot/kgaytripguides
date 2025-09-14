const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract trip slug from path
    const pathParts = event.path.split('/');
    const tripSlug = pathParts[pathParts.length - 2]; // /api/trips/aug-2025/complete

    const sql = neon(process.env.DATABASE_URL);

    // Get trip
    const trips = await sql`SELECT * FROM cruises WHERE slug = ${tripSlug}`;
    const trip = trips[0];

    if (!trip) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Trip not found' })
      };
    }

    // Get itinerary
    const itinerary = await sql`
      SELECT * FROM itinerary
      WHERE "cruiseId" = ${trip.id}
      ORDER BY day
    `;

    // Get events
    const events = await sql`
      SELECT * FROM "partyEvents"
      WHERE "cruiseId" = ${trip.id}
      ORDER BY date
    `;

    // Get talent
    const talent = await sql`SELECT * FROM talent ORDER BY name`;

    const result = {
      ...trip,
      itinerary,
      events,
      talent
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch trip data',
        message: error.message
      })
    };
  }
};