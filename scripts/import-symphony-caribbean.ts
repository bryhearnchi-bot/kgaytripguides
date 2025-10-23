import 'dotenv/config'; // CRITICAL: Load environment variables
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
  ship: {
    name: 'Symphony of the Seas',
    cruiseLineId: 2, // Royal Carribean (note DB typo)
    capacity: 5500,
    decks: 17,
    description:
      "The world's largest cruise ship, Symphony of the Seas features 17 decks across 7 distinct neighborhoods including Central Park with real plants and trees, the spectacular Aqua Theater with high-diving performances, an ice rink with professional skating shows, dual FlowRider surfing simulators, a rock climbing wall, and an exhilarating zip line. Experience revolutionary entertainment, world-class dining, and endless activities on this engineering marvel.",
    imageUrl: '', // To be uploaded
  },

  venues: [
    {
      name: 'Main Theater',
      type: 'entertainment',
      description:
        'Three-story main theater with 1,300 seats featuring Atlantis signature performers, special guests, and dazzling production shows',
    },
    {
      name: 'Aqua Theater',
      type: 'entertainment',
      description:
        'Spectacular outdoor amphitheater featuring choreographed dive shows with high-diving acrobatics and aquatic performances',
    },
    {
      name: 'Studio B',
      type: 'entertainment',
      description:
        'Ice-skating show venue and themed dance events space with professional performances',
    },
    {
      name: 'Comedy Club',
      type: 'entertainment',
      description: 'Intimate comedy venue featuring Gay Comedy All-Stars and stand-up performances',
    },
    {
      name: 'Dazzles',
      type: 'entertainment',
      description: 'Show lounge featuring drag performances and live singers',
    },
    {
      name: 'Central Park',
      type: 'recreation',
      description:
        'Lush garden neighborhood with over 12,000 real plants and trees, featuring outdoor dining and peaceful walkways',
    },
    {
      name: 'The Rising Tide Bar',
      type: 'bar',
      description:
        'Unique moving bar that travels between decks, offering signature cocktails with a view',
    },
    {
      name: 'Pool Deck Nightclub',
      type: 'entertainment',
      description:
        'Massive outdoor nightclub transformation with walls of video, awesome lasers, and dazzling lighting for epic dance parties',
    },
  ],

  // Use existing amenity IDs from database
  amenityIds: [
    2, // Pool
    3, // Spa
    4, // Fitness Center
    11, // Theater
    19, // Rock Climbing
    20, // Zip Line
  ],

  locations: [
    {
      name: 'Labadee',
      country: 'Haiti',
      city: 'Labadee',
      stateProvince: null,
      description:
        "Royal Caribbean's exclusive private beach paradise in Haiti, offering pristine white sand beaches, the thrilling Dragon's Breath zip line (the longest over-water zip line in the world), water sports including kayaking and parasailing, local craft markets, and tropical beach relaxation. Enjoy complimentary beach loungers, Haitian culture, and crystal-clear Caribbean waters.",
      imageUrl: '', // To be uploaded - external URL will be replaced
    },
    {
      name: 'San Juan',
      country: 'Puerto Rico',
      city: 'San Juan',
      stateProvince: 'Puerto Rico',
      description:
        'Historic colonial capital city featuring colorful Spanish architecture, cobblestone streets, and rich cultural heritage. Explore the massive El Morro and San Cristobal fortresses (UNESCO World Heritage Sites), wander through vibrant Old San Juan with its blue cobblestones and pastel buildings, visit the lush El Yunque rainforest (the only tropical rainforest in the U.S. National Forest System), or relax at beautiful beaches. Experience authentic Puerto Rican cuisine, local rum distilleries, and vibrant nightlife in the Condado district.',
      imageUrl: '', // To be uploaded
    },
    {
      name: 'St. Maarten',
      country: 'Sint Maarten',
      city: 'Philipsburg',
      stateProvince: null,
      description:
        'Unique dual-nation Caribbean island shared by the Netherlands (Sint Maarten) and France (Saint-Martin). Famous for stunning Orient Beach (clothing-optional section popular with LGBTQ+ travelers), the thrilling Maho Beach where planes fly incredibly low overhead, world-class duty-free shopping on Front Street in Philipsburg, and over 37 beautiful beaches. Enjoy French and Dutch cuisine, explore the colorful capital of Marigot, or take a day trip to nearby islands. The island offers a perfect blend of European charm and Caribbean relaxation.',
      imageUrl: '', // To be uploaded
    },
  ],

  trip: {
    name: 'Symphony Caribbean Cruise',
    slug: 'symphony-caribbean-cruise-2026',
    description:
      "The World's Biggest Gay Festival at Sea! Join 5,500 guests aboard the largest ship ever to host an all-gay cruise - Royal Caribbean's magnificent Symphony of the Seas. Experience 7 outrageously fun nights of non-stop entertainment including Broadway-style production shows, spectacular Aqua Theater diving performances, ice skating spectaculars, and appearances by headliners Kerry Ellis, Shangela, and Dylan Mulvaney. Party under the stars at massive pool deck events with world-class DJs including Above & Beyond, Oliver Heldens, and R3HAB, celebrate at the legendary White Party, and enjoy T-dances with dazzling performances. Explore stunning Caribbean destinations including Labadee's private beach paradise with the longest over-water zip line, historic San Juan with its colorful colonial architecture, and beautiful St. Maarten with its famous beaches and duty-free shopping.",
    startDate: '2026-02-01 00:00:00', // NO timezone conversion
    endDate: '2026-02-08 00:00:00',
    heroImageUrl: '', // Will use ship image or destination
    statusId: 5, // Preview
    tripTypeId: 1, // Cruise
    charterCompanyId: 1, // Atlantis
    cruiseLineId: 2, // Royal Carribean
  },

  itinerary: [
    {
      day: 1,
      date: '2026-02-01',
      locationName: 'Miami',
      locationTypeId: 1, // Embarkation
      arrivalTime: null,
      departureTime: '16:30',
      activities:
        'Embarkation day! Board the magnificent Symphony of the Seas in Miami and get ready for an amazing week of adventure, entertainment, and new friendships. Explore the ship, settle into your cabin, and join fellow travelers at the sail-away party as we depart for paradise.',
    },
    {
      day: 2,
      date: '2026-02-02',
      locationName: null, // Day at Sea
      locationTypeId: 4, // Day at Sea
      arrivalTime: null,
      departureTime: null,
      activities:
        "Full day at sea to explore this incredible ship! Experience the legendary afternoon T-dance with live performances, catch thrilling shows in the Main Theater and Aqua Theater, try the FlowRider surf simulator, challenge yourself on the rock climbing wall or zip line, relax by one of four pools, or enjoy the ice skating show. Tonight kicks off with spectacular entertainment and pool deck parties. It's time to make this ship your floating paradise!",
    },
    {
      day: 3,
      date: '2026-02-03',
      locationName: 'Labadee',
      locationTypeId: 3, // Port
      arrivalTime: '09:00',
      departureTime: '16:30',
      activities:
        "Royal Caribbean's exclusive private beach paradise! Soar on the Dragon's Breath zip line (the world's longest over-water zip line), enjoy thrilling water sports including kayaking and parasailing, relax on pristine white sand beaches with complimentary loungers, explore local Haitian craft markets, or simply soak up the sun with a tropical drink in hand. This private oasis is exclusively yours for the day!",
    },
    {
      day: 4,
      date: '2026-02-04',
      locationName: 'San Juan',
      locationTypeId: 3, // Port
      arrivalTime: '14:00',
      departureTime: '21:00',
      activities:
        'Explore the colorful colonial charm of Old San Juan! Wander cobblestone streets lined with pastel Spanish buildings, tour the impressive El Morro and San Cristobal fortresses (UNESCO World Heritage Sites), venture into the lush El Yunque rainforest with its waterfalls and exotic wildlife, or relax at nearby beaches. The evening departure allows time to experience authentic Puerto Rican cuisine and the vibrant nightlife of the Condado district before returning to the ship.',
    },
    {
      day: 5,
      date: '2026-02-05',
      locationName: 'St. Maarten',
      locationTypeId: 3, // Port
      arrivalTime: '09:00',
      departureTime: '19:00',
      activities:
        'Beach day on this unique dual-nation island! Sunbathe at the famous Orient Beach (clothing-optional section popular with LGBTQ+ travelers), experience the thrill of watching planes fly incredibly low at Maho Beach, shop duty-free on Front Street in Philipsburg, explore the French side in colorful Marigot, or hop between some of the 37 stunning beaches. Enjoy French and Dutch cuisine before sailing away at sunset.',
    },
    {
      day: 6,
      date: '2026-02-06',
      locationName: null, // Day at Sea
      locationTypeId: 4, // Day at Sea
      arrivalTime: null,
      departureTime: null,
      activities:
        'Another fantastic day at sea! Pamper yourself with spa treatments and thermal suites, perfect your surfing technique on the FlowRider, watch professional ice skating performances at Studio B, be amazed by the high-diving Aqua Theater show, take part in poolside activities and games, or attend workshops and meet-and-greets with featured talent. Tonight features spectacular entertainment and unforgettable pool deck celebrations.',
    },
    {
      day: 7,
      date: '2026-02-07',
      locationName: null, // Day at Sea
      locationTypeId: 4, // Day at Sea
      arrivalTime: null,
      departureTime: null,
      activities:
        'Final full day at sea - make it count! Dress to impress for the legendary White Party, enjoy farewell performances from headliners and production shows, dance under the stars at the pool deck nightclub with world-class DJs, capture memories with new friends, do last-minute shopping for souvenirs, or simply relax and reflect on an incredible week. Tonight we celebrate one last time in true Atlantis style!',
    },
    {
      day: 8,
      date: '2026-02-08',
      locationName: 'Miami',
      locationTypeId: 2, // Disembarkation
      arrivalTime: '07:00',
      departureTime: null,
      activities:
        'Disembarkation in Miami. Breakfast is available before departing the ship. Please note that flights should not be booked before 10:00 AM to allow sufficient time for customs and transportation to the airport. Thank you for sailing with Atlantis - see you on the next adventure!',
    },
  ],
};

// Helper: Get venue type ID from type name
function getVenueTypeId(typeName: string): number {
  const typeMap: Record<string, number> = {
    dining: 1, // Restaurant
    entertainment: 2, // Entertainment
    bar: 3, // Bars / Lounge
    spa: 4, // Spa
    recreation: 5, // Recreation
  };
  return typeMap[typeName] || 2; // Default to entertainment
}

// Step 1: Create ship record
async function createShip(): Promise<number> {
  logger.info('Step 1: Creating ship record...');

  // Check if ship already exists
  const { data: existing } = await supabase
    .from('ships')
    .select('id')
    .eq('name', cruiseData.ship.name)
    .eq('cruise_line_id', cruiseData.ship.cruiseLineId)
    .single();

  if (existing) {
    logger.info(`Ship already exists: ${cruiseData.ship.name} (ID: ${existing.id})`);
    return existing.id;
  }

  // Create new ship
  const { data, error } = await supabase
    .from('ships')
    .insert({
      name: cruiseData.ship.name,
      cruise_line_id: cruiseData.ship.cruiseLineId,
      capacity: cruiseData.ship.capacity,
      decks: cruiseData.ship.decks,
      description: cruiseData.ship.description,
      image_url: cruiseData.ship.imageUrl,
    })
    .select('id')
    .single();

  if (error || !data) {
    logger.error('Failed to create ship', error);
    throw error;
  }

  logger.info(`Created ship: ${cruiseData.ship.name} (ID: ${data.id})`);
  return data.id;
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
}

// Step 3: Link ship amenities
async function linkAmenitiesForShip(shipId: number): Promise<void> {
  logger.info('Step 3: Linking ship amenities...');

  for (const amenityId of cruiseData.amenityIds) {
    // Check if already linked
    const { data: existing } = await supabase
      .from('ship_amenities')
      .select('*')
      .eq('ship_id', shipId)
      .eq('amenity_id', amenityId)
      .single();

    if (existing) {
      logger.info(`Amenity already linked: ${amenityId}`);
      continue;
    }

    const { error } = await supabase.from('ship_amenities').insert({
      ship_id: shipId,
      amenity_id: amenityId,
    });

    if (error) {
      logger.error(`Failed to link amenity: ${amenityId}`, error);
      throw error;
    }

    logger.info(`Linked amenity: ${amenityId}`);
  }
}

// Step 4: Create or find locations
async function createLocations(): Promise<Map<string, number>> {
  logger.info('Step 4: Creating/finding locations...');

  const locationMap = new Map<string, number>();

  // Add Miami (existing location)
  locationMap.set('Miami', 69);
  logger.info('Using existing location: Miami (ID: 69)');

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
        state_province: location.stateProvince,
        country: location.country,
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

  return locationMap;
}

// Step 5: Create trip record
async function createTrip(shipId: number): Promise<number> {
  logger.info('Step 5: Creating trip record...');

  // Check if trip already exists
  const { data: existing } = await supabase
    .from('trips')
    .select('id')
    .eq('slug', cruiseData.trip.slug)
    .single();

  if (existing) {
    logger.info(`Trip already exists: ${cruiseData.trip.name} (ID: ${existing.id})`);
    return existing.id;
  }

  // Create new trip
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
      ship_id: shipId,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('TRIP CREATION ERROR:', error);
    logger.error('Failed to create trip', { error, errorDetails: JSON.stringify(error) });
    throw error;
  }

  logger.info(`Created trip: ${cruiseData.trip.name} (ID: ${data.id})`);
  return data.id;
}

// Step 6: Create itinerary entries
async function createItinerary(tripId: number, locationMap: Map<string, number>): Promise<void> {
  logger.info('Step 6: Creating itinerary entries...');

  for (const entry of cruiseData.itinerary) {
    const locationId = entry.locationName ? locationMap.get(entry.locationName) : null;

    const { error } = await supabase.from('itinerary').insert({
      trip_id: tripId,
      day: entry.day,
      date: `${entry.date} 00:00:00`, // Add time component
      location_id: locationId,
      location_name: entry.locationName,
      arrival_time: entry.arrivalTime,
      departure_time: entry.departureTime,
      description: entry.activities, // itinerary uses 'description' not 'activities'
      location_type_id: entry.locationTypeId,
      order_index: entry.day,
    });

    if (error) {
      console.error(`ITINERARY DAY ${entry.day} ERROR:`, error);
      logger.error(`Failed to create itinerary entry for day ${entry.day}`, error);
      throw error;
    }

    logger.info(`Created itinerary day ${entry.day}: ${entry.locationName || 'Day at Sea'}`);
  }

  logger.info('Itinerary created successfully');
}

// Main execution function
async function main() {
  try {
    logger.info('Starting Symphony Caribbean Cruise import...');

    // Step 1: Create ship
    const shipId = await createShip();

    // Step 2: Create ship venues
    await createVenuesForShip(shipId);

    // Step 3: Link ship amenities
    await linkAmenitiesForShip(shipId);

    // Step 4: Create/find locations
    const locationMap = await createLocations();

    // Step 5: Create trip
    const tripId = await createTrip(shipId);

    // Step 6: Create itinerary
    await createItinerary(tripId, locationMap);

    logger.info('✅ Symphony Caribbean Cruise import completed successfully!');
    logger.info(`Trip ID: ${tripId}`);
    logger.info(`Ship ID: ${shipId}`);
    logger.info(`Trip URL: /trip/${cruiseData.trip.slug}`);
    logger.info('');
    logger.info('NEXT STEPS:');
    logger.info('1. Verify data in database using validation queries');
    logger.info('2. Test in browser: http://localhost:3001/trip/symphony-caribbean-cruise-2026');
    logger.info('3. Upload any missing images to Supabase Storage');
    logger.info('4. Add talent/performers using admin interface (optional)');
    logger.info('5. Change trip status to Published when ready');
  } catch (error) {
    logger.error('❌ Symphony Caribbean Cruise import failed', error);
    process.exit(1);
  }
}

// Run the import
main();
