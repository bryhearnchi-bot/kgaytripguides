// Simple API handler for Netlify Functions
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Parse the path
  const path = event.path.replace('/.netlify/functions/api', '');

  // Mock data for trips
  const mockTrips = [{
    id: 1,
    slug: 'aug-2025',
    name: 'Mediterranean August 2025',
    shipName: 'Celebrity Solstice',
    startDate: '2025-08-01',
    endDate: '2025-08-10',
    status: 'active'
  }];

  try {
    // Route handling
    if (path === '/trips' || path === '') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mockTrips)
      };
    }

    if (path.startsWith('/trips/') && path.endsWith('/complete')) {
      // Return complete trip data
      const tripData = {
        ...mockTrips[0],
        itinerary: [],
        events: [],
        talent: []
      };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(tripData)
      };
    }

    // 404 for unknown routes
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
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