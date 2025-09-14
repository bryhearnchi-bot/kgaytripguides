const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Extract slug from the path
    // Path will be like /trips/greek-isles-2025/complete
    const pathSegments = event.path.replace('/.netlify/functions/trips/', '').split('/').filter(Boolean);

    // Handle trips/{slug}/complete
    if (pathSegments.length >= 2 && pathSegments[pathSegments.length - 1] === 'complete') {
      const slug = pathSegments[pathSegments.length - 2];

      // Get trip data
      const tripResult = await sql`
        SELECT * FROM trips WHERE slug = ${slug} LIMIT 1
      `;

      if (tripResult.length === 0) {
        return {
          statusCode: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Trip not found' })
        };
      }

      const trip = tripResult[0];

      // Get itinerary
      const itinerary = await sql`
        SELECT * FROM itinerary WHERE cruise_id = ${trip.id} ORDER BY order_index
      `;

      // Get events
      const events = await sql`
        SELECT * FROM events WHERE cruise_id = ${trip.id} ORDER BY date, time
      `;

      // Get talent
      const talent = await sql`
        SELECT * FROM talent ORDER BY name
      `;

      const response = {
        trip: {
          id: trip.id,
          name: trip.name,
          slug: trip.slug,
          startDate: trip.start_date,
          endDate: trip.end_date,
          status: trip.status,
          heroImageUrl: trip.hero_image_url,
          description: trip.description,
          shortDescription: trip.short_description,
          featured: trip.featured,
          shipName: trip.ship_name,
          cruiseLine: trip.cruise_line
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
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};