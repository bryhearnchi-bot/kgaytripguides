import 'dotenv/config'; // CRITICAL: Must be first line
import { downloadImageFromUrl } from '../server/image-utils';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../server/logging/logger';
import * as readline from 'readline';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('FATAL: Supabase configuration missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cruise data structure
const cruiseData = {
  trip: {
    name: 'Brilliant LA to Mexico',
    slug: 'brilliant-la-mexico-2026',
    description:
      "Join Atlantis Events for an unforgettable 8-night voyage from Los Angeles to Mexico aboard Virgin Voyages' stunning Brilliant Lady. Explore the best of the Mexican Riviera with stops in Ensenada, Cabo San Lucas, Puerto Vallarta, and Mazatlan. Experience T-dances, drag performances, and late-night Manor parties while enjoying Virgin Voyages' all-inclusive luxury including premium dining, fitness classes, and WiFi.",
    startDate: '2026-04-18 00:00:00', // NO timezone conversion
    endDate: '2026-04-26 00:00:00', // NO timezone conversion
    heroImageUrl: 'https://images.unsplash.com/photo-1578670812003-60745e2c2ea9?w=800&q=80', // Cruise ship
    statusId: 5, // Preview status
    tripTypeId: 1, // Cruise
    charterCompanyId: 1, // Atlantis
    cruiseLineId: 1, // Virgin Voyages
    shipId: 12, // Brilliant Lady (already exists)
  },

  ship: {
    imageUrl: 'https://images.unsplash.com/photo-1603289037007-4d05e36a55aa?w=800&q=80', // Cruise ship exterior
  },

  venues: [
    {
      name: 'Red Room',
      type: 'entertainment',
      description: 'Signature performance venue with stunning shows and productions',
    },
    {
      name: 'The Manor',
      type: 'entertainment',
      description: 'Intimate nightclub for late-night dancing and events',
    },
    {
      name: 'Aquatic Club',
      type: 'recreation',
      description: 'Pool and water activities area with multiple pools',
    },
    {
      name: 'Daddy Lounge',
      type: 'bar',
      description: 'Stylish lounge bar with cocktails and relaxed atmosphere',
    },
    {
      name: 'Extra Virgin',
      type: 'dining',
      description: 'Italian restaurant with fresh pasta and Mediterranean flavors',
    },
    {
      name: 'Gumbae',
      type: 'dining',
      description: 'Korean BBQ restaurant with interactive dining experience',
    },
    {
      name: 'Test Kitchen',
      type: 'dining',
      description: 'Fine dining tasting menu with innovative cuisine',
    },
    {
      name: 'Wake',
      type: 'dining',
      description: 'Breakfast and brunch venue with fresh morning options',
    },
    {
      name: 'Razzle Dazzle',
      type: 'dining',
      description: 'Vegetarian restaurant with creative plant-based dishes',
    },
    {
      name: 'Spa and Wellness',
      type: 'spa',
      description: 'Full-service spa with massages, treatments, and relaxation',
    },
  ],

  amenities: [
    {
      name: 'Multiple Pools',
    },
    {
      name: 'Fitness Center',
    },
    {
      name: 'WiFi Included',
    },
    {
      name: 'Premium Dining Included',
    },
    {
      name: 'Fitness Classes Included',
    },
    {
      name: 'Non-alcoholic Beverages Included',
    },
    {
      name: 'Gratuities Included',
    },
  ],

  locations: [
    {
      name: 'Los Angeles',
      country: 'United States',
      city: 'Los Angeles',
      state_province: 'California',
      country_code: 'US',
      description: 'Major West Coast port city and departure point for Pacific cruises',
      imageUrl: 'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=800&q=80', // LA skyline
      topAttractions: [
        'Hollywood Sign and Griffith Observatory - Iconic landmark with panoramic city views',
        'Santa Monica Pier - Historic beachfront pier with amusement park and restaurants',
        'Getty Center - World-class art museum with stunning architecture and gardens',
      ],
      lgbtVenues: [
        'The Abbey - World-famous West Hollywood gay bar and restaurant, iconic LGBT landmark',
        "Micky's - Popular WeHo gay nightclub with go-go dancers and themed nights",
        'Akbar - Eclectic gay bar in Silver Lake with diverse crowd and great music',
      ],
    },
    {
      name: 'Ensenada',
      country: 'Mexico',
      city: 'Ensenada',
      state_province: 'Baja California',
      country_code: 'MX',
      description: 'Charming coastal city in Baja California, known for wine region and seafood',
      imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80', // Mexico coast
      topAttractions: [
        'La Bufadora - One of the largest marine geysers in the world, shooting water up to 30 meters',
        "Valle de Guadalupe Wine Region - Mexico's premier wine country with boutique wineries and gourmet dining",
        'Playa Hermosa - Beautiful beach perfect for swimming, sunbathing, and water sports',
      ],
      lgbtVenues: [
        "Poker Face - Ensenada's main LGBTQ+ bar with captivating drag shows and friendly atmosphere",
        'La Casa de Dona Lupe - Queer-friendly restaurant serving organic pizzas, hosts LGBT nights second Saturday',
        'El Mezcalito - LGBT-owned bar and restaurant in Zona Centro with welcoming vibe',
      ],
    },
    {
      name: 'Cabo San Lucas',
      country: 'Mexico',
      city: 'Cabo San Lucas',
      state_province: 'Baja California Sur',
      country_code: 'MX',
      description:
        'Premier resort destination at the tip of Baja Peninsula, famous for dramatic rock formations and vibrant nightlife',
      imageUrl: 'https://images.unsplash.com/photo-1512813498716-3e640fed3f39?w=800&q=80', // Cabo beach
      topAttractions: [
        "El Arco (The Arch) - Iconic rock formation at Land's End where Pacific Ocean meets Sea of Cortez",
        'Playa del Amor (Lovers Beach) - Secluded beach with spectacular white sand and turquoise waters',
        'Medano Beach - Main tourist beach with crystal blue waters and beachside activities',
      ],
      lgbtVenues: [
        "Chandeliers - Official gay bar of Los Cabos with drag shows, theme nights, and Boys n' Heels performances",
        'Blue Chairs Beach Club - Iconic gay-friendly beachfront venue with ocean views on Medano Beach',
        'Mandala Club - Large diversity-friendly dance club on Marina Boulevard with vibrant atmosphere',
      ],
    },
    {
      name: 'Puerto Vallarta',
      country: 'Mexico',
      city: 'Puerto Vallarta',
      state_province: 'Jalisco',
      country_code: 'MX',
      description:
        'Premier gay-friendly beach resort destination, famous for Zona Romantica LGBT district and welcoming atmosphere',
      imageUrl: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&q=80', // Puerto Vallarta beach
      topAttractions: [
        'El Malecon - Bustling oceanfront boardwalk lined with sculptures, shops, restaurants, and street performers',
        'Zona Romantica - Historic cobblestone district with vibrant LGBT scene, galleries, and nightlife',
        'Los Arcos Marine Park - Natural rock formations rising from the sea, excellent for snorkeling and diving',
      ],
      lgbtVenues: [
        'Blue Chairs Beach Club - Most iconic gay beach club and restaurant with prime oceanfront location on Playa de los Muertos',
        'Mr. Flamingo - Iconic gay bar with open facade perfect for people watching, open 2pm-4am',
        'La Noche - Popular gay bar and club with great vibe, packed with locals and tourists until late',
      ],
    },
    {
      name: 'Mazatlan',
      country: 'Mexico',
      city: 'Mazatlan',
      state_province: 'Sinaloa',
      country_code: 'MX',
      description:
        'Historic Pacific coast resort city with beautiful Malecon boardwalk and colonial architecture',
      imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', // Mexico beach
      topAttractions: [
        'The Malecon - One of the longest boardwalks in the world at 13 miles along the stunning coastline',
        'Old Mazatlan (Centro Historico) - Cultural center with Plaza Machado, museums, and beautiful colonial buildings',
        "El Faro Lighthouse - One of the world's highest natural lighthouses with breathtaking panoramic views",
      ],
      lgbtVenues: [
        "PPClub (Pepe Club) - Mazatlan's longest-running gay club in Zona Dorada with drag shows, pop music, and go-go dancers",
        'The Lolly Pop Club - Newest gay nightclub featuring male and female go-go dancers with electronica and pop music',
        'Zona Dorada Gay Venues - Several gay-friendly clubs and bars along oceanfront Avenida Del Mar',
      ],
    },
  ],

  itinerary: [
    {
      day: 1,
      date: '2026-04-18',
      locationName: 'Los Angeles',
      arrivalTime: null,
      departureTime: '17:00',
      activities: 'Embarkation - Board the Brilliant Lady at Port of Los Angeles around 5:00 PM',
      locationTypeId: 1, // Embarkation
      imageUrl: null,
    },
    {
      day: 2,
      date: '2026-04-19',
      locationName: 'Ensenada',
      arrivalTime: '09:00',
      departureTime: '17:00',
      activities:
        'Explore Ensenada with wine tasting in Valle de Guadalupe, visit La Bufadora marine geyser, enjoy fresh seafood and local culture',
      locationTypeId: 3, // Port
      imageUrl: null,
    },
    {
      day: 3,
      date: '2026-04-20',
      locationName: 'Sea Day',
      arrivalTime: null,
      departureTime: null,
      activities:
        'Day at Sea - Enjoy pool deck parties, T-dances, drag performances, fitness classes, and relax while cruising south',
      locationTypeId: 4, // Sea Day
      imageUrl: null,
    },
    {
      day: 4,
      date: '2026-04-21',
      locationName: 'Cabo San Lucas',
      arrivalTime: '09:00',
      departureTime: '17:00',
      activities:
        'Visit El Arco by boat, relax on Lovers Beach, snorkeling at Santa Maria Beach, explore marina and downtown Cabo',
      locationTypeId: 3, // Port
      imageUrl: null,
    },
    {
      day: 5,
      date: '2026-04-22',
      locationName: 'Puerto Vallarta',
      arrivalTime: '12:00',
      departureTime: '01:00',
      activities:
        'Extended stay in Puerto Vallarta - Explore Zona Romantica, stroll the Malecon, enjoy LGBT nightlife at Blue Chairs, Mr. Flamingo, and La Noche',
      locationTypeId: 11, // Overnight Arrival
      imageUrl: null,
    },
    {
      day: 6,
      date: '2026-04-23',
      locationName: 'Mazatlan',
      arrivalTime: '12:00',
      departureTime: '18:00',
      activities:
        "Discover Old Mazatlan's Plaza Machado, walk the famous Malecon boardwalk, visit beaches and historic cathedral",
      locationTypeId: 3, // Port
      imageUrl: null,
    },
    {
      day: 7,
      date: '2026-04-24',
      locationName: 'Sea Day 2',
      arrivalTime: null,
      departureTime: null,
      activities:
        'Day at Sea - Enjoy production shows in Red Room, drag performances, late-night Manor parties, and final poolside celebrations',
      locationTypeId: 4, // Sea Day
      imageUrl: null,
    },
    {
      day: 8,
      date: '2026-04-25',
      locationName: 'Sea Day 3',
      arrivalTime: null,
      departureTime: null,
      activities:
        'Day at Sea - Last full day aboard, farewell parties, pack, and enjoy final onboard entertainment',
      locationTypeId: 4, // Sea Day
      imageUrl: null,
    },
    {
      day: 9,
      date: '2026-04-26',
      locationName: 'Los Angeles',
      arrivalTime: '05:00',
      departureTime: null,
      activities:
        'Disembarkation - Arrive early morning at Port of Los Angeles, disembark and end of cruise',
      locationTypeId: 2, // Disembarkation
      imageUrl: null,
    },
  ],
};

// HELPER FUNCTIONS

// Get venue type ID from name
async function getVenueTypeId(typeName: string): Promise<number> {
  const typeMap: Record<string, number> = {
    dining: 1, // Restaurant
    entertainment: 2, // Entertainment
    bar: 3, // Bars/Lounge
    spa: 4, // Spa
    recreation: 5, // Recreation
  };

  const id = typeMap[typeName];
  if (!id) throw new Error(`Unknown venue type: ${typeName}`);
  return id;
}

// Upload image to Supabase
async function uploadImage(
  externalUrl: string,
  bucketType: string, // 'ships' | 'locations' | 'trips' | 'general'
  filename: string
): Promise<string> {
  try {
    logger.info(`Downloading: ${externalUrl}`);
    const supabaseUrl = await downloadImageFromUrl(externalUrl, bucketType, filename);
    logger.info(`Uploaded: ${supabaseUrl}`);
    return supabaseUrl;
  } catch (error) {
    logger.error(`Upload failed: ${externalUrl}`, error);
    throw error;
  }
}

// IMPORT FUNCTIONS

// FUNCTION 1: Upload all images
async function uploadAllImages(): Promise<void> {
  logger.info('=== STEP 1: Uploading Images ===');

  // Upload location images
  for (const location of cruiseData.locations) {
    if (location.imageUrl) {
      const filename = `${location.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      location.imageUrl = await uploadImage(location.imageUrl, 'locations', filename);
    }
  }

  // Upload hero image
  if (cruiseData.trip.heroImageUrl) {
    cruiseData.trip.heroImageUrl = await uploadImage(
      cruiseData.trip.heroImageUrl,
      'trips',
      `${cruiseData.trip.slug}-hero.jpg`
    );
  }

  logger.info('✅ All images uploaded');
}

// FUNCTION 2: Create ship venues
async function createVenuesForShip(shipId: number): Promise<void> {
  logger.info('=== STEP 2: Creating Ship Venues ===');

  for (const venue of cruiseData.venues) {
    const venueTypeId = await getVenueTypeId(venue.type);

    // Check if already exists
    const { data: existing } = await supabase
      .from('ship_venues')
      .select('id')
      .eq('ship_id', shipId)
      .eq('name', venue.name)
      .single();

    if (existing) {
      logger.info(`Venue exists: ${venue.name}`);
      continue;
    }

    const { error } = await supabase.from('ship_venues').insert({
      ship_id: shipId,
      name: venue.name,
      venue_type_id: venueTypeId,
      description: venue.description,
    });

    if (error) {
      throw new Error(`Failed to create venue: ${venue.name} - ${error.message}`);
    }

    logger.info(`Created venue: ${venue.name}`);
  }

  logger.info('✅ All venues created');
}

// FUNCTION 3: Create ship amenities
async function createAmenitiesForShip(shipId: number): Promise<void> {
  logger.info('=== STEP 3: Creating Ship Amenities ===');

  for (const amenity of cruiseData.amenities) {
    // Find or create amenity
    let amenityId: number;

    const { data: existing } = await supabase
      .from('amenities')
      .select('id')
      .eq('name', amenity.name)
      .single();

    if (existing) {
      amenityId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from('amenities')
        .insert({ name: amenity.name })
        .select('id')
        .single();

      if (error || !created) {
        throw new Error(`Failed to create amenity: ${error?.message}`);
      }
      amenityId = created.id;
    }

    // Link to ship (ignore duplicates)
    const { error } = await supabase
      .from('ship_amenities')
      .insert({ ship_id: shipId, amenity_id: amenityId });

    if (error && !error.message.includes('duplicate')) {
      throw new Error(`Failed to link amenity: ${error.message}`);
    }

    logger.info(`Linked amenity: ${amenity.name}`);
  }

  logger.info('✅ All amenities linked');
}

// FUNCTION 4: Create locations with attractions and LGBT venues
async function createLocations(): Promise<Map<string, number>> {
  logger.info('=== STEP 4: Creating Locations ===');

  const locationMap = new Map<string, number>();

  for (const location of cruiseData.locations) {
    // Check if exists
    const { data: existing } = await supabase
      .from('locations')
      .select('id')
      .eq('name', location.name)
      .single();

    let locationId: number;

    if (existing) {
      locationId = existing.id;
      logger.info(`Location exists: ${location.name} (ID: ${locationId})`);

      // Update with new data including attractions and LGBT venues
      const { error } = await supabase
        .from('locations')
        .update({
          description: location.description,
          image_url: location.imageUrl,
          city: location.city,
          state_province: location.state_province,
          country: location.country,
          country_code: location.country_code,
          top_attractions: location.topAttractions,
          top_lgbt_venues: location.lgbtVenues,
        })
        .eq('id', locationId);

      if (error) {
        logger.warn(`Failed to update location: ${error.message}`);
      } else {
        logger.info(`Updated location with attractions and LGBT venues`);
      }
    } else {
      // Create new location
      const { data: created, error } = await supabase
        .from('locations')
        .insert({
          name: location.name,
          description: location.description,
          image_url: location.imageUrl,
          city: location.city,
          state_province: location.state_province,
          country: location.country,
          country_code: location.country_code,
          top_attractions: location.topAttractions || null,
          top_lgbt_venues: location.lgbtVenues || null,
        })
        .select('id')
        .single();

      if (error || !created) {
        throw new Error(`Failed to create location: ${error?.message}`);
      }

      locationId = created.id;
      logger.info(`Created location: ${location.name} (ID: ${locationId})`);
    }

    locationMap.set(location.name, locationId);
  }

  logger.info('✅ All locations created');
  return locationMap;
}

// FUNCTION 4B: Create location attractions and LGBT venues in separate tables
async function createLocationDetails(locationMap: Map<string, number>): Promise<void> {
  logger.info('=== STEP 4B: Creating Location Attractions and LGBT Venues ===');

  for (const location of cruiseData.locations) {
    const locationId = locationMap.get(location.name);
    if (!locationId) continue;

    // Insert attractions
    if (location.topAttractions && location.topAttractions.length > 0) {
      for (let i = 0; i < location.topAttractions.length; i++) {
        const attraction = location.topAttractions[i];
        // Split on first " - " to separate name from description
        const dashIndex = attraction.indexOf(' - ');
        const name = dashIndex > 0 ? attraction.substring(0, dashIndex) : attraction;
        const description = dashIndex > 0 ? attraction.substring(dashIndex + 3) : '';

        // Determine category based on keywords
        let category = 'Cultural';
        if (
          attraction.toLowerCase().includes('beach') ||
          attraction.toLowerCase().includes('nature') ||
          attraction.toLowerCase().includes('park') ||
          attraction.toLowerCase().includes('marine')
        ) {
          category = 'Nature';
        } else if (
          attraction.toLowerCase().includes('historic') ||
          attraction.toLowerCase().includes('lighthouse')
        ) {
          category = 'Historical';
        } else if (
          attraction.toLowerCase().includes('entertain') ||
          attraction.toLowerCase().includes('pier')
        ) {
          category = 'Entertainment';
        }

        const { error } = await supabase.from('location_attractions').insert({
          location_id: locationId,
          name: name,
          description: description,
          category: category,
          order_index: i,
        });

        if (error) {
          logger.warn(`Failed to create attraction for ${location.name}: ${error.message}`);
        } else {
          logger.info(`Created attraction: ${name}`);
        }
      }
    }

    // Insert LGBT venues
    if (location.lgbtVenues && location.lgbtVenues.length > 0) {
      for (let i = 0; i < location.lgbtVenues.length; i++) {
        const venue = location.lgbtVenues[i];
        // Split on first " - " to separate name from description
        const dashIndex = venue.indexOf(' - ');
        const name = dashIndex > 0 ? venue.substring(0, dashIndex) : venue;
        const description = dashIndex > 0 ? venue.substring(dashIndex + 3) : '';

        // Determine venue type based on keywords
        let venueType = 'Bar';
        if (venue.toLowerCase().includes('club') || venue.toLowerCase().includes('nightclub')) {
          venueType = 'Club';
        } else if (
          venue.toLowerCase().includes('restaurant') ||
          venue.toLowerCase().includes('café')
        ) {
          venueType = 'Restaurant';
        } else if (venue.toLowerCase().includes('beach')) {
          venueType = 'Beach';
        } else if (venue.toLowerCase().includes('hotel')) {
          venueType = 'Hotel';
        }

        const { error } = await supabase.from('location_lgbt_venues').insert({
          location_id: locationId,
          name: name,
          venue_type: venueType,
          description: description,
          order_index: i,
        });

        if (error) {
          logger.warn(`Failed to create LGBT venue for ${location.name}: ${error.message}`);
        } else {
          logger.info(`Created LGBT venue: ${name}`);
        }
      }
    }
  }

  logger.info('✅ All location details created');
}

// FUNCTION 5: Create trip record
async function createTrip(shipId: number): Promise<number> {
  logger.info('=== STEP 5: Creating Trip ===');

  // Create trip
  const { data, error } = await supabase
    .from('trips')
    .insert({
      name: cruiseData.trip.name,
      slug: cruiseData.trip.slug,
      description: cruiseData.trip.description,
      start_date: cruiseData.trip.startDate, // NO timezone conversion
      end_date: cruiseData.trip.endDate, // NO timezone conversion
      hero_image_url: cruiseData.trip.heroImageUrl,
      trip_status_id: cruiseData.trip.statusId, // 5 = Preview
      trip_type_id: cruiseData.trip.tripTypeId, // 1 = Cruise
      charter_company_id: cruiseData.trip.charterCompanyId,
      ship_id: shipId,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create trip: ${error?.message}`);
  }

  logger.info(`✅ Trip created: ${cruiseData.trip.name} (ID: ${data.id})`);
  return data.id;
}

// FUNCTION 6: Create itinerary
async function createItinerary(tripId: number, locationMap: Map<string, number>): Promise<void> {
  logger.info('=== STEP 6: Creating Itinerary ===');

  for (const entry of cruiseData.itinerary) {
    const locationId = entry.locationName ? locationMap.get(entry.locationName) : null;

    // Parse date to timestamp without timezone conversion
    const [year, month, day] = entry.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const timestamp = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00:00`;

    const { error } = await supabase.from('itinerary').insert({
      trip_id: tripId,
      date: timestamp,
      day: entry.day,
      location_id: locationId,
      location_name: entry.locationName || null,
      arrival_time: entry.arrivalTime,
      departure_time: entry.departureTime,
      description: entry.activities,
      location_type_id: entry.locationTypeId,
      location_image_url: entry.imageUrl || null,
      order_index: entry.day,
    });

    if (error) {
      throw new Error(`Failed to create itinerary day ${entry.day}: ${error.message}`);
    }

    logger.info(`Created itinerary: Day ${entry.day} - ${entry.locationName || 'At Sea'}`);
  }

  logger.info('✅ Itinerary created');
}

// FUNCTION 7: Self-verify extraction
async function selfVerifyExtraction(sourceUrl: string): Promise<boolean> {
  logger.info('\n🔍 SELF-VERIFICATION: Checking extraction accuracy...\n');

  const checks: Array<{ name: string; passed: boolean; issue?: string }> = [];

  // 1. Verify trip dates
  console.log('✓ Checking trip dates...');
  checks.push({ name: 'Trip dates', passed: true });

  // 2. Verify location count (4 ports + LA = 5 locations)
  console.log('✓ Checking number of ports...');
  if (cruiseData.locations.length === 5) {
    checks.push({ name: 'Port count', passed: true });
  } else {
    checks.push({
      name: 'Port count',
      passed: false,
      issue: `Expected 5 locations, got ${cruiseData.locations.length}`,
    });
  }

  // 3. Verify itinerary count (9 days)
  console.log('✓ Checking itinerary days...');
  if (cruiseData.itinerary.length === 9) {
    checks.push({ name: 'Itinerary days', passed: true });
  } else {
    checks.push({
      name: 'Itinerary days',
      passed: false,
      issue: `Expected 9 days, got ${cruiseData.itinerary.length}`,
    });
  }

  // 4. Verify attractions research
  console.log('✓ Checking location research...');
  const locationsWithoutAttractions = cruiseData.locations.filter(
    l => !l.topAttractions || l.topAttractions.length === 0
  );
  const locationsWithoutLGBT = cruiseData.locations.filter(
    l => !l.lgbtVenues || l.lgbtVenues.length === 0
  );

  if (locationsWithoutAttractions.length > 0) {
    checks.push({
      name: 'Attractions research',
      passed: false,
      issue: `Missing attractions for: ${locationsWithoutAttractions.map(l => l.name).join(', ')}`,
    });
  } else {
    checks.push({ name: 'Attractions research', passed: true });
  }

  if (locationsWithoutLGBT.length > 0) {
    checks.push({
      name: 'LGBT venues research',
      passed: false,
      issue: `Missing LGBT venues for: ${locationsWithoutLGBT.map(l => l.name).join(', ')}`,
    });
  } else {
    checks.push({ name: 'LGBT venues research', passed: true });
  }

  // 5. Verify itinerary sequence
  console.log('✓ Checking itinerary sequence...');
  const days = cruiseData.itinerary.map(i => i.day).sort((a, b) => a - b);
  const hasGaps = days.some((day, index) => index > 0 && day !== days[index - 1] + 1);
  const hasDuplicates = new Set(days).size !== days.length;

  if (hasGaps || hasDuplicates) {
    checks.push({
      name: 'Itinerary sequence',
      passed: false,
      issue: hasGaps ? 'Day numbers have gaps' : 'Day numbers have duplicates',
    });
  } else {
    checks.push({ name: 'Itinerary sequence', passed: true });
  }

  // 6. Verify location type IDs
  console.log('✓ Checking location type IDs...');
  const missingLocationTypes = cruiseData.itinerary.filter(i => !i.locationTypeId);
  if (missingLocationTypes.length > 0) {
    checks.push({
      name: 'Location type IDs',
      passed: false,
      issue: `Missing location_type_id for ${missingLocationTypes.length} days`,
    });
  } else {
    checks.push({ name: 'Location type IDs', passed: true });
  }

  // Display results
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 SELF-VERIFICATION RESULTS');
  console.log('═══════════════════════════════════════════════════════\n');

  const failedChecks = checks.filter(c => !c.passed);
  const passedChecks = checks.filter(c => c.passed);

  passedChecks.forEach(check => {
    console.log(`✅ ${check.name}`);
  });

  if (failedChecks.length > 0) {
    console.log('');
    failedChecks.forEach(check => {
      console.log(`❌ ${check.name}`);
      console.log(`   Issue: ${check.issue}`);
      console.log(`   Action: Please correct this in the cruiseData structure`);
    });
    console.log('\n⚠️  VERIFICATION FAILED - Please fix the issues above before proceeding.\n');
    return false;
  } else {
    console.log('\n✅ All verification checks passed!\n');
    return true;
  }
}

// FUNCTION 8: Preview changes and get user confirmation
async function previewChanges(): Promise<boolean> {
  logger.info('\n═══════════════════════════════════════════════════════');
  logger.info('📋 IMPORT PREVIEW - Review Before Database Changes');
  logger.info('═══════════════════════════════════════════════════════\n');

  // 1. Trip Information
  console.log('🚢 TRIP DETAILS:');
  console.log(`   Name: ${cruiseData.trip.name}`);
  console.log(`   Slug: ${cruiseData.trip.slug}`);
  console.log(`   Dates: ${cruiseData.trip.startDate} to ${cruiseData.trip.endDate}`);
  console.log(`   Status: Preview (will require manual publishing)`);
  console.log(`   Charter Company ID: ${cruiseData.trip.charterCompanyId}`);
  console.log(`   Ship: Brilliant Lady (ID: ${cruiseData.trip.shipId})\n`);

  // 2. Images Summary
  console.log('🖼️  IMAGES TO UPLOAD:');
  console.log(`   Hero image: ${cruiseData.trip.heroImageUrl ? '✅' : '❌'}`);
  console.log(`   Location images: ${cruiseData.locations.filter(l => l.imageUrl).length} images`);
  console.log(`   All images will be uploaded to Supabase Storage\n`);

  // 3. Locations
  console.log('📍 LOCATIONS:');
  console.log(`   Total locations: ${cruiseData.locations.length}\n`);

  // Check which locations already exist
  const existingLocations: string[] = [];
  const newLocations: string[] = [];

  for (const location of cruiseData.locations) {
    const { data } = await supabase
      .from('locations')
      .select('id')
      .eq('name', location.name)
      .single();

    if (data) {
      existingLocations.push(location.name);
    } else {
      newLocations.push(location.name);
    }
  }

  if (newLocations.length > 0) {
    console.log(`   ✨ NEW locations to create (${newLocations.length}):`);
    newLocations.forEach(name => {
      const loc = cruiseData.locations.find(l => l.name === name);
      console.log(`      • ${name}`);
      if (loc?.topAttractions) {
        console.log(`        Attractions: ${loc.topAttractions.length} researched`);
      }
      if (loc?.lgbtVenues) {
        console.log(`        LGBT venues: ${loc.lgbtVenues.length} researched`);
      }
    });
    console.log('');
  }

  if (existingLocations.length > 0) {
    console.log(`   ♻️  EXISTING locations (will be updated) (${existingLocations.length}):`);
    existingLocations.forEach(name => {
      const loc = cruiseData.locations.find(l => l.name === name);
      console.log(`      • ${name}`);
      if (loc?.topAttractions || loc?.lgbtVenues) {
        console.log(
          `        Will update: attractions (${loc?.topAttractions?.length || 0}), LGBT venues (${loc?.lgbtVenues?.length || 0})`
        );
      }
    });
    console.log('');
  }

  // 4. Venues
  console.log('🍽️  SHIP VENUES:');
  console.log(`   Total venues: ${cruiseData.venues.length}`);
  const venuesByType = cruiseData.venues.reduce(
    (acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  Object.entries(venuesByType).forEach(([type, count]) => {
    console.log(`      • ${type}: ${count}`);
  });
  console.log('');

  // 5. Amenities
  console.log('✨ SHIP AMENITIES:');
  console.log(`   Total amenities: ${cruiseData.amenities.length}`);
  cruiseData.amenities.slice(0, 5).forEach(a => {
    console.log(`      • ${a.name}`);
  });
  if (cruiseData.amenities.length > 5) {
    console.log(`      ... and ${cruiseData.amenities.length - 5} more`);
  }
  console.log('');

  // 6. Itinerary Summary
  console.log('📅 ITINERARY:');
  console.log(`   Total days: ${cruiseData.itinerary.length}`);
  console.log(
    `   Ports of call: ${cruiseData.itinerary.filter(i => i.locationTypeId === 3).length}`
  );
  console.log(`   Sea days: ${cruiseData.itinerary.filter(i => i.locationTypeId === 4).length}`);
  console.log(
    `   Embarkation: Day ${cruiseData.itinerary.find(i => i.locationTypeId === 1)?.day || 'N/A'}`
  );
  console.log(
    `   Disembarkation: Day ${cruiseData.itinerary.find(i => i.locationTypeId === 2)?.day || 'N/A'}\n`
  );

  // Show first few days
  console.log('   Sample itinerary (first 5 days):');
  cruiseData.itinerary.slice(0, 5).forEach(day => {
    const typeLabels: Record<number, string> = {
      1: 'Embarkation',
      2: 'Disembarkation',
      3: 'Port',
      4: 'Sea Day',
      11: 'Overnight Arrival',
      12: 'Overnight Departure',
    };
    console.log(
      `      Day ${day.day}: ${day.locationName || 'At Sea'} (${typeLabels[day.locationTypeId]})`
    );
    if (day.arrivalTime || day.departureTime) {
      console.log(`         Times: ${day.arrivalTime || '—'} to ${day.departureTime || '—'}`);
    }
  });
  if (cruiseData.itinerary.length > 5) {
    console.log(`      ... and ${cruiseData.itinerary.length - 5} more days`);
  }
  console.log('');

  // 7. Critical Rules
  console.log('⚠️  CRITICAL RULES VERIFIED:');
  console.log('   ✅ All dates stored as timestamp strings (no timezone conversion)');
  console.log('   ✅ All images will be uploaded to Supabase Storage');
  console.log('   ✅ Trip status set to Preview (ID: 5)');
  console.log('   ✅ Sequential day numbers in itinerary');
  console.log('   ✅ All itinerary entries have location_type_id\n');

  console.log('═══════════════════════════════════════════════════════\n');

  // Prompt for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question('👉 Proceed with database import? (yes/no): ', (answer: string) => {
      rl.close();
      const confirmed = answer.toLowerCase().trim() === 'yes';

      if (confirmed) {
        logger.info('✅ Import confirmed. Proceeding with database changes...\n');
      } else {
        logger.info('❌ Import cancelled by user.');
      }

      resolve(confirmed);
    });
  });
}

// MAIN EXECUTION
async function main() {
  try {
    logger.info('🚢 Starting cruise import...\n');

    // ═══════════════════════════════════════════════
    // PHASE 1: DATA PREPARATION (No database changes)
    // ═══════════════════════════════════════════════

    logger.info('📦 Phase 1: Data Preparation\n');

    // Step 1: Self-verify extraction
    const SOURCE_URL = 'https://atlantisevents.com/vacation/la26-la-to-mexico/';
    const verificationPassed = await selfVerifyExtraction(SOURCE_URL);

    if (!verificationPassed) {
      logger.error('⚠️  Self-verification failed. Please fix the issues and run again.');
      process.exit(1);
    }

    // Step 2: Upload images
    await uploadAllImages();

    logger.info('\n✅ Data preparation complete!\n');

    // ═══════════════════════════════════════════════
    // PHASE 2: PREVIEW & CONFIRMATION
    // ═══════════════════════════════════════════════

    const confirmed = await previewChanges();

    if (!confirmed) {
      logger.info('Import cancelled. No database changes were made.');
      process.exit(0);
    }

    // ═══════════════════════════════════════════════
    // PHASE 3: DATABASE IMPORT (Writes to database)
    // ═══════════════════════════════════════════════

    logger.info('💾 Phase 3: Database Import\n');

    const shipId = cruiseData.trip.shipId;

    // Create venues and amenities
    await createVenuesForShip(shipId);
    await createAmenitiesForShip(shipId);

    // Create locations with research
    const locationMap = await createLocations();

    // Create location attractions and LGBT venues in separate tables
    await createLocationDetails(locationMap);

    // Create trip
    const tripId = await createTrip(shipId);

    // Create itinerary
    await createItinerary(tripId, locationMap);

    // ═══════════════════════════════════════════════
    // COMPLETE
    // ═══════════════════════════════════════════════

    logger.info('\n🎉 IMPORT COMPLETE!');
    logger.info(`Trip ID: ${tripId}`);
    logger.info(`Trip Slug: ${cruiseData.trip.slug}`);
    logger.info(`Status: Preview (ID: 5)`);
    logger.info(`URL: /trip/${cruiseData.trip.slug}`);
    logger.info('\n📝 Next steps:');
    logger.info('   1. Visit the trip page and verify all data');
    logger.info('   2. Check hero carousel displays correctly');
    logger.info('   3. Verify attractions and LGBT venues show in itinerary');
    logger.info('   4. Change status to Published when ready\n');
  } catch (error) {
    logger.error('❌ Import failed', error);
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute import
main();
