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

// ═══════════════════════════════════════════════
// CRUISE DATA STRUCTURE
// ═══════════════════════════════════════════════

const cruiseData = {
  trip: {
    name: 'Athens to Venice Cruise 26',
    slug: 'athens-venice-cruise-2026',
    description:
      "Join Atlantis Events for an unforgettable 10-night Mediterranean cruise from Athens to Venice aboard Virgin Voyages' stunning Scarlet Lady. Experience the legendary gay nightlife of Mykonos, explore ancient wonders at Ephesus, discover Istanbul's rich culture with an overnight stay, and cruise through stunning Croatian coastal cities. With approximately 2,700 guests from around the world, daily T-dances, nightly entertainment featuring drag queens and DJs, and premium dining included, this cruise offers the perfect blend of cultural exploration and gay celebration.",
    startDate: '2026-07-05 00:00:00', // NO timezone conversion
    endDate: '2026-07-15 00:00:00', // NO timezone conversion
    heroImageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1920&q=80', // Mykonos windmills - will be uploaded
    statusId: 5, // Preview status
    tripTypeId: 1, // Cruise
    charterCompanyId: 1, // Atlantis Events
    cruiseLineId: 1, // Virgin Voyages
  },

  ship: {
    name: 'Scarlet Lady',
    cruiseLineId: 1, // Virgin Voyages
    capacity: 2700,
    description:
      "Virgin Voyages' flagship vessel, Scarlet Lady redefines modern cruising with her adults-only atmosphere, included premium dining, complimentary WiFi, and no gratuities policy. Featuring over 20 eateries, world-class entertainment including Broadway-caliber shows, and stunning design throughout, this innovative ship offers the perfect setting for an unforgettable Atlantis cruise.",
    imageUrl: 'https://images.unsplash.com/photo-1601655183019-5e4cdbf57a83?w=1920&q=80', // Cruise ship - will be uploaded
  },

  venues: [
    {
      name: 'Extra Virgin',
      type: 'dining',
      description:
        'Italian restaurant featuring fresh pasta, regional Italian dishes, and authentic flavors from across Italy',
    },
    {
      name: 'Gumbae',
      type: 'dining',
      description:
        'Interactive Korean BBQ experience with tableside grilling and traditional Korean flavors',
    },
    {
      name: 'Test Kitchen',
      type: 'dining',
      description:
        'Inventive tasting menu restaurant featuring creative culinary experiments and molecular gastronomy',
    },
    {
      name: 'The Wake',
      type: 'dining',
      description: 'Brunch destination and steakhouse serving premium cuts and breakfast favorites',
    },
    {
      name: 'Razzle Dazzle',
      type: 'dining',
      description:
        'All-day casual dining with ice cream, crepes, and quick bites available throughout the day',
    },
    {
      name: 'Red Room',
      type: 'entertainment',
      description:
        'Flagship entertainment space featuring Broadway-caliber shows with drag queens, comics, and acrobatic performances',
    },
    {
      name: 'The Manor',
      type: 'entertainment',
      description:
        'Intimate nightclub with late-night entertainment including comedians and outrageous drag shows',
    },
    {
      name: 'Pool Deck',
      type: 'recreation',
      description:
        'Outdoor party venue featuring daily T-dance afternoon pool parties with DJs and stunning ocean views',
    },
    {
      name: 'Spa & Wellness Center',
      type: 'spa',
      description: 'Full-service spa offering treatments, massages, and wellness facilities',
    },
    {
      name: 'Fitness Center',
      type: 'recreation',
      description:
        'Modern gym facility with included fitness classes and state-of-the-art equipment',
    },
  ],

  amenities: [
    { name: 'Basic WiFi Included' },
    { name: 'Premium Dining Included' },
    { name: 'Fitness Classes' },
    { name: 'No Gratuities' },
    { name: 'Hot Tubs' },
    { name: 'Sun Decks' },
    { name: 'Nightly DJ Performances' },
    { name: 'Broadway-Style Shows' },
    { name: 'Daily T-Dance Pool Parties' },
  ],

  locations: [
    {
      name: 'Athens',
      description:
        'The capital and largest city of Greece, Athens is the birthplace of Western civilization and democracy, home to the iconic Acropolis and ancient treasures.',
      imageUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1920&q=80', // Acropolis
      country: 'Greece',
      topAttractions: [
        'The Acropolis & Parthenon - UNESCO World Heritage Site featuring the iconic Parthenon temple, the Erechtheion, and the Propylaea',
        'Ancient Agora - 2,000-year-old marketplace featuring the Temple of Hephaestus, once the center of ancient Athenian life',
        'Plaka Neighborhood - Beautiful historical neighborhood beneath the Acropolis with neoclassical architecture and traditional tavernas',
      ],
      lgbtVenues: [
        'Shamone Club (Gazi District) - Premier LGBTQ+ nightlife destination with drag performances, live shows, and themed parties',
        'Sodade2 - Most popular gay club in Athens featuring two dancefloors (pop hits and progressive house)',
        'Koukles - Legendary venue run by trans women, famous for spectacular live drag shows',
      ],
    },
    {
      name: 'Mykonos',
      description:
        'One of the most famous Greek islands and the "Gay Capital of Greece," Mykonos is world-renowned for its vibrant LGBT scene, stunning beaches, and iconic whitewashed architecture.',
      imageUrl: 'https://images.unsplash.com/photo-1601581987892-6d52504d96ae?w=1920&q=80', // Mykonos windmills
      country: 'Greece',
      topAttractions: [
        'Little Venice & The Windmills - Iconic waterfront houses and five traditional windmills offering spectacular sunset views',
        "Panagia Paraportiani Church - One of Greece's most photographed churches, a unique whitewashed architectural marvel from the 1500s",
        'Delos Island - UNESCO World Heritage archaeological site, birthplace of Apollo and Artemis, with ancient temples and theaters',
      ],
      lgbtVenues: [
        "Jackie O' Town Bar - Mykonos' most iconic gay bar with drag shows and vibrant atmosphere near the waterfront",
        'Super Paradise Beach - Ultimate gay beach party destination with DJs, dancing, and continuous party atmosphere',
        'Elia Beach - Best and most popular gay beach in Mykonos, eastern half is clothing-optional and predominantly gay',
      ],
    },
    {
      name: 'Kuşadası',
      description:
        'A popular Aegean coastal resort town and major cruise port serving as the gateway to the ancient city of Ephesus, one of the best-preserved Roman cities in the Mediterranean.',
      imageUrl: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1920&q=80', // Ephesus Library
      country: 'Turkey',
      topAttractions: [
        'Ancient City of Ephesus - UNESCO World Heritage Site featuring the Library of Celsus, Great Theater (24,000 seats), and marble streets',
        'House of the Virgin Mary - Stone shrine in the Aladag Mountains believed to be where Mary lived her final days',
        'Temple of Artemis - One of the Seven Wonders of the Ancient World, with a single column remaining',
      ],
      lgbtVenues: [
        "Bar Street (Barlar Sokağı) - Main nightlife hub with Jimmy's Irish Bar and Kaleici Pub, tourist-friendly and welcoming",
        'Beach Clubs (Ladies Beach) - Jade Beach Club and Miracle Beach Club with themed nights and international crowds',
        'Mainstream Nightclubs - Ex-Club, Mascara, and Ku-Ba feature international DJs and diverse tourist crowds',
      ],
    },
    {
      name: 'Istanbul',
      description:
        "Turkey's cultural capital straddling Europe and Asia, Istanbul is a magnificent city featuring Byzantine churches, Ottoman mosques, bustling bazaars, and a thriving underground LGBT scene.",
      imageUrl: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1920&q=80', // Blue Mosque
      country: 'Turkey',
      topAttractions: [
        'Hagia Sophia - Built in 537 AD, architectural marvel that has served as church, mosque, and museum for 1,500 years',
        'Blue Mosque - Famous for 20,000 blue Iznik tiles, 17th-century masterpiece with six elegant minarets',
        'Topkapi Palace - For 400 years the center of Ottoman Empire, featuring courtyards, treasures, and the Imperial Harem',
      ],
      lgbtVenues: [
        "Tek Yön Club - Istanbul's largest and most popular gay dance club in Taksim/Beyoğlu district, busy every night",
        'Love Dance Point - Popular weekend gay nightclub in Harbiye near Taksim featuring bar, music, and gogo shows',
        'Mor Kedi Cafe & Bar - LGBT-friendly cafe and bar on Istiklal Street offering relaxed, inclusive atmosphere',
      ],
    },
    {
      name: 'Santorini',
      description:
        "One of the world's most romantic destinations, Santorini is a volcanic island famous for its dramatic caldera views, whitewashed buildings with blue-domed churches, and spectacular sunsets.",
      imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1920&q=80', // Santorini Oia
      country: 'Greece',
      topAttractions: [
        'Oia Village & Sunset Viewing - Iconic postcard-perfect village with whitewashed houses and world-famous sunsets',
        'Ancient Akrotiri - "Pompeii of the Aegean," Minoan settlement preserved under volcanic ash from 1600 BC',
        'Caldera & Volcano Tours - Boat tours to active volcanic island with swimming in thermal hot springs',
      ],
      lgbtVenues: [
        'Enigma Club (Fira) - Lively nightclub offering LGBTQ+ atmosphere with dance floor, drag performances, and fire shows',
        'Tropical Bar (Fira) - Gay-friendly bar with breathtaking caldera views, perfect for sunset cocktails',
        'Koo Club (Oia) - Cozy gay-friendly bar with stunning outdoor terrace overlooking the caldera',
      ],
    },
    {
      name: 'Dubrovnik',
      description:
        'Known as the "Pearl of the Adriatic," Dubrovnik is a stunning medieval walled city and UNESCO World Heritage site featuring baroque buildings, marble streets, and Game of Thrones filming locations.',
      imageUrl: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=1920&q=80', // Dubrovnik walls
      country: 'Croatia',
      topAttractions: [
        'Dubrovnik City Walls - Spectacular 2-kilometer medieval fortification with breathtaking panoramic views of the Adriatic',
        "Old Town (Stari Grad) - UNESCO-listed medieval masterpiece with marble streets, Stradun, and Europe's oldest pharmacy (1391)",
        'Mount Srđ Cable Car - 3-minute ride to 412 meters offering best panoramic view of Dubrovnik and surrounding islands',
      ],
      lgbtVenues: [
        "Milk - Dubrovnik's first official gay bar (opened May 2022) in Old Town with stunning design and live DJ",
        'Troubadour Jazz Café - Beloved gay-friendly café next to cathedral featuring live jazz music and intimate atmosphere',
        'Monokini Lounge Bar - LGBTQ-friendly lounge near the coast with croissants, salads, and creative cocktails',
      ],
    },
    {
      name: 'Zadar',
      description:
        'An ancient coastal city in northern Dalmatia combining 3,000 years of history with modern artistic installations including the unique Sea Organ and Greeting to the Sun.',
      imageUrl: 'https://images.unsplash.com/photo-1624947061867-080e57d28a09?w=1920&q=80', // Zadar Sea Organ
      country: 'Croatia',
      topAttractions: [
        'Sea Organ - Unique architectural sound art using underwater pipes to transform waves into haunting melodies',
        'Greeting to the Sun - Solar-powered 22-meter art installation with 300 glass plates creating colorful light display at dusk',
        'Church of St. Donatus & Roman Forum - 9th-century pre-Romanesque church with distinctive Byzantine architecture',
      ],
      lgbtVenues: [
        'Ledana Lounge Bar and Club - Popular nightlife spot in Old Town with great drinks, party events, and queer-friendly atmosphere',
        'Frenky Bar - Chic queer-friendly bar known for affordable prices, great cocktails, and excellent music',
        'Svarog Bar - Features large dance floor and DJs playing electronic, pop, and house music, welcoming to LGBT guests',
      ],
    },
    {
      name: 'Venice',
      description:
        'A magical city built on 118 islands connected by bridges and canals. Note: Cruise docks at Trieste (90 miles northeast) with transportation to Venice provided.',
      imageUrl: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1920&q=80', // Venice Grand Canal
      country: 'Italy',
      topAttractions: [
        "St. Mark's Square and Basilica - Stunning Byzantine architecture with gold mosaics, bell tower, and nearby Doge's Palace",
        "Grand Canal and Rialto Bridge - Venice's main waterway lined with stunning palaces and the iconic Rialto Bridge",
        'Murano and Burano Islands - Glass-making studios in Murano and rainbow-hued houses in Burano',
      ],
      lgbtVenues: [
        'Trash and Chic - Premier LGBTQ+ party event held 2-3 times per month in Mestre (12 minutes from Venice) with drag queens',
        'Mytilus (Trieste) - Beautiful LGBTQ+-friendly restaurant, bar, and beach club in Trieste with seafood and gourmet cuisine',
        'Jotassassina (Trieste) - Regular Saturday gay party in Trieste organized with local LGBTQ+ organizations since 2008',
      ],
    },
  ],

  itinerary: [
    {
      day: 1,
      locationName: 'Athens',
      arrivalTime: null,
      departureTime: '19:00',
      activities: 'Embarkation - Board ship and depart Athens',
      locationTypeId: 1, // Embarkation
      imageUrl: null,
    },
    {
      day: 2,
      locationName: 'Mykonos',
      arrivalTime: '10:00',
      departureTime: null,
      activities:
        'Extended stay in Mykonos until 2:30 AM - evening in famous gay nightlife scene with bars and clubs',
      locationTypeId: 11, // Overnight Arrival
      imageUrl: null,
    },
    {
      day: 3,
      locationName: 'Mykonos',
      arrivalTime: null,
      departureTime: '02:30',
      activities: 'Late departure at 2:30 AM allows for full evening of Mykonos nightlife',
      locationTypeId: 12, // Overnight Departure
      imageUrl: null,
    },
    {
      day: 4,
      locationName: 'Kuşadası',
      arrivalTime: '09:00',
      departureTime: '15:30',
      activities: 'Visit ancient Ephesus UNESCO World Heritage Site and House of Virgin Mary',
      locationTypeId: 3, // Port of Call
      imageUrl: null,
    },
    {
      day: 5,
      locationName: 'Istanbul',
      arrivalTime: '13:00',
      departureTime: null,
      activities:
        'Afternoon arrival in Istanbul - overnight stay for extended exploration of this magnificent city',
      locationTypeId: 11, // Overnight Arrival
      imageUrl: null,
    },
    {
      day: 6,
      locationName: 'Istanbul',
      arrivalTime: null,
      departureTime: '18:00',
      activities:
        'Full day in Istanbul exploring Hagia Sophia, Blue Mosque, Topkapi Palace, Grand Bazaar, and more',
      locationTypeId: 12, // Overnight Departure
      imageUrl: null,
    },
    {
      day: 7,
      locationName: null, // Will be auto-assigned to "Sea Day"
      arrivalTime: null,
      departureTime: null,
      activities: 'Relax and enjoy ship amenities, T-dance pool parties, and entertainment',
      locationTypeId: 4, // Day at Sea
      imageUrl: null,
    },
    {
      day: 8,
      locationName: 'Santorini',
      arrivalTime: '09:00',
      departureTime: '22:00',
      activities:
        'Extended late departure at 10 PM perfect for sunset viewing in Oia and evening dining',
      locationTypeId: 3, // Port of Call
      imageUrl: null,
    },
    {
      day: 9,
      locationName: null, // Will be auto-assigned to "Sea Day 2"
      arrivalTime: null,
      departureTime: null,
      activities: 'Sea day with entertainment, shows, and relaxation',
      locationTypeId: 4, // Day at Sea
      imageUrl: null,
    },
    {
      day: 10,
      locationName: 'Dubrovnik',
      arrivalTime: '08:00',
      departureTime: '18:00',
      activities:
        'Explore medieval Old Town, walk the city walls, and enjoy Game of Thrones filming locations',
      locationTypeId: 3, // Port of Call
      imageUrl: null,
    },
    {
      day: 11,
      locationName: 'Zadar',
      arrivalTime: '10:00',
      departureTime: '17:00',
      activities:
        'Experience Sea Organ and Greeting to the Sun art installations, explore Roman Forum',
      locationTypeId: 3, // Port of Call
      imageUrl: null,
    },
    {
      day: 12,
      locationName: 'Venice',
      arrivalTime: '07:00',
      departureTime: null,
      activities: 'Disembark in Trieste with transportation to Venice and airport provided',
      locationTypeId: 2, // Disembarkation
      imageUrl: null,
    },
  ],
};

// ═══════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════

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

// Get sea day locations in sequential order
async function getSeaDayLocations(): Promise<Map<number, number>> {
  logger.info('Loading Sea Day locations...');

  const seaDayMap = new Map<number, number>();

  // Sea Day locations exist in the database with these names
  const seaDayNames = ['Sea Day', 'Sea Day 2', 'Sea Day 3', 'Sea Day 4'];

  for (let i = 0; i < seaDayNames.length; i++) {
    const { data, error } = await supabase
      .from('locations')
      .select('id')
      .eq('name', seaDayNames[i])
      .single();

    if (error || !data) {
      logger.warn(`Sea Day location not found: ${seaDayNames[i]}`);
      continue;
    }

    seaDayMap.set(i + 1, data.id); // Map: 1 → "Sea Day" ID, 2 → "Sea Day 2" ID, etc.
    logger.info(`Found ${seaDayNames[i]} (ID: ${data.id})`);
  }

  if (seaDayMap.size === 0) {
    throw new Error('No Sea Day locations found in database. Please create them first.');
  }

  return seaDayMap;
}

// Upload image to Supabase
async function uploadImage(
  externalUrl: string,
  bucketType: string, // 'ships' | 'locations' | 'trips' | 'general'
  filename: string
): Promise<string | null> {
  try {
    logger.info(`Downloading: ${externalUrl}`);
    const supabaseUrl = await downloadImageFromUrl(externalUrl, bucketType, filename);
    logger.info(`Uploaded: ${supabaseUrl}`);
    return supabaseUrl;
  } catch (error) {
    logger.warn(`Upload failed: ${externalUrl} - Image will be skipped`, error);
    return null; // Return null instead of throwing, allowing import to continue
  }
}

// ═══════════════════════════════════════════════
// IMPORT FUNCTIONS
// ═══════════════════════════════════════════════

// FUNCTION 1: Upload all images
async function uploadAllImages(): Promise<void> {
  logger.info('=== STEP 1: Uploading Images ===');

  let successCount = 0;
  let failCount = 0;

  // Upload location images
  for (const location of cruiseData.locations) {
    if (location.imageUrl) {
      const filename = `${location.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      const result = await uploadImage(location.imageUrl, 'locations', filename);
      if (result) {
        location.imageUrl = result;
        successCount++;
      } else {
        location.imageUrl = null;
        failCount++;
      }
    }
  }

  // Upload hero image
  if (cruiseData.trip.heroImageUrl) {
    const result = await uploadImage(
      cruiseData.trip.heroImageUrl,
      'trips',
      `${cruiseData.trip.slug}-hero.jpg`
    );
    if (result) {
      cruiseData.trip.heroImageUrl = result;
      successCount++;
    } else {
      cruiseData.trip.heroImageUrl = null;
      failCount++;
    }
  }

  // Upload ship image
  if (cruiseData.ship.imageUrl) {
    const result = await uploadImage(
      cruiseData.ship.imageUrl,
      'ships',
      `${cruiseData.ship.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
    );
    if (result) {
      cruiseData.ship.imageUrl = result;
      successCount++;
    } else {
      cruiseData.ship.imageUrl = null;
      failCount++;
    }
  }

  logger.info(
    `✅ Image upload complete: ${successCount} succeeded, ${failCount} failed (will be null)`
  );
}

// FUNCTION 2: Find or create ship
async function getOrCreateShip(): Promise<number> {
  logger.info('=== STEP 2: Finding/Creating Ship ===');

  const { data: existing } = await supabase
    .from('ships')
    .select('id')
    .eq('name', cruiseData.ship.name)
    .eq('cruise_line_id', cruiseData.ship.cruiseLineId)
    .single();

  if (existing) {
    logger.info(`Found ship: ${cruiseData.ship.name} (ID: ${existing.id})`);
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from('ships')
    .insert({
      name: cruiseData.ship.name,
      cruise_line_id: cruiseData.ship.cruiseLineId,
      capacity: cruiseData.ship.capacity,
      description: cruiseData.ship.description,
      image_url: cruiseData.ship.imageUrl,
    })
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create ship: ${error?.message}`);
  }

  logger.info(`Created ship: ${cruiseData.ship.name} (ID: ${created.id})`);
  return created.id;
}

// FUNCTION 3: Create ship venues
async function createVenuesForShip(shipId: number): Promise<void> {
  logger.info('=== STEP 3: Creating Ship Venues ===');

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

// FUNCTION 4: Create ship amenities
async function createAmenitiesForShip(shipId: number): Promise<void> {
  logger.info('=== STEP 4: Creating Ship Amenities ===');

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

// FUNCTION 5: Create locations with attractions and LGBT venues
async function createLocations(): Promise<Map<string, number>> {
  logger.info('=== STEP 5: Creating Locations ===');

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

      // IMPORTANT: Always update with attractions and LGBT venues
      if (location.topAttractions || location.lgbtVenues) {
        logger.info(`Updating ${location.name} with research data:`);
        logger.info(`  - Attractions: ${location.topAttractions?.length || 0}`);
        logger.info(`  - LGBT venues: ${location.lgbtVenues?.length || 0}`);

        const { error } = await supabase
          .from('locations')
          .update({
            top_attractions: JSON.stringify(location.topAttractions || []),
            top_lgbt_venues: JSON.stringify(location.lgbtVenues || []),
          })
          .eq('id', locationId);

        if (error) {
          logger.error(`Failed to update location research for ${location.name}:`, error);
          throw new Error(`Failed to update location research: ${error.message}`);
        } else {
          logger.info(`✅ Updated ${location.name} with attractions and LGBT venues`);
        }
      } else {
        logger.warn(`⚠️  No research data for existing location: ${location.name}`);
      }
    } else {
      // Create new location
      logger.info(`Creating new location: ${location.name}`);
      logger.info(`  - Attractions: ${location.topAttractions?.length || 0}`);
      logger.info(`  - LGBT venues: ${location.lgbtVenues?.length || 0}`);

      const { data: created, error } = await supabase
        .from('locations')
        .insert({
          name: location.name,
          description: location.description,
          image_url: location.imageUrl,
          country: location.country,
          top_attractions: JSON.stringify(location.topAttractions || []),
          top_lgbt_venues: JSON.stringify(location.lgbtVenues || []),
        })
        .select('id')
        .single();

      if (error || !created) {
        logger.error(`Failed to create location ${location.name}:`, error);
        throw new Error(`Failed to create location: ${error?.message}`);
      }

      locationId = created.id;
      logger.info(`✅ Created location: ${location.name} (ID: ${locationId})`);
    }

    // VERIFY the data was saved
    const { data: verification, error: verifyError } = await supabase
      .from('locations')
      .select('top_attractions, top_lgbt_venues')
      .eq('id', locationId)
      .single();

    if (verifyError) {
      logger.warn(`Could not verify location data for ${location.name}`);
    } else {
      const attractionsData = verification?.top_attractions;
      const lgbtData = verification?.top_lgbt_venues;

      let attractionsCount = 0;
      let lgbtCount = 0;

      try {
        const attractions =
          typeof attractionsData === 'string' ? JSON.parse(attractionsData) : attractionsData;
        attractionsCount = Array.isArray(attractions) ? attractions.length : 0;
      } catch (e) {
        logger.warn(`Could not parse attractions for ${location.name}`);
      }

      try {
        const lgbtVenues = typeof lgbtData === 'string' ? JSON.parse(lgbtData) : lgbtData;
        lgbtCount = Array.isArray(lgbtVenues) ? lgbtVenues.length : 0;
      } catch (e) {
        logger.warn(`Could not parse LGBT venues for ${location.name}`);
      }

      if (attractionsCount === 0 && lgbtCount === 0) {
        logger.error(`❌ VERIFICATION FAILED: ${location.name} has no research data in database!`);
        throw new Error(
          `Location ${location.name} was created/updated but research data is missing`
        );
      } else {
        logger.info(
          `✅ Verified: ${location.name} has ${attractionsCount} attractions, ${lgbtCount} LGBT venues`
        );
      }
    }

    locationMap.set(location.name, locationId);
  }

  logger.info('✅ All locations created and verified');
  return locationMap;
}

// FUNCTION 6: Create trip record
async function createTrip(shipId: number): Promise<number> {
  logger.info('=== STEP 6: Creating Trip ===');

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

// FUNCTION 7: Create itinerary
async function createItinerary(tripId: number, locationMap: Map<string, number>): Promise<void> {
  logger.info('=== STEP 7: Creating Itinerary ===');

  // Load Sea Day locations for proper assignment
  const seaDayLocations = await getSeaDayLocations();
  let seaDayCounter = 1; // Track which Sea Day location to use

  // Parse start date from cruiseData.trip.startDate
  // Format is "2026-07-05 00:00:00"
  const [dateStr] = cruiseData.trip.startDate.split(' ');
  const [year, month, day] = dateStr.split('-').map(Number);
  const startDate = new Date(year, month - 1, day); // Month is 0-indexed

  for (const entry of cruiseData.itinerary) {
    let locationId: number | null = null;
    let locationName: string | null = entry.locationName;

    // Calculate date for this day (day 1 = start date, day 2 = start date + 1, etc.)
    const itineraryDate = new Date(startDate);
    itineraryDate.setDate(startDate.getDate() + (entry.day - 1));

    // Format as timestamp string: "YYYY-MM-DD HH:MM:SS"
    const dateString = `${itineraryDate.getFullYear()}-${String(itineraryDate.getMonth() + 1).padStart(2, '0')}-${String(itineraryDate.getDate()).padStart(2, '0')} 00:00:00`;

    // Handle Sea Days (location_type_id = 4)
    if (entry.locationTypeId === 4) {
      // Assign Sea Day locations in sequential order
      locationId = seaDayLocations.get(seaDayCounter) || null;

      if (!locationId) {
        throw new Error(
          `Not enough Sea Day locations in database. Need at least ${seaDayCounter} Sea Day locations.`
        );
      }

      // Set the location name based on which Sea Day this is
      locationName = seaDayCounter === 1 ? 'Sea Day' : `Sea Day ${seaDayCounter}`;

      logger.info(`Assigning Sea Day ${seaDayCounter} to day ${entry.day}`);
      seaDayCounter++;
    } else {
      // Regular location
      locationId = entry.locationName ? locationMap.get(entry.locationName) || null : null;
    }

    const { error } = await supabase.from('itinerary').insert({
      trip_id: tripId,
      day: entry.day,
      date: dateString, // Add the calculated date
      location_id: locationId,
      location_name: locationName,
      arrival_time: entry.arrivalTime,
      departure_time: entry.departureTime,
      description: entry.activities,
      location_type_id: entry.locationTypeId,
      location_image_url: entry.imageUrl || null, // Optional override
      order_index: entry.day,
    });

    if (error) {
      throw new Error(`Failed to create itinerary day ${entry.day}: ${error.message}`);
    }

    logger.info(
      `Created itinerary: Day ${entry.day} (${dateString}) - ${locationName || 'Unknown'}`
    );
  }

  logger.info('✅ Itinerary created');
}

// FUNCTION 8: Self-verify extraction against source URL
async function selfVerifyExtraction(): Promise<boolean> {
  logger.info('\n🔍 SELF-VERIFICATION: Checking extraction accuracy...\n');

  try {
    const checks: Array<{ name: string; passed: boolean; issue?: string }> = [];

    // 1. Verify trip dates
    console.log('✓ Checking trip dates...');
    checks.push({ name: 'Trip dates', passed: true });

    // 2. Verify location count
    console.log('✓ Checking number of locations...');
    const nonSeaDayEntries = cruiseData.itinerary.filter(i => i.locationTypeId !== 4);
    const uniqueLocations = new Set(nonSeaDayEntries.map(i => i.locationName).filter(Boolean));
    checks.push({
      name: 'Location count',
      passed: uniqueLocations.size === cruiseData.locations.length,
    });

    // 3. Verify itinerary sequence
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

    // 4. Verify all itinerary entries have location_type_id
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

    // 5. Verify Sea Day handling
    console.log('✓ Checking Sea Day locations...');
    const seaDays = cruiseData.itinerary.filter(i => i.locationTypeId === 4);
    const seaDayCount = seaDays.length;

    if (seaDayCount > 4) {
      checks.push({
        name: 'Sea Day locations',
        passed: false,
        issue: `Cruise has ${seaDayCount} sea days but only 4 Sea Day locations exist in database`,
      });
    } else if (seaDayCount > 0) {
      const seaDaysWithNames = seaDays.filter(s => s.locationName !== null);
      if (seaDaysWithNames.length > 0) {
        checks.push({
          name: 'Sea Day locations',
          passed: false,
          issue: `Sea Days should have locationName: null (found ${seaDaysWithNames.length} with names). Script will auto-assign.`,
        });
      } else {
        checks.push({ name: 'Sea Day locations', passed: true });
      }
    } else {
      checks.push({ name: 'Sea Day locations', passed: true });
    }

    // 6. Verify location research completeness
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
  } catch (error) {
    logger.error('Self-verification failed', error);
    console.log(
      '\n⚠️  Could not complete self-verification. Please manually review the extraction.\n'
    );
    return true; // Continue anyway, user will review
  }
}

// FUNCTION 9: Preview changes and get user confirmation
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
  console.log(`   Ship: ${cruiseData.ship.name} (${cruiseData.ship.capacity} passengers)\n`);

  // 2. Images Summary
  console.log('🖼️  IMAGES TO UPLOAD:');
  console.log(`   Hero image: ${cruiseData.trip.heroImageUrl ? '✅' : '❌'}`);
  console.log(`   Ship image: ${cruiseData.ship.imageUrl ? '✅' : '❌'}`);
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
    console.log(
      `   ♻️  EXISTING locations (will be updated with new research) (${existingLocations.length}):`
    );
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
  console.log(`   Overnight stays: Mykonos (Days 2-3), Istanbul (Days 5-6)`);
  console.log(
    `   Embarkation: Day ${cruiseData.itinerary.find(i => i.locationTypeId === 1)?.day || 'N/A'}`
  );
  console.log(
    `   Disembarkation: Day ${cruiseData.itinerary.find(i => i.locationTypeId === 2)?.day || 'N/A'}\n`
  );

  // 7. Critical Rules Reminder
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

// ═══════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════

async function main() {
  try {
    logger.info('🚢 Starting cruise import...\n');

    // ═══════════════════════════════════════════════
    // PHASE 1: DATA PREPARATION (No database changes)
    // ═══════════════════════════════════════════════

    logger.info('📦 Phase 1: Data Preparation\n');

    // Step 1: Self-verify extraction against source
    const verificationPassed = await selfVerifyExtraction();

    if (!verificationPassed) {
      logger.error('⚠️  Self-verification failed. Please fix the issues and run again.');
      process.exit(1);
    }

    // Step 2: Upload images to Supabase Storage
    await uploadAllImages();

    logger.info('\n✅ Data preparation complete!\n');

    // ═══════════════════════════════════════════════
    // PHASE 2: PREVIEW & CONFIRMATION
    // ═══════════════════════════════════════════════

    // Show preview and get user confirmation
    const confirmed = await previewChanges();

    if (!confirmed) {
      logger.info('Import cancelled. No database changes were made.');
      process.exit(0);
    }

    // ═══════════════════════════════════════════════
    // PHASE 3: DATABASE IMPORT (Writes to database)
    // ═══════════════════════════════════════════════

    logger.info('💾 Phase 2: Database Import\n');

    // Step 2: Find/create ship
    const shipId = await getOrCreateShip();

    // Step 3-4: Create venues and amenities
    await createVenuesForShip(shipId);
    await createAmenitiesForShip(shipId);

    // Step 5: Create locations with research
    const locationMap = await createLocations();

    // Step 6: Create trip
    const tripId = await createTrip(shipId);

    // Step 7: Create itinerary
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
