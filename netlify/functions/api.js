exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Use Neon extension connection
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);

    // Parse the request path
    const path = event.path.replace('/.netlify/functions/api', '') || '/';

    if (path === '/trips' || path === '/') {
      // Get all trips
      const trips = await sql`SELECT * FROM cruises ORDER BY "startDate" DESC LIMIT 10`;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(trips || [])
      };
    }

    // Handle trip complete requests
    if (path.includes('/complete')) {
      // Extract slug from path like /trips/aug-2025/complete
      const slug = path.split('/')[2];
      if (!slug) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Trip slug required' })
        };
      }

      // Get trip
      const trips = await sql`SELECT * FROM cruises WHERE slug = ${slug} LIMIT 1`;
      const trip = trips[0];

      if (!trip) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Trip not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...trip,
          itinerary: [],
          events: [],
          talent: []
        })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};