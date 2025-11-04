import 'dotenv/config'; // MUST be first line
import { downloadImageFromUrl } from '../server/image-utils';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../server/logging/logger';
import * as readline from 'readline';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const cruiseData = {
  trip: {
    name: 'Venice to Barcelona Cruise 26',
    slug: 'venice-to-barcelona-cruise-26',
    startDate: '2026-07-15 00:00:00', // NO timezone conversion
    endDate: '2026-07-24 00:00:00',
    statusId: 5, // Preview
    tripTypeId: 1, // Cruise
    shipId: 16, // Scarlet Lady (Virgin Voyages)
    charterCompanyId: 1, // Atlantis
    heroImageUrl:
      'https://cdn.brandfolder.io/74B7KV5M/at/99nqqjvrp5vqtm847kgq7jmk/vb26_header-barcelona.jpg',
    description:
      "Experience the ultimate Mediterranean adventure aboard Virgin Voyages Scarlet Lady. This 9-night journey takes you from Venice through Croatia, Malta, Sicily, and the stunning Italian coast, culminating in Barcelona. Explore ancient ruins, baroque architecture, and vibrant LGBTQ+ scenes across Europe's most spectacular destinations.",
  },
  locations: [
    {
      name: 'Split',
      country: 'Croatia',
      description:
        "Historic Dalmatian coast city featuring ancient Roman ruins, with the 1700-year-old Diocletian's Palace at its heart. Marble-lined streets and waterfront cafes create a vibrant Mediterranean atmosphere.",
      topAttractions: [
        "Diocletian's Palace - 1700-year-old Roman palace, one of the most important architectural heritage sites of the Roman Empire",
        'Cathedral of St. Domnius - One of the best-preserved ancient Roman buildings with a bell tower offering sweeping vistas',
        "Marjan Hill Forest Park - Green oasis with hiking, biking, and 360° views of Split's cityscape and Adriatic Sea",
      ],
      lgbtVenues: [
        'X Club Split - First official gay bar in Split (opened June 2023), safe and inclusive space with live DJs',
        'Academia Club Ghetto (Ghetto Bar) - Most popular bar for the gay community, known for bohemian vibe',
        'Kocka (Dice) - LGBTQ-friendly underground club hosting drag shows, concerts, and artistic programs',
      ],
    },
    {
      name: 'Valletta',
      country: 'Malta',
      description:
        'Mediterranean fortress city featuring baroque architecture and rich Knights of St. John heritage. This pocket-sized capital offers stunning harbor views and centuries of history within fortress walls.',
      topAttractions: [
        "St. John's Co-Cathedral - Built 1573-1577, features two Caravaggio masterpieces and stunning baroque interior",
        'Upper Barrakka Gardens - Beautiful gardens with amazing Grand Harbour views and daily cannon firing at noon and 4pm',
        "Grand Master's Palace - Richly decorated state rooms with 18th-century frescos and historic Palace Armoury",
      ],
      lgbtVenues: [
        "Michelangelo Club - Only gay nightclub on Malta island, located in St. Julian's with 2 dance floors",
        "The Thirsty Barber - Gay-friendly bar in Valletta's heart with superb cocktails and drag shows",
        "LOLLIPOP - Malta's biggest queer event playing pop, disco, and house music (pop-up events)",
      ],
    },
    {
      name: 'Palermo',
      country: 'Italy',
      description:
        'Sicilian capital showcasing Byzantine mosaics, royal palaces, and authentic markets. This vibrant city blends Arab-Norman architecture with Mediterranean charm and rich cultural heritage.',
      topAttractions: [
        "Cappella Palatina (Palatine Chapel) - Palermo's top attraction designed by Roger II in 1130, famous for gold Byzantine mosaics",
        'Cattedrale di Palermo - Most beautiful and important church in the city, showcasing Arab-Norman-Gothic architectural blend',
        'Teatro Massimo - Largest opera house in Italy and second-largest in Europe, hosting recitals, ballet, and concerts',
      ],
      lgbtVenues: [
        'EXIT10&LOVE (Exit Drinks) - Historic venue (25+ years) with DJ sets and drag shows at Piazza S. Francesco di Paola',
        'Fabric Club House - Saturday night institution managed by Exit Drinks, offering weekly parties with animation and music',
        'Cha Bar - Gay-friendly bar and tea room perfect for socializing in a comfortable environment',
      ],
    },
    {
      name: 'Sorrento',
      country: 'Italy',
      description:
        'Charming Amalfi Coast town providing access to Pompeii, Capri, and coastal villages. Perched on dramatic cliffs with lemon groves and stunning Bay of Naples views.',
      topAttractions: [
        'Piazza Tasso - Historic town square and beating heart of Sorrento with quaint cafes and shops',
        'Marina Grande - Waterfront fishing village with seafood restaurants and beach atmosphere',
        'Villa Comunale Gardens & Church of San Francesco - 14th-century church and clifftop gardens with romantic Bay of Naples views',
      ],
      lgbtVenues: [
        'No dedicated LGBT venues - Sorrento has no organized gay scene, but all venues are gay-friendly',
        'Nearby Naples (20 min) - Depot Napoli fetish cruising bar for organized nightlife',
        'Anatema Party - LGBTQ+ event at Club Shine in Naples every Saturday',
      ],
    },
    {
      name: 'Civitavecchia',
      country: 'Italy',
      description:
        "Historic port city serving as gateway to Rome's ancient landmarks. Home to iconic attractions including the Colosseum, Vatican, Trevi Fountain, and 2,000+ years of history.",
      topAttractions: [
        'Fort Michelangelo - Imposing Renaissance fortress completed by Michelangelo in 1557, guarding against pirate invasions',
        'Taurine Baths (Terme di Traiano) - Preserved ancient Roman bathing complex with mosaics and marble decorations',
        "Piazza Leandra - Civitavecchia's oldest square in the medieval district with centuries-old landmarks",
      ],
      lgbtVenues: [
        'Coming Out Bar (Rome) - LGBTQ+ hub since 2001 next to the Colosseum, open all day with themed nights and drag shows',
        'Muccassassina (Rome) - Most popular and iconic LGBTQ+ event in Italy with outdoor setting during warm season',
        'Company Roma - Lively bear bar with welcoming atmosphere, creative cocktails, and karaoke nights',
      ],
    },
    {
      name: 'Villefranche',
      country: 'France',
      description:
        'Colorful French Riviera town offering proximity to Monaco and Nice. Charming waterfront village with historic passageways and Mediterranean beauty.',
      topAttractions: [
        'Rue Obscure (Dark Street) - 130m underground passageway dating back to 1260, originally a military thoroughfare',
        "Saint Michel's Church - 18th-century Baroque church with iconic yellow bell tower visible throughout town",
        'Chapelle Saint-Pierre (Cocteau Chapel) - Small chapel with walls and ceilings covered in Jean Cocteau frescos',
      ],
      lgbtVenues: [
        'The BLITZ Bar (Nice) - Opened 2023, already a reference for atmosphere, open Wed-Sun 6pm-2am',
        'Le Glam (Nice) - Most popular gay club in Nice, hopping on weekends, open Fri-Sun 11:30pm-4:30am',
        'Le Six (Nice) - Oldest gay bar (since 2006), famous for shower shows and international DJs, open Tue-Sat 10pm-5am',
      ],
    },
    {
      name: 'Marseille',
      country: 'France',
      description:
        'Vibrant waterfront city serving as gateway to Provence. Features historic Vieux Port where ships have docked for millennia, plus stunning modern architecture.',
      topAttractions: [
        "Notre-Dame de la Garde - Opulent 19th-century basilica on city's highest point with 360° panorama views",
        "Vieux Port (Old Port) - Marseille's birthplace where the city began as Greek port around 600 BCE, focal point with seafood restaurants",
        'MuCEM - Stunning museum exploring Mediterranean history and culture with fascinating modern architecture',
      ],
      lgbtVenues: [
        "The New Cancan - Marseille's longest-running gay dance club, well-known beyond city borders",
        "L'Annexe Bar - Marseille's new gay and gay-friendly bar",
        'Le Cargo - Most famous gay sauna and club venue in Marseille',
      ],
    },
    {
      name: 'Barcelona',
      country: 'Spain',
      description:
        'Spain\'s gay capital concluding the voyage. Features Gaudí\'s architectural masterpieces, Mediterranean beaches, and thriving LGBTQ+ scene in the famous "Gaixample" district.',
      topAttractions: [
        "Sagrada Família - Gaudí's architectural masterpiece and Barcelona's most famous building, world's tallest church upon completion (2026)",
        'Park Güell - UNESCO World Heritage Site and Gaudí fantasy masterpiece with famous mosaic steps and city views',
        "Casa Batlló - One of Europe's strangest residential buildings, Gaudí at his fantastical best with marine-world themes",
      ],
      lgbtVenues: [
        "El Cangrejo - Cornerstone of Barcelona's LGBTQ+ nightlife for decades, famous for electric atmosphere and drag shows",
        'Arena Madre - Popular hotspot with younger crowd enjoying techno beats and striptease shows',
        'Priscilla Cafe/BELIEVE Club - Most famous drag queen club in Gaixample with live music, karaoke, and drag shows',
      ],
    },
  ],
  // Update existing Venice (Trieste) location (ID: 98)
  veniceTriesteUpdate: {
    locationId: 98,
    topAttractions: [
      "St. Mark's Basilica - Byzantine-style basilica, one of Venice's most famous monuments",
      "Doge's Palace (Palazzo Ducale) - Where Venice's rulers once lived, mixing Byzantine, Gothic and Renaissance styles",
      "Piazza dell'Unità d'Italia (Trieste) - Largest sea-facing square in Europe, overlooking the harbor",
    ],
    lgbtVenues: [
      'Trash and Chic - Leading gay club night in Italy with world-class DJs and drag shows, held monthly at venues like Molo 5 in Mestre',
      "L'Altro Verdi - LGBTQ-friendly bar ideal for aperitifs on Via Piave in Mestre",
      'Metrò Venezia Club - Well-known venue close to Mestre station',
    ],
  },
  itinerary: [
    {
      day: 1,
      date: '2026-07-15 00:00:00',
      locationName: 'Venice (Trieste)',
      arrivalTime: '06:30',
      departureTime: '18:00',
      allAboardTime: '17:30',
      locationTypeId: 1, // Embarkation
      activities: 'Gateway to Venice; dock in nearby Trieste',
    },
    {
      day: 2,
      date: '2026-07-16 00:00:00',
      locationName: 'Split',
      arrivalTime: '09:00',
      departureTime: '18:00',
      allAboardTime: '17:30',
      locationTypeId: 3, // Port of Call
      activities: "Explore ancient Diocletian's Palace and the Dalmatian coast",
    },
    {
      day: 3,
      date: '2026-07-17 00:00:00',
      locationName: null, // CRITICAL: Must be null for sea days
      arrivalTime: null,
      departureTime: null,
      allAboardTime: null,
      locationTypeId: 4, // Day at Sea
      activities: 'Relax and enjoy ship amenities',
    },
    {
      day: 4,
      date: '2026-07-18 00:00:00',
      locationName: 'Valletta',
      arrivalTime: '08:00',
      departureTime: '18:00',
      allAboardTime: '17:30',
      locationTypeId: 3, // Port of Call
      activities: 'Discover baroque architecture and Knights of St. John heritage',
    },
    {
      day: 5,
      date: '2026-07-19 00:00:00',
      locationName: 'Palermo',
      arrivalTime: '11:00',
      departureTime: '19:00',
      allAboardTime: '18:30',
      locationTypeId: 3, // Port of Call
      activities: 'Experience Sicilian culture and Arab-Norman architecture',
    },
    {
      day: 6,
      date: '2026-07-20 00:00:00',
      locationName: 'Sorrento',
      arrivalTime: '07:00',
      departureTime: '20:00',
      allAboardTime: '19:30',
      locationTypeId: 3, // Port of Call
      activities: 'Visit Pompeii, Capri, or explore the Amalfi Coast',
    },
    {
      day: 7,
      date: '2026-07-21 00:00:00',
      locationName: 'Civitavecchia',
      arrivalTime: '08:00',
      departureTime: '20:00',
      allAboardTime: '19:30',
      locationTypeId: 3, // Port of Call
      activities: 'Day trip to Rome - Colosseum, Vatican, Trevi Fountain',
    },
    {
      day: 8,
      date: '2026-07-22 00:00:00',
      locationName: 'Villefranche',
      arrivalTime: '08:00', // Default time (source showed "—")
      departureTime: '18:00', // Default time (source showed "—")
      allAboardTime: '17:30',
      locationTypeId: 3, // Port of Call
      activities: 'Explore the French Riviera, Monaco, and Nice',
    },
    {
      day: 9,
      date: '2026-07-23 00:00:00',
      locationName: 'Marseille',
      arrivalTime: '09:00',
      departureTime: '23:00',
      allAboardTime: '22:30',
      locationTypeId: 3, // Port of Call
      activities: 'Gateway to Provence - explore historic Vieux Port and MuCEM',
    },
    {
      day: 10,
      date: '2026-07-24 00:00:00',
      locationName: 'Barcelona',
      arrivalTime: '08:00',
      departureTime: null,
      allAboardTime: null,
      locationTypeId: 2, // Disembarkation
      activities: "Disembark in Spain's gay capital",
    },
  ],
};

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function selfVerify(): Promise<boolean> {
  logger.info('🔍 Self-verifying extraction against source...');

  const checks = [
    { name: 'Cruise name', value: cruiseData.trip.name, expected: 'Venice to Barcelona Cruise 26' },
    { name: 'Start date', value: cruiseData.trip.startDate, expected: '2026-07-15 00:00:00' },
    { name: 'End date', value: cruiseData.trip.endDate, expected: '2026-07-24 00:00:00' },
    { name: 'Ship ID', value: cruiseData.trip.shipId, expected: 16 },
    { name: 'Charter company ID', value: cruiseData.trip.charterCompanyId, expected: 1 },
    { name: 'Itinerary days', value: cruiseData.itinerary.length, expected: 10 },
    { name: 'New locations', value: cruiseData.locations.length, expected: 8 },
    {
      name: 'Sea days',
      value: cruiseData.itinerary.filter(i => i.locationTypeId === 4).length,
      expected: 1,
    },
  ];

  let allPassed = true;
  for (const check of checks) {
    const passed = check.value === check.expected;
    if (!passed) {
      logger.error(`❌ ${check.name}: expected ${check.expected}, got ${check.value}`);
      allPassed = false;
    } else {
      logger.info(`✅ ${check.name}: ${check.value}`);
    }
  }

  // Verify all-aboard times are 30 minutes before departure
  logger.info('✅ Verifying all-aboard times...');
  for (const item of cruiseData.itinerary) {
    if (item.departureTime && item.allAboardTime) {
      const [depHour, depMin] = item.departureTime.split(':').map(Number);
      const [allHour, allMin] = item.allAboardTime.split(':').map(Number);
      const depMinutes = depHour * 60 + depMin;
      const allMinutes = allHour * 60 + allMin;
      const diff = depMinutes - allMinutes;
      if (diff !== 30) {
        logger.error(
          `❌ Day ${item.day}: All-aboard time should be 30 min before departure (${item.departureTime}), got ${diff} min difference`
        );
        allPassed = false;
      }
    }
  }

  if (!allPassed) {
    logger.error('❌ Self-verification FAILED. Please fix the issues above.');
    return false;
  }

  logger.info('✅ Self-verification PASSED');
  return true;
}

async function uploadImages(): Promise<void> {
  logger.info('📸 Uploading hero image to Supabase Storage...');

  try {
    const heroImagePath = await downloadImageFromUrl(cruiseData.trip.heroImageUrl, 'hero');
    logger.info(`✅ Hero image uploaded: ${heroImagePath}`);
    cruiseData.trip.heroImageUrl = heroImagePath;
  } catch (error) {
    logger.error('❌ Failed to upload hero image:', error);
    throw error;
  }
}

async function previewChanges(): Promise<void> {
  logger.info('\n📋 PREVIEW OF CHANGES\n');

  logger.info('=== TRIP ===');
  logger.info(`Name: ${cruiseData.trip.name}`);
  logger.info(`Slug: ${cruiseData.trip.slug}`);
  logger.info(`Dates: ${cruiseData.trip.startDate} to ${cruiseData.trip.endDate}`);
  logger.info(`Ship: Scarlet Lady (ID: ${cruiseData.trip.shipId})`);
  logger.info(`Charter: Atlantis (ID: ${cruiseData.trip.charterCompanyId})`);
  logger.info(`Status: Preview (ID: ${cruiseData.trip.statusId})`);
  logger.info(`Hero Image: ${cruiseData.trip.heroImageUrl}\n`);

  logger.info('=== VENICE (TRIESTE) UPDATE (Existing Location ID: 98) ===');
  logger.info('Adding attractions:');
  cruiseData.veniceTriesteUpdate.topAttractions.forEach((a, i) => logger.info(`  ${i + 1}. ${a}`));
  logger.info('Adding LGBT venues:');
  cruiseData.veniceTriesteUpdate.lgbtVenues.forEach((v, i) => logger.info(`  ${i + 1}. ${v}`));
  logger.info('');

  logger.info('=== NEW LOCATIONS (8) ===');
  cruiseData.locations.forEach((loc, i) => {
    logger.info(`\n${i + 1}. ${loc.name}, ${loc.country}`);
    logger.info(`   Description: ${loc.description}`);
    logger.info(`   Attractions: ${loc.topAttractions.length}`);
    logger.info(`   LGBT Venues: ${loc.lgbtVenues.length}`);
  });

  logger.info('\n=== ITINERARY (10 DAYS) ===');
  cruiseData.itinerary.forEach(item => {
    const locType = ['', 'Embarkation', 'Disembarkation', 'Port of Call', 'Day at Sea'][
      item.locationTypeId
    ];
    logger.info(
      `Day ${item.day} (${item.date.split(' ')[0]}): ${item.locationName || 'Sea Day'} - ${locType}`
    );
    if (item.arrivalTime) logger.info(`   Arrival: ${item.arrivalTime}`);
    if (item.departureTime) logger.info(`   Departure: ${item.departureTime}`);
    if (item.allAboardTime) logger.info(`   All Aboard: ${item.allAboardTime}`);
    if (item.activities) logger.info(`   Activities: ${item.activities}`);
  });

  logger.info(
    '\n⚠️  Note: Day 8 (Villefranche) uses default times (08:00-18:00) as source showed "—"'
  );
}

async function importToDatabase(): Promise<void> {
  logger.info('\n🚀 Starting database import...');

  try {
    // 1. Update Venice (Trieste) location
    logger.info('\n1. Updating Venice (Trieste) location (ID: 98)...');
    const { error: veniceError } = await supabase
      .from('locations')
      .update({
        top_attractions: cruiseData.veniceTriesteUpdate.topAttractions,
        top_lgbt_venues: cruiseData.veniceTriesteUpdate.lgbtVenues,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cruiseData.veniceTriesteUpdate.locationId);

    if (veniceError) throw veniceError;
    logger.info('✅ Venice (Trieste) updated');

    // 2. Create new locations
    logger.info('\n2. Creating 8 new locations...');
    const locationMap: { [key: string]: number } = {};

    for (const loc of cruiseData.locations) {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: loc.name,
          country: loc.country,
          description: loc.description,
          top_attractions: loc.topAttractions,
          top_lgbt_venues: loc.lgbtVenues,
        })
        .select('id')
        .single();

      if (error) throw error;
      locationMap[loc.name] = data.id;
      logger.info(`✅ Created ${loc.name} (ID: ${data.id})`);
    }

    // Add Venice (Trieste) to map
    locationMap['Venice (Trieste)'] = cruiseData.veniceTriesteUpdate.locationId;

    // 3. Create trip
    logger.info('\n3. Creating trip...');
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert({
        name: cruiseData.trip.name,
        slug: cruiseData.trip.slug,
        start_date: cruiseData.trip.startDate,
        end_date: cruiseData.trip.endDate,
        trip_status_id: cruiseData.trip.statusId,
        trip_type_id: cruiseData.trip.tripTypeId,
        ship_id: cruiseData.trip.shipId,
        charter_company_id: cruiseData.trip.charterCompanyId,
        hero_image_url: cruiseData.trip.heroImageUrl,
        description: cruiseData.trip.description,
      })
      .select('id')
      .single();

    if (tripError) throw tripError;
    const tripId = tripData.id;
    logger.info(`✅ Trip created (ID: ${tripId})`);

    // 4. Create itinerary
    logger.info('\n4. Creating itinerary (10 days)...');
    for (const item of cruiseData.itinerary) {
      const locationId = item.locationName ? locationMap[item.locationName] : null;

      const { error: itinError } = await supabase.from('itinerary').insert({
        trip_id: tripId,
        day: item.day,
        date: item.date,
        location_id: locationId,
        location_name: item.locationName,
        arrival_time: item.arrivalTime,
        departure_time: item.departureTime,
        all_aboard_time: item.allAboardTime,
        location_type_id: item.locationTypeId,
        description: item.activities,
        order_index: item.day,
      });

      if (itinError) throw itinError;
      logger.info(`✅ Day ${item.day}: ${item.locationName || 'Sea Day'}`);
    }

    logger.info('\n✅ Import completed successfully!');
    logger.info(`\n🔗 View trip at: http://localhost:3001/trips/${cruiseData.trip.slug}`);
  } catch (error) {
    logger.error('❌ Import failed:', error);
    throw error;
  }
}

async function main() {
  try {
    // Step 1: Self-verify extraction
    const verifyPassed = await selfVerify();
    if (!verifyPassed) {
      process.exit(1);
    }

    // Step 2: Upload images
    await uploadImages();

    // Step 3: Preview changes
    await previewChanges();

    // Step 4: Get user confirmation
    logger.info('\n⚠️  WARNING: This will modify the database!');
    const answer = await promptUser('\nType "yes" to proceed with import: ');

    if (answer.toLowerCase() !== 'yes') {
      logger.info('❌ Import cancelled by user');
      process.exit(0);
    }

    // Step 5: Import to database
    await importToDatabase();

    logger.info('\n✅ All done! Please verify the trip in your browser.');
  } catch (error) {
    logger.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
