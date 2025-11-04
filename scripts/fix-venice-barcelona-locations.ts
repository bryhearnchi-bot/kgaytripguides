import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../server/logging/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Location IDs that were just created (plus Venice which was updated)
const locationIds = [98, 99, 100, 101, 102, 103, 104, 105, 106];

function determineCategory(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes('beach') ||
    lower.includes('nature') ||
    lower.includes('park') ||
    lower.includes('garden') ||
    lower.includes('forest') ||
    lower.includes('hill')
  ) {
    return 'Nature';
  } else if (
    lower.includes('historic') ||
    lower.includes('cathedral') ||
    lower.includes('church') ||
    lower.includes('palace') ||
    lower.includes('fort') ||
    lower.includes('castle') ||
    lower.includes('basilica') ||
    lower.includes('temple') ||
    lower.includes('bath') ||
    lower.includes('roman')
  ) {
    return 'Historical';
  } else if (
    lower.includes('museum') ||
    lower.includes('theater') ||
    lower.includes('theatre') ||
    lower.includes('opera') ||
    lower.includes('square') ||
    lower.includes('piazza')
  ) {
    return 'Cultural';
  }
  return 'Cultural'; // Default
}

function determineVenueType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('club') || lower.includes('nightclub')) {
    return 'Club';
  } else if (lower.includes('restaurant') || lower.includes('café') || lower.includes('cafe')) {
    return 'Restaurant';
  } else if (lower.includes('beach')) {
    return 'Beach';
  } else if (lower.includes('hotel')) {
    return 'Hotel';
  } else if (lower.includes('sauna')) {
    return 'Sauna';
  } else if (lower.includes('bar') || lower.includes('lounge')) {
    return 'Bar';
  }
  return 'Bar'; // Default
}

async function main() {
  logger.info('🔧 Fixing Venice to Barcelona location attractions and LGBT venues...\n');

  for (const locationId of locationIds) {
    // Get location data
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('id, name, top_attractions, top_lgbt_venues')
      .eq('id', locationId)
      .single();

    if (locError || !location) {
      logger.error(`Failed to fetch location ${locationId}: ${locError?.message}`);
      continue;
    }

    logger.info(`\n📍 Processing ${location.name} (ID: ${locationId})`);

    // Process attractions
    if (location.top_attractions && Array.isArray(location.top_attractions)) {
      logger.info(`  Adding ${location.top_attractions.length} attractions...`);

      for (let i = 0; i < location.top_attractions.length; i++) {
        const attraction = location.top_attractions[i];
        const dashIndex = attraction.indexOf(' - ');
        const name = dashIndex > 0 ? attraction.substring(0, dashIndex).trim() : attraction.trim();
        const description = dashIndex > 0 ? attraction.substring(dashIndex + 3).trim() : '';
        const category = determineCategory(attraction);

        const { error: attractionError } = await supabase.from('location_attractions').insert({
          location_id: locationId,
          name: name,
          description: description,
          category: category,
          order_index: i,
        });

        if (attractionError) {
          logger.warn(`    ⚠️  Failed: ${name} - ${attractionError.message}`);
        } else {
          logger.info(`    ✅ ${name}`);
        }
      }
    }

    // Process LGBT venues
    if (location.top_lgbt_venues && Array.isArray(location.top_lgbt_venues)) {
      logger.info(`  Adding ${location.top_lgbt_venues.length} LGBT venues...`);

      for (let i = 0; i < location.top_lgbt_venues.length; i++) {
        const venue = location.top_lgbt_venues[i];
        const dashIndex = venue.indexOf(' - ');
        const name = dashIndex > 0 ? venue.substring(0, dashIndex).trim() : venue.trim();
        const description = dashIndex > 0 ? venue.substring(dashIndex + 3).trim() : '';
        const venueType = determineVenueType(venue);

        const { error: venueError } = await supabase.from('location_lgbt_venues').insert({
          location_id: locationId,
          name: name,
          venue_type: venueType,
          description: description,
          order_index: i,
        });

        if (venueError) {
          logger.warn(`    ⚠️  Failed: ${name} - ${venueError.message}`);
        } else {
          logger.info(`    ✅ ${name}`);
        }
      }
    }
  }

  logger.info('\n✅ All done! Attractions and LGBT venues have been added to the separate tables.');
  logger.info(
    '🔗 Refresh the trip page to see the changes: http://localhost:3001/trips/venice-to-barcelona-cruise-26'
  );
}

main();
