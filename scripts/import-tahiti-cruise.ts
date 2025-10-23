import 'dotenv/config';
import { downloadImageFromUrl } from '../server/image-utils';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../server/logging/logger';

// Cruise data extracted from Atlantis Events
const cruiseData = {
  trip: {
    name: "New Year's Tahiti Cruise",
    slug: 'new-years-tahiti-cruise-2025',
    startDate: '2025-12-28 00:00:00', // NO TIMEZONE CONVERSION - stored as timestamp
    endDate: '2026-01-06 00:00:00', // NO TIMEZONE CONVERSION - stored as timestamp
    description:
      "An all-gay celebration sailing through French Polynesia's most beautiful islands, culminating in a New Year's Eve party in Bora Bora.",
    highlights:
      "10-day luxury cruise visiting 7 ports in French Polynesia including overnight stay in Bora Bora for New Year's Eve with fireworks, all-inclusive dining at 6 specialty restaurants with no surcharges, free house beverage package, free WiFi, and Atlantis signature entertainment.",
    statusId: 5, // Preview status
    heroImageUrl:
      'https://cdn.brandfolder.io/74B7KV5M/at/ctkmrb3jnxft9schqrfq88x/th25-header-sailtahitifornewyears.jpg',
  },
  ship: {
    name: 'Oceania Riviera',
    cruiseLine: 'Oceania Cruises',
    capacity: 1200,
    description:
      'Mid-size luxury vessel with contemporary casual elegance, featuring 6 restaurants, 9 bars and lounges, spacious pool, three whirlpools, Aquamar Spa, fitness center, and theater.',
    imageUrl:
      'https://cdn.brandfolder.io/74B7KV5M/at/xbggkf6tbwbbxzh8szs7sj74/th25-header-ship.jpg',
  },
  locations: [
    {
      name: 'Papeete',
      country: 'French Polynesia',
      timezone: 'Pacific/Tahiti',
      imageUrl: 'https://atlantisevents.com/wp-content/uploads/rv25-port-02-papeete.jpg',
      description: 'Capital city of French Polynesia on the island of Tahiti',
    },
    {
      name: 'Moorea',
      country: 'French Polynesia',
      timezone: 'Pacific/Tahiti',
      imageUrl: 'https://atlantisevents.com/wp-content/uploads/rv25-port-04-moorea.jpg',
      description: 'Sister island to Tahiti known for dramatic mountain peaks and crystal lagoons',
    },
    {
      name: 'Bora Bora',
      country: 'French Polynesia',
      timezone: 'Pacific/Tahiti',
      imageUrl: 'https://atlantisevents.com/wp-content/uploads/rv25-port-06-borabora-1.jpg',
      description: 'Iconic island paradise famous for its turquoise lagoon and overwater bungalows',
    },
    {
      name: 'Raiatea',
      country: 'French Polynesia',
      timezone: 'Pacific/Tahiti',
      imageUrl: 'https://atlantisevents.com/wp-content/uploads/rv25-port-07-raiatea-1.jpg',
      description: 'Sacred island known as the cultural heart of Polynesia',
    },
    {
      name: 'Huahine',
      country: 'French Polynesia',
      timezone: 'Pacific/Tahiti',
      imageUrl: 'https://atlantisevents.com/wp-content/uploads/rv25-port-08-huahine.jpg',
      description: 'Lush island with archaeological sites and pristine beaches',
    },
    {
      name: 'Rangiroa',
      country: 'French Polynesia',
      timezone: 'Pacific/Tahiti',
      imageUrl: 'https://atlantisevents.com/wp-content/uploads/rv25-port-rangiroa.jpg',
      description: "One of the world's largest atolls with incredible diving and snorkeling",
    },
    {
      name: 'Fakarava',
      country: 'French Polynesia',
      timezone: 'Pacific/Tahiti',
      imageUrl: 'https://atlantisevents.com/wp-content/uploads/th25-port-Fakarava.jpg',
      description: 'UNESCO Biosphere Reserve with pristine natural beauty',
    },
  ],
  venues: [
    { name: 'Grand Dining Room', type: 'dining', description: 'Sumptuous fine dining' },
    {
      name: 'Polo Grill',
      type: 'dining',
      description: 'Classic steakhouse with elegant atmosphere',
    },
    { name: 'Toscana', type: 'dining', description: 'Authentic Italian cuisine' },
    { name: 'Jacques', type: 'dining', description: 'Authentic Parisian bistro experience' },
    { name: 'Red Ginger', type: 'dining', description: 'Contemporary Asian cuisine' },
    { name: 'Terrace Cafe', type: 'dining', description: 'Informal, relaxed casual dining' },
    {
      name: 'La Reserve',
      type: 'dining',
      description: 'Wine Spectator specialty venue with tastings and pairings',
    },
    {
      name: 'Horizons Lounge',
      type: 'bar',
      description: 'Top deck lounge with intimate entertainment',
    },
    { name: "Martini's", type: 'bar', description: 'Transforms into Atlantis piano bar' },
    { name: 'Casino', type: 'entertainment', description: 'Gaming and entertainment' },
    {
      name: 'Theater',
      type: 'entertainment',
      description: 'Spacious theater with signature performers',
    },
    {
      name: 'Culinary Center',
      type: 'recreation',
      description: 'Hands-on cooking classes by master chefs',
    },
  ],
  amenities: [
    'Heated Pool',
    'Three Whirlpools',
    'Aquamar Spa',
    'Fitness Center',
    'Theater',
    'Casino',
    'Teak Deck Spaces',
    'Complimentary WiFi',
    'Free House Beverage Package',
  ],
  itinerary: [
    {
      dayNumber: 1,
      date: '2025-12-28 00:00:00',
      locationName: 'Papeete',
      arrivalTime: '14:00',
      departureTime: null,
      allAboardTime: null,
      description:
        'Embarkation day in Papeete. Board around 2pm and settle into your stateroom. Overnight stay in port.',
      locationTypeId: 1, // Embarkation
      isSeaDay: false,
    },
    {
      dayNumber: 2,
      date: '2025-12-29 00:00:00',
      locationName: 'Papeete',
      arrivalTime: null,
      departureTime: '04:00',
      allAboardTime: '03:30',
      description: 'Early morning departure from Papeete.',
      locationTypeId: 12, // Overnight Departure
      isSeaDay: false,
    },
    {
      dayNumber: 2,
      date: '2025-12-29 00:00:00',
      locationName: 'Moorea',
      arrivalTime: '09:00',
      departureTime: '20:00',
      allAboardTime: '19:30',
      description:
        'Explore the sister island of Tahiti with dramatic mountain peaks and crystal lagoons.',
      locationTypeId: 3, // Port
      isSeaDay: false,
    },
    {
      dayNumber: 3,
      date: '2025-12-30 00:00:00',
      locationName: 'Bora Bora',
      arrivalTime: '11:00',
      departureTime: null,
      allAboardTime: null,
      description: 'Arrive in the iconic island paradise of Bora Bora. Overnight stay.',
      locationTypeId: 11, // Overnight Arrival
      isSeaDay: false,
    },
    {
      dayNumber: 4,
      date: '2025-12-31 00:00:00',
      locationName: 'Bora Bora',
      arrivalTime: null,
      departureTime: '21:00',
      allAboardTime: '20:30',
      description:
        "New Year's Eve celebration in Bora Bora with fireworks and light displays at midnight!",
      locationTypeId: 12, // Overnight Departure
      isSeaDay: false,
    },
    {
      dayNumber: 5,
      date: '2026-01-01 00:00:00',
      locationName: 'Raiatea',
      arrivalTime: '07:00',
      departureTime: '17:00',
      allAboardTime: '16:30',
      description:
        "New Year's Day arrival at the sacred island known as the cultural heart of Polynesia.",
      locationTypeId: 3, // Port
      isSeaDay: false,
    },
    {
      dayNumber: 6,
      date: '2026-01-02 00:00:00',
      locationName: 'Huahine',
      arrivalTime: '07:00',
      departureTime: '17:00',
      allAboardTime: '16:30',
      description: 'Discover the lush island with archaeological sites and pristine beaches.',
      locationTypeId: 3, // Port
      isSeaDay: false,
    },
    {
      dayNumber: 7,
      date: '2026-01-03 00:00:00',
      locationName: 'Rangiroa',
      arrivalTime: '07:00',
      departureTime: '16:00',
      allAboardTime: '15:30',
      description:
        "Experience one of the world's largest atolls with incredible diving and snorkeling.",
      locationTypeId: 3, // Port
      isSeaDay: false,
    },
    {
      dayNumber: 8,
      date: '2026-01-04 00:00:00',
      locationName: 'Fakarava',
      arrivalTime: '08:00',
      departureTime: '19:00',
      allAboardTime: '18:30',
      description: 'Visit the UNESCO Biosphere Reserve with pristine natural beauty.',
      locationTypeId: 3, // Port
      isSeaDay: false,
    },
    {
      dayNumber: 9,
      date: '2026-01-05 00:00:00',
      locationName: null,
      arrivalTime: null,
      departureTime: null,
      allAboardTime: null,
      description:
        'Day at sea. Enjoy ship amenities, spa treatments, entertainment, and relaxation.',
      locationTypeId: 4, // Day at Sea
      isSeaDay: true,
    },
    {
      dayNumber: 10,
      date: '2026-01-06 00:00:00',
      locationName: 'Papeete',
      arrivalTime: '01:00',
      departureTime: '07:00',
      allAboardTime: null,
      description: 'Arrive back in Papeete early morning. Disembarkation begins around 7am.',
      locationTypeId: 2, // Disembarkation
      isSeaDay: false,
    },
  ],
};

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('FATAL: Supabase configuration missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImageUploadResult {
  heroImageUrl: string;
  shipImageUrl: string;
  locationImages: Map<string, string>;
}

async function downloadAndUploadImages(): Promise<ImageUploadResult> {
  logger.info('Starting image downloads and uploads to Supabase...');

  // 1. Download and upload hero image
  logger.info('Downloading hero image...');
  const heroImageUrl = await downloadImageFromUrl(
    cruiseData.trip.heroImageUrl,
    'trips',
    'tahiti-nye-cruise-hero.jpg'
  );
  logger.info('Hero image uploaded', { heroImageUrl });

  // 2. Download and upload ship image
  logger.info('Downloading ship image...');
  const shipImageUrl = await downloadImageFromUrl(
    cruiseData.ship.imageUrl,
    'ships',
    'oceania-riviera.jpg'
  );
  logger.info('Ship image uploaded', { shipImageUrl });

  // 3. Download and upload all location images
  const locationImages = new Map<string, string>();
  for (const location of cruiseData.locations) {
    logger.info(`Downloading image for ${location.name}...`);
    const locationImageUrl = await downloadImageFromUrl(
      location.imageUrl,
      'locations',
      `${location.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
    );
    locationImages.set(location.name, locationImageUrl);
    logger.info(`${location.name} image uploaded`, { locationImageUrl });
  }

  logger.info('All images uploaded successfully!');
  return { heroImageUrl, shipImageUrl, locationImages };
}

async function getOrCreateCruiseLine(name: string): Promise<number> {
  logger.info('Looking up cruise line...', { name });

  // Check if exists
  const { data: existing, error: selectError } = await supabase
    .from('cruise_lines')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) {
    logger.info('Cruise line found', { id: existing.id });
    return existing.id;
  }

  // Create if not exists
  logger.info('Creating new cruise line...');
  const { data: created, error: insertError } = await supabase
    .from('cruise_lines')
    .insert({ name })
    .select('id')
    .single();

  if (insertError || !created) {
    throw new Error(`Failed to create cruise line: ${insertError?.message}`);
  }

  logger.info('Cruise line created', { id: created.id });
  return created.id;
}

async function getOrCreateShip(
  name: string,
  cruiseLineId: number,
  capacity: number,
  description: string,
  imageUrl: string
): Promise<number> {
  logger.info('Looking up ship...', { name });

  // Check if exists
  const { data: existing, error: selectError } = await supabase
    .from('ships')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) {
    logger.info('Ship found', { id: existing.id });
    return existing.id;
  }

  // Create if not exists
  logger.info('Creating new ship...');
  const { data: created, error: insertError } = await supabase
    .from('ships')
    .insert({
      name,
      cruise_line_id: cruiseLineId,
      capacity,
      description,
      image_url: imageUrl,
    })
    .select('id')
    .single();

  if (insertError || !created) {
    throw new Error(`Failed to create ship: ${insertError?.message}`);
  }

  logger.info('Ship created', { id: created.id });
  return created.id;
}

async function getVenueTypeId(typeName: string): Promise<number> {
  const typeMap: Record<string, number> = {
    dining: 1, // Restaurant
    entertainment: 2, // Entertainment
    bar: 3, // Bars / Lounge
    spa: 4, // Spa
    recreation: 5, // Recreation
  };

  const id = typeMap[typeName];
  if (!id) {
    throw new Error(`Unknown venue type: ${typeName}`);
  }
  return id;
}

async function createVenuesForShip(shipId: number): Promise<void> {
  logger.info('Creating ship venues...');

  for (const venue of cruiseData.venues) {
    const venueTypeId = await getVenueTypeId(venue.type);

    // Check if ship venue already exists
    const { data: existing } = await supabase
      .from('ship_venues')
      .select('id')
      .eq('ship_id', shipId)
      .eq('name', venue.name)
      .eq('venue_type_id', venueTypeId)
      .single();

    if (existing) {
      logger.info('Ship venue already exists', { name: venue.name, id: existing.id });
      continue;
    }

    // Create ship venue directly
    const { data: created, error } = await supabase
      .from('ship_venues')
      .insert({
        ship_id: shipId,
        name: venue.name,
        venue_type_id: venueTypeId,
        description: venue.description,
      })
      .select('id')
      .single();

    if (error || !created) {
      throw new Error(`Failed to create ship venue: ${error?.message}`);
    }
    logger.info('Ship venue created', { name: venue.name, id: created.id });
  }

  logger.info('All ship venues created');
}

async function createAmenitiesForShip(shipId: number): Promise<void> {
  logger.info('Creating and linking amenities...');

  for (const amenityName of cruiseData.amenities) {
    // Check if amenity exists
    const { data: existing } = await supabase
      .from('amenities')
      .select('id')
      .eq('name', amenityName)
      .single();

    let amenityId: number;
    if (existing) {
      amenityId = existing.id;
      logger.info('Amenity found', { name: amenityName, id: amenityId });
    } else {
      // Create amenity
      const { data: created, error } = await supabase
        .from('amenities')
        .insert({ name: amenityName })
        .select('id')
        .single();

      if (error || !created) {
        throw new Error(`Failed to create amenity: ${error?.message}`);
      }
      amenityId = created.id;
      logger.info('Amenity created', { name: amenityName, id: amenityId });
    }

    // Link to ship
    const { error: linkError } = await supabase
      .from('ship_amenities')
      .insert({ ship_id: shipId, amenity_id: amenityId });

    if (linkError && !linkError.message.includes('duplicate')) {
      throw new Error(`Failed to link amenity to ship: ${linkError.message}`);
    }
  }

  logger.info('All amenities created and linked');
}

async function createLocations(locationImages: Map<string, string>): Promise<Map<string, number>> {
  logger.info('Creating locations...');
  const locationIds = new Map<string, number>();

  for (const location of cruiseData.locations) {
    const imageUrl = locationImages.get(location.name);

    // Check if exists
    const { data: existing } = await supabase
      .from('locations')
      .select('id')
      .eq('name', location.name)
      .eq('country', location.country)
      .single();

    let locationId: number;
    if (existing) {
      locationId = existing.id;
      logger.info('Location found', { name: location.name, id: locationId });
    } else {
      // Create location
      const { data: created, error } = await supabase
        .from('locations')
        .insert({
          name: location.name,
          country: location.country,
          description: location.description,
          image_url: imageUrl,
        })
        .select('id')
        .single();

      if (error || !created) {
        throw new Error(`Failed to create location: ${error?.message}`);
      }
      locationId = created.id;
      logger.info('Location created', { name: location.name, id: locationId });
    }

    locationIds.set(location.name, locationId);
  }

  logger.info('All locations created');
  return locationIds;
}

async function getCharterCompanyId(): Promise<number> {
  const { data, error } = await supabase
    .from('charter_companies')
    .select('id')
    .eq('name', 'Atlantis')
    .single();

  if (error || !data) {
    throw new Error('Atlantis charter company not found');
  }

  return data.id;
}

async function getTripTypeId(): Promise<number> {
  const { data, error } = await supabase
    .from('trip_types')
    .select('id')
    .eq('trip_type', 'Cruise')
    .single();

  if (error || !data) {
    throw new Error('Cruise trip type not found');
  }

  return data.id;
}

async function createTrip(shipId: number, heroImageUrl: string): Promise<number> {
  logger.info('Creating trip...');

  const charterCompanyId = await getCharterCompanyId();
  const tripTypeId = await getTripTypeId();

  const { data, error } = await supabase
    .from('trips')
    .insert({
      name: cruiseData.trip.name,
      slug: cruiseData.trip.slug,
      charter_company_id: charterCompanyId,
      trip_type_id: tripTypeId,
      start_date: cruiseData.trip.startDate, // NO TIMEZONE CONVERSION
      end_date: cruiseData.trip.endDate, // NO TIMEZONE CONVERSION
      ship_id: shipId,
      resort_id: null,
      hero_image_url: heroImageUrl,
      description: cruiseData.trip.description,
      highlights: cruiseData.trip.highlights,
      trip_status_id: cruiseData.trip.statusId, // 5 = Preview
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create trip: ${error?.message}`);
  }

  logger.info('Trip created', { id: data.id, statusId: cruiseData.trip.statusId });
  return data.id;
}

async function createItinerary(
  tripId: number,
  locationIds: Map<string, number>,
  locationImages: Map<string, string>
): Promise<void> {
  logger.info('Creating itinerary entries...');

  let orderIndex = 0;
  for (const item of cruiseData.itinerary) {
    const locationId = item.locationName ? locationIds.get(item.locationName) : null;
    const imageUrl = item.locationName ? locationImages.get(item.locationName) : null;

    const { error } = await supabase.from('itinerary').insert({
      trip_id: tripId,
      location_id: locationId,
      location_name: item.locationName || null, // Store location name
      day: item.dayNumber, // Column is "day" not "day_number"
      date: item.date, // NO TIMEZONE CONVERSION
      arrival_time: item.arrivalTime,
      departure_time: item.departureTime,
      all_aboard_time: item.allAboardTime,
      description: item.description,
      location_image_url: imageUrl, // Column is "location_image_url"
      location_type_id: item.locationTypeId,
      order_index: orderIndex++,
      // Note: is_sea_day doesn't exist in the schema, we use location_id = null for sea days
    });

    if (error) {
      throw new Error(`Failed to create itinerary entry: ${error.message}`);
    }

    logger.info('Itinerary entry created', {
      day: item.dayNumber,
      location: item.locationName || 'At Sea',
    });
  }

  logger.info('All itinerary entries created');
}

async function main() {
  try {
    logger.info('Starting Tahiti cruise import...');

    // Step 2: Download and upload images
    const { heroImageUrl, shipImageUrl, locationImages } = await downloadAndUploadImages();

    // Step 3: Create/get cruise line
    const cruiseLineId = await getOrCreateCruiseLine(cruiseData.ship.cruiseLine);

    // Step 4: Create/get ship
    const shipId = await getOrCreateShip(
      cruiseData.ship.name,
      cruiseLineId,
      cruiseData.ship.capacity,
      cruiseData.ship.description,
      shipImageUrl
    );

    // Step 5: Create and link venues
    await createVenuesForShip(shipId);

    // Step 6: Create and link amenities
    await createAmenitiesForShip(shipId);

    // Step 7: Create locations
    const locationIds = await createLocations(locationImages);

    // Step 8: Create trip with status='preview'
    const tripId = await createTrip(shipId, heroImageUrl);

    // Step 9: Create itinerary
    await createItinerary(tripId, locationIds, locationImages);

    logger.info('🎉 Tahiti cruise import completed successfully!', {
      tripId,
      status: 'preview',
      slug: cruiseData.trip.slug,
    });

    console.log('\n✅ IMPORT COMPLETE!');
    console.log(`Trip ID: ${tripId}`);
    console.log(`Trip Status: preview`);
    console.log(`Trip Slug: ${cruiseData.trip.slug}`);
    console.log('\nYou can now review the trip before publishing.');
  } catch (error) {
    logger.error('Import failed', error);
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

main();
