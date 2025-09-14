const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only handle GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get cruise slug from path
    const slug = event.path.split('/').pop(); // Gets "aug-2025" from "/api/trips/aug-2025/complete"

    if (!slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Cruise slug is required' }),
      };
    }

    // Connect to database
    const client = neon(process.env.DATABASE_URL);

    // Get trip/cruise data
    const trips = await client`
      SELECT * FROM cruises
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (trips.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Trip not found' }),
      };
    }

    const trip = trips[0];

    // Get itinerary data
    const itinerary = await client`
      SELECT * FROM itinerary
      WHERE "cruiseId" = ${trip.id}
      ORDER BY day ASC
    `;

    // Get events data
    const events = await client`
      SELECT * FROM events
      WHERE "cruiseId" = ${trip.id}
      ORDER BY date ASC, time ASC
    `;

    // Get talent data
    const talent = await client`
      SELECT t.* FROM talent t
      JOIN cruise_talent ct ON t.id = ct."talentId"
      WHERE ct."cruiseId" = ${trip.id}
      ORDER BY t.name ASC
    `;

    // Return complete trip data
    const response = {
      trip,
      itinerary,
      events,
      talent
    };

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
    };
  }
};