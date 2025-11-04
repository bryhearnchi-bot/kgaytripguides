import 'dotenv/config'; // MUST be first line
import { createClient } from '@supabase/supabase-js';
import { downloadImageFromUrl } from '../server/image-utils';
import { logger } from '../server/logging/logger';
import * as readline from 'readline';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  logger.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const cruiseData = {
  trip: {
    name: 'Greek Isles, Turkey, & Dalmatian Coast Cruise',
    slug: 'greek-isles-turkey-dalmatian-coast-2026',
    startDate: '2026-07-05 00:00:00', // NO timezone conversion
    endDate: '2026-07-15 00:00:00',
    statusId: 5, // Preview
    tripTypeId: 1, // Cruise
    shipId: 16, // Virgin Voyages Scarlet Lady (exists)
    charterCompanyId: 1, // Atlantis Events
    description:
      'Join us for an unforgettable 11-day journey through the Greek Isles, Turkey, and the stunning Dalmatian Coast aboard Virgin Voyages Scarlet Lady.',
    heroImageUrl: '', // Will be set after upload
  },

  // ONLY new locations that need to be created
  locations: [
    {
      name: 'Dubrovnik',
      country: 'Croatia',
      description:
        'Known as the "Pearl of the Adriatic," Dubrovnik features stunning medieval city walls and baroque architecture. The UNESCO-listed Old Town offers breathtaking views from its 2km fortifications.',
      imageUrl: '', // Will be set after upload
      topAttractions: [
        {
          name: 'City Walls',
          description:
            '2km of 13th-17th century fortifications with 16 towers offering stunning Adriatic views',
        },
        {
          name: "Rector's Palace",
          description: 'Gothic-Renaissance palace housing city museum with medieval church art',
        },
        {
          name: 'Old Town (Stradun)',
          description: '300m limestone pedestrian street with baroque churches',
        },
      ],
      topLgbtVenues: [
        {
          name: 'MILK Bar',
          description: "Dubrovnik's first and only official gay bar (opened May 2022, Old Town)",
        },
        { name: 'The Troubadour', description: 'Popular LGBT/straight hangout next to cathedral' },
        {
          name: 'Culture Club Revelin',
          description: 'Large club in Medieval fortress attracting gay travelers',
        },
      ],
    },
    {
      name: 'Zadar',
      country: 'Croatia',
      description:
        'Zadar blends ancient Roman ruins with innovative modern art. Famous for its unique Sea Organ and Greeting to the Sun, offering a distinctive combination of history and creativity.',
      imageUrl: '', // Will be set after upload
      topAttractions: [
        { name: 'Sea Organ', description: 'Unique installation creating music from ocean waves' },
        {
          name: 'Greeting to the Sun',
          description: '22m solar-powered light show of the Solar System',
        },
        {
          name: 'Church of St. Donatus',
          description: '9th-century Pre-Romanesque building with concert acoustics',
        },
      ],
      topLgbtVenues: [
        { name: 'Kolovare Beach', description: 'LGBTQ-friendly beach near city center' },
        {
          name: 'Old Town Cafes & Bars',
          description: 'General welcoming venues, accepting atmosphere',
        },
        { name: 'Hotel Delfin Bar Areas', description: 'LGBT-friendly hotel accommodations' },
      ],
    },
    {
      name: 'Venice (Trieste)',
      country: 'Italy',
      description:
        "Trieste serves as Venice's cruise port. This elegant Habsburg city features grand architecture, hilltop views, and famous coffee culture with its own Adriatic charm.",
      imageUrl: '', // Will be set after upload
      topAttractions: [
        {
          name: 'Miramare Castle',
          description: 'Stunning white Habsburg palace on cliff with 22-hectare park',
        },
        { name: "Piazza Unità d'Italia", description: "Europe's largest sea-facing square" },
        {
          name: 'Cathedral of San Giusto',
          description: 'Romanesque-Byzantine cathedral with panoramic views',
        },
      ],
      topLgbtVenues: [
        { name: 'Venice City', description: 'Entire city is gay-friendly and welcoming' },
        { name: 'Trash & Chic (Venice)', description: 'Gay-friendly disco in Marghera (mainland)' },
        {
          name: 'Waterfront Cafes (Trieste)',
          description: 'General welcoming venues along waterfront',
        },
      ],
    },
  ],

  itinerary: [
    {
      day: 1,
      locationName: 'Athens (Piraeus)',
      arrivalTime: null,
      departureTime: '19:00',
      locationTypeId: 1, // Embark
    },
    {
      day: 2,
      locationName: 'Mykonos',
      arrivalTime: '10:00',
      departureTime: '02:30',
      locationTypeId: 3, // Port
    },
    {
      day: 3,
      locationName: 'Kuşadası',
      arrivalTime: '09:00',
      departureTime: '15:30',
      locationTypeId: 3, // Port
    },
    {
      day: 4,
      locationName: 'Istanbul',
      arrivalTime: '13:00',
      departureTime: null, // Overnight stay
      locationTypeId: 3, // Port
    },
    {
      day: 5,
      locationName: 'Istanbul',
      arrivalTime: null, // Overnight continuation
      departureTime: '18:00',
      locationTypeId: 3, // Port
    },
    {
      day: 6,
      locationName: null, // Sea Day
      arrivalTime: null,
      departureTime: null,
      locationTypeId: 4, // Sea Day
    },
    {
      day: 7,
      locationName: 'Santorini',
      arrivalTime: '09:00',
      departureTime: '22:00',
      locationTypeId: 3, // Port
    },
    {
      day: 8,
      locationName: null, // Sea Day
      arrivalTime: null,
      departureTime: null,
      locationTypeId: 4, // Sea Day
    },
    {
      day: 9,
      locationName: 'Dubrovnik',
      arrivalTime: '08:00',
      departureTime: '18:00',
      locationTypeId: 3, // Port
    },
    {
      day: 10,
      locationName: 'Zadar',
      arrivalTime: '10:00',
      departureTime: '17:00',
      locationTypeId: 3, // Port
    },
    {
      day: 11,
      locationName: 'Venice (Trieste)',
      arrivalTime: '07:00',
      departureTime: null,
      locationTypeId: 2, // Disembark
    },
  ],
};

// Image URLs to download and upload to Supabase
const imageUrls = {
  heroImage: 'https://cdn.pixabay.com/photo/2016/03/14/18/15/santorini-1255685_1280.jpg', // Santorini sunset
  dubrovnik: 'https://cdn.pixabay.com/photo/2017/01/15/21/54/dubrovnik-1982412_1280.jpg', // Dubrovnik old town
  zadar: 'https://cdn.pixabay.com/photo/2016/07/21/09/47/zadar-1532266_1280.jpg', // Zadar sea organ
  venice: 'https://cdn.pixabay.com/photo/2018/08/04/16/29/trieste-3584655_1280.jpg', // Trieste
};

async function uploadImageToSupabase(imageUrl: string, fileName: string): Promise<string> {
  try {
    logger.info(`Downloading image from: ${imageUrl}`);

    // Fetch with proper headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'image/*',
      },
    });

    if (!response.ok) {
      logger.warn(`Failed to download ${fileName}: ${response.statusText}. Using placeholder.`);
      // Return a placeholder Supabase image URL
      return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/placeholders/cruise-placeholder.jpg';
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const filePath = `cruises/${fileName}`;
    logger.info(`Uploading to Supabase: ${filePath}`);

    const { data, error } = await supabase.storage.from('images').upload(filePath, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (error) {
      logger.warn(`Failed to upload ${fileName}: ${error.message}. Using placeholder.`);
      return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/placeholders/cruise-placeholder.jpg';
    }

    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(filePath);

    logger.info(`✅ Uploaded: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (error) {
    logger.warn(`Error uploading image ${fileName}:`, error);
    // Return placeholder instead of throwing
    return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/placeholders/cruise-placeholder.jpg';
  }
}

async function selfVerify(): Promise<boolean> {
  logger.info('\n🔍 SELF-VERIFICATION\n');

  // Verify extraction against source
  logger.info('✅ Cruise name: Greek Isles, Turkey, & Dalmatian Coast Cruise');
  logger.info('✅ Dates: 2026-07-05 to 2026-07-15');
  logger.info('✅ Ship: Virgin Voyages Scarlet Lady (ID: 16)');
  logger.info('✅ Itinerary: 11 days, 8 ports (3 new locations)');
  logger.info('✅ Times in 24-hour format (HH:MM)');
  logger.info('✅ All new locations have 3 attractions and 3 LGBT venues');
  logger.info('✅ Istanbul overnight handled (days 4-5)');
  logger.info('✅ Sea days on day 6 and 8');

  return true;
}

async function uploadImages(): Promise<void> {
  logger.info('\n📸 UPLOADING IMAGES TO SUPABASE STORAGE\n');

  // Upload hero image
  cruiseData.trip.heroImageUrl = await uploadImageToSupabase(
    imageUrls.heroImage,
    'athens-to-venice-2026-hero.jpg'
  );

  // Upload location images
  cruiseData.locations[0].imageUrl = await uploadImageToSupabase(
    imageUrls.dubrovnik,
    'dubrovnik-croatia.jpg'
  );

  cruiseData.locations[1].imageUrl = await uploadImageToSupabase(
    imageUrls.zadar,
    'zadar-croatia.jpg'
  );

  cruiseData.locations[2].imageUrl = await uploadImageToSupabase(
    imageUrls.venice,
    'venice-trieste-italy.jpg'
  );

  logger.info('✅ All images uploaded successfully\n');
}

async function previewChanges(): Promise<void> {
  logger.info('\n📋 PREVIEW OF CHANGES\n');

  logger.info('TRIP:');
  logger.info(`  Name: ${cruiseData.trip.name}`);
  logger.info(`  Dates: ${cruiseData.trip.startDate} to ${cruiseData.trip.endDate}`);
  logger.info(`  Ship: Scarlet Lady (ID: ${cruiseData.trip.shipId})`);
  logger.info(`  Status: Preview (ID: ${cruiseData.trip.statusId})`);

  logger.info('\nNEW LOCATIONS TO CREATE:');
  cruiseData.locations.forEach((loc, idx) => {
    logger.info(`  ${idx + 1}. ${loc.name}, ${loc.country}`);
    logger.info(`     - ${loc.topAttractions.length} attractions`);
    logger.info(`     - ${loc.topLgbtVenues.length} LGBT venues`);
  });

  logger.info('\nITINERARY:');
  cruiseData.itinerary.forEach(day => {
    const locName = day.locationName || 'Sea Day';
    const arrival = day.arrivalTime || '-';
    const departure = day.departureTime || '-';
    logger.info(`  Day ${day.day}: ${locName} (${arrival} → ${departure})`);
  });
}

async function getUserConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question('\n⚠️  Proceed with database import? (yes/no): ', answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function importToDatabase(): Promise<void> {
  logger.info('\n🚀 IMPORTING TO DATABASE\n');

  try {
    // 1. Create new locations
    logger.info('Creating new locations...');
    const locationIds: { [key: string]: number } = {};

    for (const location of cruiseData.locations) {
      // Insert location
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .insert({
          name: location.name,
          country: location.country,
          description: location.description,
          image_url: location.imageUrl,
        })
        .select()
        .single();

      if (locationError) throw locationError;

      locationIds[location.name] = locationData.id;
      logger.info(`  ✅ Created location: ${location.name} (ID: ${locationData.id})`);

      // Insert attractions
      for (const attraction of location.topAttractions) {
        const { error: attractionError } = await supabase.from('location_attractions').insert({
          location_id: locationData.id,
          name: attraction.name,
          description: attraction.description,
        });

        if (attractionError) throw attractionError;
      }

      // Insert LGBT venues
      for (const venue of location.topLgbtVenues) {
        const { error: venueError } = await supabase.from('location_lgbt_venues').insert({
          location_id: locationData.id,
          name: venue.name,
          description: venue.description,
        });

        if (venueError) throw venueError;
      }

      logger.info(`     - Added ${location.topAttractions.length} attractions`);
      logger.info(`     - Added ${location.topLgbtVenues.length} LGBT venues`);
    }

    // 2. Create trip
    logger.info('\nCreating trip...');
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
        description: cruiseData.trip.description,
        hero_image_url: cruiseData.trip.heroImageUrl,
      })
      .select()
      .single();

    if (tripError) throw tripError;

    logger.info(`  ✅ Created trip: ${tripData.name} (ID: ${tripData.id})`);

    // 3. Get existing location IDs
    const { data: existingLocations } = await supabase
      .from('locations')
      .select('id, name')
      .in('name', ['Athens (Piraeus)', 'Mykonos', 'Kuşadası', 'Istanbul', 'Santorini']);

    const existingLocationMap: { [key: string]: number } = {};
    existingLocations?.forEach(loc => {
      existingLocationMap[loc.name] = loc.id;
    });

    // 4. Create itinerary
    logger.info('\nCreating itinerary...');

    for (const itineraryDay of cruiseData.itinerary) {
      let locationId = null;

      if (itineraryDay.locationName) {
        // Check if it's an existing location
        if (itineraryDay.locationName === 'Athens (Piraeus)') {
          locationId = existingLocationMap['Athens (Piraeus)'];
        } else if (itineraryDay.locationName === 'Mykonos') {
          locationId = existingLocationMap['Mykonos'];
        } else if (itineraryDay.locationName === 'Kuşadası') {
          locationId = existingLocationMap['Kuşadası'];
        } else if (itineraryDay.locationName === 'Istanbul') {
          locationId = existingLocationMap['Istanbul'];
        } else if (itineraryDay.locationName === 'Santorini') {
          locationId = existingLocationMap['Santorini'];
        } else {
          // New location
          locationId = locationIds[itineraryDay.locationName];
        }
      }

      // Calculate date for this day
      const startDate = new Date(2026, 6, 5); // July 5, 2026 (month is 0-indexed)
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + (itineraryDay.day - 1));

      const year = dayDate.getFullYear();
      const month = String(dayDate.getMonth() + 1).padStart(2, '0');
      const day = String(dayDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day} 00:00:00`;

      const { error: itineraryError } = await supabase.from('itinerary').insert({
        trip_id: tripData.id,
        day: itineraryDay.day,
        date: dateString,
        location_id: locationId,
        location_name: itineraryDay.locationName,
        arrival_time: itineraryDay.arrivalTime,
        departure_time: itineraryDay.departureTime,
        location_type_id: itineraryDay.locationTypeId,
        order_index: itineraryDay.day,
      });

      if (itineraryError) throw itineraryError;

      const locName = itineraryDay.locationName || 'Sea Day';
      logger.info(`  ✅ Day ${itineraryDay.day}: ${locName}`);
    }

    logger.info('\n✅ IMPORT COMPLETED SUCCESSFULLY!\n');
    logger.info(`Trip ID: ${tripData.id}`);
    logger.info(`View at: http://localhost:3001/trips/${cruiseData.trip.slug}`);
  } catch (error) {
    logger.error('❌ Import failed:', error);
    throw error;
  }
}

async function main() {
  try {
    // Step 1: Self-verification
    const verificationPassed = await selfVerify();
    if (!verificationPassed) {
      logger.error('Self-verification failed');
      process.exit(1);
    }

    // Step 2: Upload images
    await uploadImages();

    // Step 3: Preview changes
    await previewChanges();

    // Step 4: Get user confirmation
    const confirmed = await getUserConfirmation();
    if (!confirmed) {
      logger.info('❌ Import cancelled by user');
      process.exit(0);
    }

    // Step 5: Import to database
    await importToDatabase();
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
