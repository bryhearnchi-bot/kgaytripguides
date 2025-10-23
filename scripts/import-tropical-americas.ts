import 'dotenv/config'; // CRITICAL: Load environment variables
import { downloadImageFromUrl } from '../server/image-utils';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../server/logging/logger';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('FATAL: Supabase configuration missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define cruise data structure
const cruiseData = {
  trip: {
    name: 'Tropical Americas Cruise',
    slug: 'tropical-americas-2026',
    description:
      "Experience the most exotic Caribbean cruise featuring 11 unforgettable nights aboard Virgin Voyages' Brilliant Lady. Sail from Miami to pristine ports including ancient Mayan ruins in Costa Maya, lush rainforests of Costa Rica, the historic Panama Canal gateway, UNESCO World Heritage Site Cartagena with an extended 2-day stay, and the stunning beaches of Aruba. Features signature Atlantis entertainment including themed T-dances, world-class DJs, drag performers, and Virgin Voyages' revolutionary dining and entertainment venues.",
    startDate: '2026-01-15 00:00:00', // NO timezone conversion
    endDate: '2026-01-26 00:00:00',
    heroImageUrl:
      'https://cdn.brandfolder.io/74B7KV5M/at/srqgr7kgkzv69grqv8tvgqff/ta26-inline-cartagena-town-walking.jpg', // Will be uploaded
    statusId: 5, // Preview status
    tripTypeId: 1, // Cruise type
    charterCompanyId: 1, // Atlantis
    cruiseLineId: 1, // Virgin Voyages (from ships.cruise_line_id)
    shipId: 12, // Brilliant Lady
  },

  venues: [
    {
      name: 'Extra Virgin',
      type: 'dining', // Restaurant
      description: 'Italian dining experience',
    },
    {
      name: 'Gumbae',
      type: 'dining',
      description: 'Korean BBQ experience',
    },
    {
      name: 'Test Kitchen',
      type: 'dining',
      description: 'Inventive tasting menu',
    },
    {
      name: 'The Wake',
      type: 'dining',
      description: 'Brunch and steakhouse',
    },
    {
      name: 'Razzle Dazzle',
      type: 'casual_dining',
      description: 'All-day treats and casual dining',
    },
    {
      name: 'Red Room',
      type: 'entertainment',
      description: 'Transformational space featuring drag, comedy, acrobatics, Broadway performers',
    },
    {
      name: 'The Manor',
      type: 'entertainment',
      description: 'Intimate nightclub with comedians, drag shows, specialty acts',
    },
    {
      name: 'Pool Deck',
      type: 'recreation',
      description: 'Designed for dancing and themed parties with DJs, lasers, video production',
    },
  ],

  amenityIds: [4, 3, 2, 48], // Fitness Center, Spa, Pool, Complimentary WiFi

  locations: [
    {
      name: 'Miami',
      city: 'Miami',
      state_province: 'Florida',
      country: 'United States',
      country_code: 'US',
      description:
        'Features South Beach, the gay district, Wynwood Arts District with 50+ galleries, renowned bars, clubs, and dining scene.',
      imageUrl: '', // Will check if exists, may not need new image
    },
    {
      name: 'Costa Maya',
      city: 'Costa Maya',
      state_province: 'Quintana Roo',
      country: 'Mexico',
      country_code: 'MX',
      description:
        'Combination of ancient Mayan ruins, coastal villages, and natural lagoons featuring varied aquamarine waters with cultural and historical attractions.',
      imageUrl:
        'https://cdn.brandfolder.io/74B7KV5M/at/h6wrbhrvb65fx3mn3pmjj699/ta26-inline-costamaya-beach.jpg',
    },
    {
      name: 'Puerto Limon',
      city: 'Puerto Limon',
      state_province: 'Limon',
      country: 'Costa Rica',
      country_code: 'CR',
      description:
        'Gateway featuring Afro-Caribbean culture, rainforests with exotic wildlife, national parks, and eco-tourism activities.',
      imageUrl:
        'https://cdn.brandfolder.io/74B7KV5M/at/qbtbjrv6kh76tpmn3jkp8ft/ta26-inline-guys-jungle.jpg',
    },
    {
      name: 'Colon',
      city: 'Colon',
      state_province: 'Colon',
      country: 'Panama',
      country_code: 'PA',
      description:
        'Caribbean seaport at the Atlantic Ocean entrance to the Panama Canal, with historical significance as a 19th-century railroad terminus and duty-free shopping.',
      imageUrl:
        'https://cdn.brandfolder.io/74B7KV5M/at/knmgfzjtbq9bmt5vhnj2pv5/ta26-inline-panama-river.jpg',
    },
    {
      name: 'Cartagena',
      city: 'Cartagena',
      state_province: 'Bolivar',
      country: 'Colombia',
      country_code: 'CO',
      description:
        'UNESCO World Heritage Site featuring cobblestoned streets, colonial architecture, walled old town, and contemporary Caribbean amenities.',
      imageUrl:
        'https://cdn.brandfolder.io/74B7KV5M/at/srqgr7kgkzv69grqv8tvgqff/ta26-inline-cartagena-town-walking.jpg',
    },
    {
      name: 'Oranjestad',
      city: 'Oranjestad',
      state_province: 'Aruba',
      country: 'Aruba',
      country_code: 'AW',
      description:
        'Dutch colonial influences meeting tropical landscape with powdery white beaches, crystal-clear waters, rocky northern coast with cliffs and cacti.',
      imageUrl:
        'https://cdn.brandfolder.io/74B7KV5M/at/wgc43qfmkwnvwgsqqwxhz/ta26-inline-aruba-flamingos.jpg',
    },
  ],

  itinerary: [
    {
      day: 1,
      locationName: 'Miami',
      arrivalTime: null,
      departureTime: '19:00:00',
      locationTypeId: 1, // Embarkation
      activities: 'Embarkation Day',
    },
    {
      day: 2,
      locationName: null, // Day at Sea
      arrivalTime: null,
      departureTime: null,
      locationTypeId: 4, // Day at Sea
      activities: 'Day at Sea - Enjoy ship amenities, entertainment, and themed events',
    },
    {
      day: 3,
      locationName: 'Costa Maya',
      arrivalTime: '08:00:00',
      departureTime: '17:00:00',
      locationTypeId: 3, // Port
      activities: 'Explore ancient Mayan ruins, coastal villages, and natural lagoons',
    },
    {
      day: 4,
      locationName: null, // Day at Sea
      arrivalTime: null,
      departureTime: null,
      locationTypeId: 4, // Day at Sea
      activities: 'Day at Sea - Relax and enjoy onboard activities',
    },
    {
      day: 5,
      locationName: 'Puerto Limon',
      arrivalTime: '09:00:00',
      departureTime: '18:00:00',
      locationTypeId: 3, // Port
      activities: 'Experience Afro-Caribbean culture, rainforests, and wildlife',
    },
    {
      day: 6,
      locationName: 'Colon',
      arrivalTime: '08:00:00',
      departureTime: '17:00:00',
      locationTypeId: 3, // Port
      activities: 'Visit Panama Canal gateway and explore historic seaport',
    },
    {
      day: 7,
      locationName: 'Cartagena',
      arrivalTime: '10:00:00',
      departureTime: null,
      locationTypeId: 11, // Overnight Arrival
      activities: 'Explore UNESCO World Heritage walled city and colonial architecture',
    },
    {
      day: 8,
      locationName: 'Cartagena',
      arrivalTime: null,
      departureTime: '08:00:00',
      locationTypeId: 12, // Overnight Departure
      activities: "Continue exploring Cartagena's historic streets and dining scene",
    },
    {
      day: 9,
      locationName: 'Oranjestad',
      arrivalTime: '10:00:00',
      departureTime: '19:00:00',
      locationTypeId: 3, // Port
      activities: 'Enjoy pristine beaches, crystal-clear waters, and Dutch colonial charm',
    },
    {
      day: 10,
      locationName: null, // Day at Sea
      arrivalTime: null,
      departureTime: null,
      locationTypeId: 4, // Day at Sea
      activities: 'Day at Sea - Final themed events and celebrations',
    },
    {
      day: 11,
      locationName: null, // Day at Sea
      arrivalTime: null,
      departureTime: null,
      locationTypeId: 4, // Day at Sea
      activities: 'Day at Sea - Last Dance event and farewell celebrations',
    },
    {
      day: 12,
      locationName: 'Miami',
      arrivalTime: '07:00:00',
      departureTime: null,
      locationTypeId: 2, // Disembarkation
      activities: 'Disembarkation',
    },
  ],
};

// Get venue type ID from type name
function getVenueTypeId(typeName: string): number {
  const typeMap: Record<string, number> = {
    dining: 1, // Restaurant
    entertainment: 2, // Entertainment
    bar: 3, // Bars / Lounge
    spa: 4, // Spa
    recreation: 5, // Recreation
    casual_dining: 7, // Casual Dining
  };
  return typeMap[typeName] || 1;
}

// Download and upload image to Supabase
async function uploadImage(externalUrl: string, bucketType: string, name: string): Promise<string> {
  try {
    logger.info(`Downloading image: ${externalUrl}`);
    const supabaseUrl = await downloadImageFromUrl(externalUrl, bucketType, name);
    logger.info(`Uploaded to Supabase: ${supabaseUrl}`);
    return supabaseUrl;
  } catch (error) {
    logger.error(`Failed to upload image: ${externalUrl}`, error);
    throw error;
  }
}

// Step 1: Upload all images
async function uploadAllImages(): Promise<void> {
  logger.info('Step 1: Uploading images...');

  // Upload location images
  for (const location of cruiseData.locations) {
    if (location.imageUrl) {
      const fileName = `${location.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      const supabaseUrl = await uploadImage(location.imageUrl, 'locations', fileName);
      location.imageUrl = supabaseUrl;
    }
  }

  // Upload trip hero image
  if (cruiseData.trip.heroImageUrl) {
    cruiseData.trip.heroImageUrl = await uploadImage(
      cruiseData.trip.heroImageUrl,
      'trips',
      `${cruiseData.trip.slug}-hero.jpg`
    );
  }

  logger.info('✅ All images uploaded successfully');
}

// Step 2: Create ship venues
async function createVenuesForShip(shipId: number): Promise<void> {
  logger.info('Step 2: Creating ship venues...');

  for (const venue of cruiseData.venues) {
    const venueTypeId = getVenueTypeId(venue.type);

    // Check if venue already exists
    const { data: existing } = await supabase
      .from('ship_venues')
      .select('id')
      .eq('ship_id', shipId)
      .eq('name', venue.name)
      .single();

    if (existing) {
      logger.info(`Venue already exists: ${venue.name}`);
      continue;
    }

    const { error } = await supabase.from('ship_venues').insert({
      ship_id: shipId,
      name: venue.name,
      venue_type_id: venueTypeId,
      description: venue.description,
    });

    if (error) {
      logger.error(`Failed to create venue: ${venue.name}`, error);
      throw error;
    }

    logger.info(`Created venue: ${venue.name}`);
  }

  logger.info('✅ Ship venues created successfully');
}

// Step 3: Create ship amenities
async function createAmenitiesForShip(shipId: number): Promise<void> {
  logger.info('Step 3: Creating ship amenities...');

  for (const amenityId of cruiseData.amenityIds) {
    // Check if amenity link already exists
    const { data: existing } = await supabase
      .from('ship_amenities')
      .select('*')
      .eq('ship_id', shipId)
      .eq('amenity_id', amenityId)
      .single();

    if (existing) {
      logger.info(`Amenity ${amenityId} already linked to ship`);
      continue;
    }

    const { error } = await supabase.from('ship_amenities').insert({
      ship_id: shipId,
      amenity_id: amenityId,
    });

    if (error) {
      logger.error(`Failed to create amenity link: ${amenityId}`, error);
      throw error;
    }

    logger.info(`Linked amenity ID ${amenityId} to ship`);
  }

  logger.info('✅ Ship amenities created successfully');
}

// Step 4: Create or find locations
async function createLocations(): Promise<Map<string, number>> {
  logger.info('Step 4: Creating/finding locations...');

  const locationMap = new Map<string, number>();

  for (const location of cruiseData.locations) {
    // Check if location exists
    const { data: existing } = await supabase
      .from('locations')
      .select('id')
      .eq('name', location.name)
      .single();

    if (existing) {
      locationMap.set(location.name, existing.id);
      logger.info(`Location already exists: ${location.name} (ID: ${existing.id})`);
      continue;
    }

    // Create new location
    const { data: created, error } = await supabase
      .from('locations')
      .insert({
        name: location.name,
        city: location.city,
        state_province: location.state_province,
        country: location.country,
        country_code: location.country_code,
        description: location.description,
        image_url: location.imageUrl,
      })
      .select('id')
      .single();

    if (error || !created) {
      logger.error(`Failed to create location: ${location.name}`, error);
      throw error;
    }

    locationMap.set(location.name, created.id);
    logger.info(`Created location: ${location.name} (ID: ${created.id})`);
  }

  logger.info('✅ Locations created/found successfully');
  return locationMap;
}

// Step 5: Create trip record
async function createTrip(): Promise<number> {
  logger.info('Step 5: Creating trip record...');

  const { data, error } = await supabase
    .from('trips')
    .insert({
      name: cruiseData.trip.name,
      slug: cruiseData.trip.slug,
      description: cruiseData.trip.description,
      start_date: cruiseData.trip.startDate,
      end_date: cruiseData.trip.endDate,
      hero_image_url: cruiseData.trip.heroImageUrl,
      trip_status_id: cruiseData.trip.statusId,
      trip_type_id: cruiseData.trip.tripTypeId,
      charter_company_id: cruiseData.trip.charterCompanyId,
      ship_id: cruiseData.trip.shipId,
    })
    .select('id')
    .single();

  if (error || !data) {
    logger.error('Failed to create trip', error);
    throw error;
  }

  logger.info(`✅ Created trip: ${cruiseData.trip.name} (ID: ${data.id})`);
  return data.id;
}

// Step 6: Create itinerary entries
async function createItinerary(tripId: number, locationMap: Map<string, number>): Promise<void> {
  logger.info('Step 6: Creating itinerary entries...');

  // Parse start date (NO timezone conversion)
  const [year, month, day] = cruiseData.trip.startDate.split(' ')[0].split('-').map(Number);
  const startDate = new Date(year, month - 1, day);

  for (const entry of cruiseData.itinerary) {
    const locationId = entry.locationName ? locationMap.get(entry.locationName) : null;

    // Calculate date for this day (NO timezone conversion)
    const entryDate = new Date(year, month - 1, day + (entry.day - 1));
    const dateString = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')} 00:00:00`;

    const { error } = await supabase.from('itinerary').insert({
      trip_id: tripId,
      day: entry.day,
      date: dateString, // Required field
      location_id: locationId,
      location_name: entry.locationName,
      arrival_time: entry.arrivalTime,
      departure_time: entry.departureTime,
      location_type_id: entry.locationTypeId,
      description: entry.activities,
      order_index: entry.day,
    });

    if (error) {
      logger.error(`Failed to create itinerary entry for day ${entry.day}`, error);
      throw error;
    }

    logger.info(`Created itinerary day ${entry.day}: ${entry.locationName || 'Day at Sea'}`);
  }

  logger.info('✅ Itinerary created successfully');
}

// Main execution function
async function main() {
  try {
    logger.info('🚢 Starting Tropical Americas Cruise import...');

    // Step 1: Upload all images
    await uploadAllImages();

    // Step 2: Create ship venues
    await createVenuesForShip(cruiseData.trip.shipId);

    // Step 3: Create ship amenities
    await createAmenitiesForShip(cruiseData.trip.shipId);

    // Step 4: Create locations
    const locationMap = await createLocations();

    // Step 5: Create trip
    const tripId = await createTrip();

    // Step 6: Create itinerary
    await createItinerary(tripId, locationMap);

    logger.info('✅ ✅ ✅ Tropical Americas Cruise import completed successfully!');
    logger.info(`Trip ID: ${tripId}`);
    logger.info(`Trip URL: /trip/${cruiseData.trip.slug}`);
    logger.info('');
    logger.info('Next steps:');
    logger.info('1. Update hero carousel with port images');
    logger.info('2. Visual verification in browser');
    logger.info('3. Set trip status to Published after approval');
  } catch (error) {
    logger.error('❌ Tropical Americas Cruise import failed', error);
    process.exit(1);
  }
}

// Run the import
main();
