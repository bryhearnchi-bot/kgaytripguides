const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow GET requests for this endpoint
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract slug from the path
    // Path will be like /trips/greek-isles-2025/complete
    const pathSegments = event.path.replace('/.netlify/functions/trips/', '').split('/').filter(Boolean);

    // Handle trips/{slug}/complete
    if (pathSegments.length >= 2 && pathSegments[pathSegments.length - 1] === 'complete') {
      const slug = pathSegments[pathSegments.length - 2];

      // Get cruise data
      const cruiseResult = await sql`
        SELECT * FROM cruises WHERE slug = ${slug} LIMIT 1
      `;

      if (cruiseResult.length === 0) {
        return {
          statusCode: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Trip not found' })
        };
      }

      const cruise = cruiseResult[0];

      // Get itinerary
      const itinerary = await sql`
        SELECT * FROM itinerary WHERE cruise_id = ${cruise.id} ORDER BY order_index
      `;

      // Get events
      const events = await sql`
        SELECT * FROM events WHERE cruise_id = ${cruise.id} ORDER BY date, time
      `;

      // Get talent
      const talent = await sql`
        SELECT * FROM talent ORDER BY name
      `;

      const response = {
        trip: {
          id: cruise.id,
          name: cruise.name,
          slug: cruise.slug,
          startDate: cruise.start_date,
          endDate: cruise.end_date,
          status: cruise.status,
          heroImageUrl: cruise.hero_image_url,
          description: cruise.description,
          shortDescription: cruise.short_description,
          featured: cruise.featured,
          shipName: cruise.ship_name,
          cruiseLine: cruise.cruise_line
        },
        itinerary: itinerary.map(item => ({
          id: item.id,
          cruiseId: item.cruise_id,
          date: item.date,
          day: item.day,
          portName: item.port_name,
          country: item.country,
          arrivalTime: item.arrival_time,
          departureTime: item.departure_time,
          allAboardTime: item.all_aboard_time,
          portImageUrl: item.port_image_url,
          description: item.description,
          highlights: item.highlights,
          orderIndex: item.order_index,
          segment: item.segment
        })),
        events: events.map(event => ({
          id: event.id,
          cruiseId: event.cruise_id,
          date: event.date,
          time: event.time,
          title: event.title,
          type: event.type,
          venue: event.venue,
          deck: event.deck,
          description: event.description,
          shortDescription: event.short_description,
          imageUrl: event.image_url,
          themeDescription: event.theme_description,
          dressCode: event.dress_code,
          capacity: event.capacity,
          requiresReservation: event.requires_reservation,
          talentIds: event.talent_ids,
          createdAt: event.created_at,
          updatedAt: event.updated_at
        })),
        talent: talent.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          bio: t.bio,
          knownFor: t.known_for,
          profileImageUrl: t.profile_image_url,
          socialLinks: t.social_links,
          website: t.website,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        }))
      };

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      };
    }

    return {
      statusCode: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Function error:', error);

    // Handle database connection errors specifically
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          error: 'Database unavailable',
          message: 'Database schema not found. Please check database setup.'
        })
      };
    }

    // Handle network/connection errors
    if (error.message.includes('connect') || error.message.includes('network')) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          error: 'Service unavailable',
          message: 'Unable to connect to database. Please try again later.'
        })
      };
    }

    // Generic server error
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred.'
      })
    };
  }
};