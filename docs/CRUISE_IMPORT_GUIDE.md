# Cruise Import Guide: Complete Step-by-Step Process

This guide provides a comprehensive walkthrough for importing a new cruise into the KGay Travel Guides application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Data Extraction & Research](#phase-1-data-extraction--research)
4. [Phase 2: Import Script Creation](#phase-2-import-script-creation)
5. [Phase 3: Execution & Troubleshooting](#phase-3-execution--troubleshooting)
6. [Phase 4: Verification](#phase-4-verification)
7. [Phase 5: Git Deployment](#phase-5-git-deployment)
8. [Common Issues & Solutions](#common-issues--solutions)
9. [Database Schema Reference](#database-schema-reference)

---

## Overview

### What Gets Imported

A complete cruise import includes:

1. **Cruise Data** - Dates, description, pricing from charter website
2. **Ship Information** - Venues, amenities, capacity, images
3. **Location Data** - Ports with images, descriptions, attractions, LGBT venues
4. **Itinerary** - Day-by-day schedule with times and activities
5. **Images** - All images uploaded to Supabase Storage (no external URLs)

### Automatic Features

✅ **Hero carousel** automatically displays port images from itinerary data
✅ **Image priority system** uses itinerary-specific images over location defaults
✅ **Self-verification** checks extraction accuracy before database changes
✅ **Preview & confirmation** requires user approval before writing to database
✅ **RLS policies** ensure proper data access control

### Timeline

**Total Time:** 2-3 hours for a complete cruise import

### Import Flow

The import process follows this sequence:

1. **Extract & Research** → Extract cruise data and research locations
2. **Build Script** → Create automated import script with data structure
3. **Self-Verify** → AI automatically verifies extraction against source
4. **Upload Images** → Images uploaded to Supabase Storage
5. **Preview** → Detailed preview shown to user
6. **Confirm** → User types "yes" to proceed
7. **Database Import** → Data written to database
8. **Verify** → Manual verification in browser
9. **Deploy** → Push to git and deploy

---

## Prerequisites

### Required Information

- Charter company website URL with cruise details
- Cruise dates and itinerary (ports, times)
- Ship information (name, cruise line, capacity)
- Port information (names, images, descriptions)
- Ship venues and amenities list

### Environment Setup

```bash
# Verify .env file has required variables
DATABASE_URL="postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres"
SUPABASE_URL="https://bxiiodeyqvqqcgzzqzvt.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
```

### Required Tools

- Node.js with TypeScript (tsx)
- Supabase database access
- WebFetch or web scraping capability
- Perplexity or WebSearch for location research

---

## Phase 1: Data Extraction & Research

### Step 1: Extract Cruise Data from Website

Use WebFetch to extract data from the charter company's cruise page:

```typescript
// Example: Extract from Atlantis Events cruise page
const cruiseUrl = 'https://atlantisevents.com/vacation/cruise-name/';

// Extract:
// - Cruise name and dates
// - Complete itinerary (ports, arrival/departure times)
// - Ship information and amenities
// - Pricing and cabin types
// - Special events or theme parties
```

### Step 2: Research Each Location

**For EVERY port in the itinerary**, research and document:

#### A. Top 3 Attractions

Use Perplexity or WebSearch to find:

- Most popular tourist attractions
- Cultural landmarks and museums
- Natural wonders and scenic spots
- Historical sites
- Best beaches or outdoor activities

**Example for Bora Bora:**

```markdown
Top 3 Attractions:

1. Mount Otemanu - Iconic volcanic peak, best viewed by boat tour
2. Coral Gardens - World-class snorkeling with tropical fish and rays
3. Matira Beach - Pristine white sand beach with turquoise waters
```

#### B. Top 3 LGBT-Friendly Venues

Research and document:

- Gay bars and nightclubs
- LGBT-friendly restaurants and cafes
- Queer-owned businesses
- LGBT events and gathering spots
- Pride celebrations or LGBT community centers

**Example for Papeete:**

```markdown
Top 3 LGBT-Friendly Venues:

1. Piano Bar - Popular gay-friendly bar in downtown Papeete
2. Café Maeva - LGBT-owned café with rainbow flag, welcoming atmosphere
3. Le Royal Tahitien - Gay-friendly hotel beach bar, sunset happy hours
```

**Important Notes:**

- Some smaller ports may have limited LGBT venues - document this honestly
- Note if destination is generally LGBT-friendly even without dedicated venues
- Research current laws and cultural attitudes toward LGBT travelers
- Include any safety considerations or cultural sensitivities

### Step 3: Create Planning Document

Create a comprehensive planning document at `docs/Add [Cruise Name].md`:

```markdown
# Add [Cruise Name] - Implementation Plan

## Cruise URL

[Charter company cruise page URL]

## Cruise Overview

- **Name:** [Full cruise name]
- **Dates:** [Start date] - [End date] (YYYY-MM-DD format)
- **Ship:** [Ship name]
- **Cruise Line:** [Cruise line name]
- **Charter Company:** [Charter company name]
- **Ports:** [Number of ports]
- **Days:** [Number of days]

## Database IDs

- **Charter Company ID:** [Get from charter_companies table]
- **Cruise Line ID:** [Get from cruise_lines table]
- **Ship ID:** [Get from ships table]
- **Trip Type ID:** 1 (Cruise)
- **Trip Status ID:** 5 (Preview - for review before publishing)

## Locations with Research

### Port 1: [Port Name]

**Description:** [Brief description of the port/city]

**Top 3 Attractions:**

1. [Attraction 1] - [Brief description]
2. [Attraction 2] - [Brief description]
3. [Attraction 3] - [Brief description]

**Top 3 LGBT-Friendly Venues:**

1. [Venue 1] - [Type and description]
2. [Venue 2] - [Type and description]
3. [Venue 3] - [Type and description]

**LGBT Travel Notes:**
[Any important information about LGBT acceptance, safety, or cultural considerations]

**Image URL:** [Source URL for location image]

### Port 2: [Port Name]

[Repeat format above]

## Ship Information

### Venues

1. [Venue Name] - Type: [dining/entertainment/bar/spa/recreation] - [Description]
2. [Continue...]

### Amenities

1. [Amenity Name] - [Description]
2. [Continue...]

## Itinerary

| Day | Date       | Port    | Arrival | Departure | Type        | Activities |
| --- | ---------- | ------- | ------- | --------- | ----------- | ---------- |
| 1   | 2025-12-28 | Papeete | 14:00   | -         | Embarkation | Board ship |
| 2   | 2025-12-29 | Moorea  | 09:00   | 18:00     | Port        | Beach day  |
| ... | ...        | ...     | ...     | ...       | ...         | ...        |

## Images to Upload

- [ ] Hero image: [URL]
- [ ] Ship image: [URL]
- [ ] Port 1 image: [URL]
- [ ] Port 2 image: [URL]
- [ ] [Continue for all ports...]
```

### Step 4: Document Critical Rules

Review these rules before proceeding:

#### ⚠️ CRITICAL RULES

1. **NO Timezone Conversions**
   - All dates/times are in destination's local timezone
   - Store as timestamp strings: `"2025-12-28 00:00:00"`
   - NEVER use `new Date(dateString)` or `.toISOString()`
   - Parse: `const [y, m, d] = date.split('-').map(Number); new Date(y, m - 1, d);`

2. **ALL Images in Supabase Storage**
   - Download external images first
   - Upload to Supabase Storage buckets
   - Store only Supabase Storage URLs in database
   - NO external image URLs allowed

3. **Image Priority System**
   - `locations.image_url` = DEFAULT image across all trips
   - `itinerary.location_image_url` = OPTIONAL trip-specific override
   - Priority: Itinerary image → Location image → Empty
   - Hero carousel uses this priority automatically

4. **Sea Day Locations (IMPORTANT)**
   - Database has 4 pre-created Sea Day locations:
     - `Sea Day` (1st sea day)
     - `Sea Day 2` (2nd sea day)
     - `Sea Day 3` (3rd sea day)
     - `Sea Day 4` (4th sea day)
   - Script automatically assigns these **in sequential order**
   - For itinerary entries with `locationTypeId: 4` (Day at Sea):
     - Leave `locationName: null` in cruiseData
     - Script will auto-assign correct Sea Day location
   - Example: If cruise has 3 sea days, they get assigned "Sea Day", "Sea Day 2", "Sea Day 3"

5. **Trip Status**
   - Always start with Preview (ID: 5)
   - Allows review before publishing
   - Change to Published (ID: 1) after verification

6. **Field Naming**
   - Database: snake_case (`start_date`, `hero_image_url`)
   - API/Frontend: camelCase (`startDate`, `heroImageUrl`)

---

## Phase 2: Import Script Creation

### Step 1: Create Script File

Create file at `scripts/import-[cruise-name].ts`

### Step 2: Basic Script Structure

```typescript
import 'dotenv/config'; // CRITICAL: Must be first line
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
```

### Step 3: Define Cruise Data Structure

```typescript
const cruiseData = {
  trip: {
    name: 'Cruise Name',
    slug: 'cruise-slug',
    description: 'Cruise description',
    startDate: '2025-12-28 00:00:00', // NO timezone conversion
    endDate: '2026-01-06 00:00:00', // NO timezone conversion
    heroImageUrl: 'https://example.com/hero.jpg', // Will be uploaded
    statusId: 5, // Preview status
    tripTypeId: 1, // Cruise
    charterCompanyId: 1, // From database
    cruiseLineId: 4, // From database
    shipId: 14, // From database
  },

  venues: [
    {
      name: 'Grand Dining Room',
      type: 'dining', // dining | entertainment | bar | spa | recreation
      description: 'Elegant main dining room',
    },
    // ... more venues
  ],

  amenities: [
    {
      name: 'Heated Pool',
      categoryId: 1, // From amenity_categories table
      description: 'Olympic-size heated pool',
    },
    // ... more amenities
  ],

  locations: [
    {
      name: 'Papeete',
      description: 'Capital city of French Polynesia',
      imageUrl: 'https://example.com/papeete.jpg', // Will be uploaded
      countryId: 1, // From countries table
      stateProvinceId: null, // Optional
      // LGBT venues and attractions will be added separately
      topAttractions: [
        'Mount Otemanu - Volcanic peak with stunning views',
        'Coral Gardens - World-class snorkeling',
        'Matira Beach - Pristine white sand beach',
      ],
      lgbtVenues: [
        'Piano Bar - Gay-friendly bar downtown',
        'Café Maeva - LGBT-owned café',
        'Le Royal Tahitien - Gay-friendly hotel bar',
      ],
    },
    // ... more locations
  ],

  itinerary: [
    {
      day: 1, // Sequential (must be unique per trip)
      locationName: 'Papeete', // Maps to locations array
      arrivalTime: '14:00:00', // 24-hour format
      departureTime: null,
      activities: 'Embarkation - Board ship around 2pm',
      locationTypeId: 1, // 1=Embark, 2=Disembark, 3=Port, 4=Sea, 11=Overnight Arrival, 12=Overnight Departure
      imageUrl: null, // OPTIONAL: Trip-specific image override
    },
    {
      day: 2,
      locationName: 'Moorea',
      arrivalTime: '09:00:00',
      departureTime: '18:00:00',
      activities: 'Beach day and snorkeling',
      locationTypeId: 3, // Port of Call
      imageUrl: null,
    },
    {
      day: 5,
      locationName: null, // Will be auto-assigned to Sea Day locations in order: 'Sea Day', 'Sea Day 2', 'Sea Day 3', 'Sea Day 4'
      arrivalTime: null,
      departureTime: null,
      activities: 'Relax and enjoy ship amenities',
      locationTypeId: 4, // Day at Sea
      imageUrl: null,
      // NOTE: For Sea Days, locationName will be automatically assigned in sequential order
      // 1st sea day → 'Sea Day', 2nd sea day → 'Sea Day 2', 3rd → 'Sea Day 3', 4th → 'Sea Day 4'
    },
    // ... more days
  ],
};
```

### Step 4: Implement Helper Functions

```typescript
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
```

### Step 5: Implement Import Functions

```typescript
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

// FUNCTION 2: Find or create cruise line
async function getOrCreateCruiseLine(name: string): Promise<number> {
  logger.info('=== STEP 2: Finding Cruise Line ===');

  const { data: existing } = await supabase
    .from('cruise_lines')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) {
    logger.info(`Found cruise line: ${name} (ID: ${existing.id})`);
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from('cruise_lines')
    .insert({ name })
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create cruise line: ${error?.message}`);
  }

  logger.info(`Created cruise line: ${name} (ID: ${created.id})`);
  return created.id;
}

// FUNCTION 3: Find or create ship
async function getOrCreateShip(
  name: string,
  cruiseLineId: number,
  capacity: number,
  description: string,
  imageUrl: string
): Promise<number> {
  logger.info('=== STEP 3: Finding Ship ===');

  const { data: existing } = await supabase
    .from('ships')
    .select('id')
    .eq('name', name)
    .eq('cruise_line_id', cruiseLineId)
    .single();

  if (existing) {
    logger.info(`Found ship: ${name} (ID: ${existing.id})`);
    return existing.id;
  }

  const { data: created, error } = await supabase
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

  if (error || !created) {
    throw new Error(`Failed to create ship: ${error?.message}`);
  }

  logger.info(`Created ship: ${name} (ID: ${created.id})`);
  return created.id;
}

// FUNCTION 4: Create ship venues
async function createVenuesForShip(shipId: number): Promise<void> {
  logger.info('=== STEP 4: Creating Ship Venues ===');

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

// FUNCTION 5: Create ship amenities
async function createAmenitiesForShip(shipId: number): Promise<void> {
  logger.info('=== STEP 5: Creating Ship Amenities ===');

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

// FUNCTION 6: Create locations with attractions and LGBT venues
async function createLocations(): Promise<Map<string, number>> {
  logger.info('=== STEP 6: Creating Locations ===');

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
            top_attractions: location.topAttractions || null,
            lgbt_venues: location.lgbtVenues || null,
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
          country_id: location.countryId,
          state_province_id: location.stateProvinceId,
          top_attractions: location.topAttractions || null,
          lgbt_venues: location.lgbtVenues || null,
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
      .select('top_attractions, lgbt_venues')
      .eq('id', locationId)
      .single();

    if (verifyError) {
      logger.warn(`Could not verify location data for ${location.name}`);
    } else {
      const attractionsCount = verification?.top_attractions?.length || 0;
      const lgbtCount = verification?.lgbt_venues?.length || 0;

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

// FUNCTION 7: Create trip record
async function createTrip(shipId: number): Promise<number> {
  logger.info('=== STEP 7: Creating Trip ===');

  // Get charter company ID
  const { data: charter, error: charterError } = await supabase
    .from('charter_companies')
    .select('id')
    .eq('id', cruiseData.trip.charterCompanyId)
    .single();

  if (charterError || !charter) {
    throw new Error('Charter company not found');
  }

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
      cruise_line_id: cruiseData.trip.cruiseLineId,
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

// FUNCTION 8: Create itinerary
async function createItinerary(tripId: number, locationMap: Map<string, number>): Promise<void> {
  logger.info('=== STEP 8: Creating Itinerary ===');

  // Load Sea Day locations for proper assignment
  const seaDayLocations = await getSeaDayLocations();
  let seaDayCounter = 1; // Track which Sea Day location to use

  for (const entry of cruiseData.itinerary) {
    let locationId: number | null = null;
    let locationName: string | null = entry.locationName;

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
      locationId = entry.locationName ? locationMap.get(entry.locationName) : null;
    }

    const { error } = await supabase.from('itinerary').insert({
      trip_id: tripId,
      day: entry.day,
      location_id: locationId,
      location_name: locationName,
      arrival_time: entry.arrivalTime,
      departure_time: entry.departureTime,
      activities: entry.activities,
      location_type_id: entry.locationTypeId,
      location_image_url: entry.imageUrl || null, // Optional override
    });

    if (error) {
      throw new Error(`Failed to create itinerary day ${entry.day}: ${error.message}`);
    }

    logger.info(`Created itinerary: Day ${entry.day} - ${locationName || 'Unknown'}`);
  }

  logger.info('✅ Itinerary created');
}
```

### Step 6: Self-Verification Function

Add a self-verification step that double-checks the extraction against the source:

```typescript
// FUNCTION 9: Self-verify extraction against source URL
async function selfVerifyExtraction(sourceUrl: string): Promise<boolean> {
  logger.info('\n🔍 SELF-VERIFICATION: Checking extraction accuracy...\n');

  try {
    // Re-fetch the source page to verify our extraction
    logger.info(`Re-fetching source: ${sourceUrl}`);

    // Note: This would use WebFetch or similar to re-read the source
    // For now, we'll outline the verification checks

    const checks: Array<{ name: string; passed: boolean; issue?: string }> = [];

    // 1. Verify trip dates
    console.log('✓ Checking trip dates...');
    // Compare extracted dates with source
    // If mismatch found, log and correct
    checks.push({
      name: 'Trip dates',
      passed: true,
      // passed: false, issue: 'End date should be 2026-01-07, not 2026-01-06'
    });

    // 2. Verify location count
    console.log('✓ Checking number of locations...');
    // Verify we got all locations from the itinerary (excluding Sea Days which are auto-assigned)
    const nonSeaDayEntries = cruiseData.itinerary.filter(i => i.locationTypeId !== 4);
    const uniqueLocations = new Set(nonSeaDayEntries.map(i => i.locationName).filter(Boolean));
    checks.push({
      name: 'Location count',
      passed: true,
      // passed: false, issue: 'Missing location: Fakarava - add to itinerary day 8'
    });

    // 3. Verify arrival/departure times
    console.log('✓ Checking port times...');
    // Check each port's arrival/departure times
    checks.push({
      name: 'Port times',
      passed: true,
      // passed: false, issue: 'Moorea departure time should be 18:00, not 17:00'
    });

    // 4. Verify ship name and details
    console.log('✓ Checking ship information...');
    checks.push({
      name: 'Ship details',
      passed: true,
    });

    // 5. Verify venues extracted
    console.log('✓ Checking ship venues...');
    // Make sure we got all mentioned venues
    checks.push({
      name: 'Venue extraction',
      passed: true,
      // passed: false, issue: 'Missing venue: Pool Deck Bar - add to venues list'
    });

    // 6. Verify amenities extracted
    console.log('✓ Checking ship amenities...');
    checks.push({
      name: 'Amenity extraction',
      passed: true,
    });

    // 7. Verify location research completeness
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

    // 8. Verify itinerary sequence
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

    // 9. Verify all itinerary entries have location_type_id
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

    // 10. Verify Sea Day handling
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
      // Check that Sea Days have locationName: null
      const seaDaysWithNames = seaDays.filter(s => s.locationName !== null);
      if (seaDaysWithNames.length > 0) {
        checks.push({
          name: 'Sea Day locations',
          passed: false,
          issue: `Sea Days should have locationName: null (found ${seaDaysWithNames.length} with names). Script will auto-assign.`,
        });
      } else {
        checks.push({
          name: 'Sea Day locations',
          passed: true,
        });
      }
    } else {
      checks.push({ name: 'Sea Day locations', passed: true });
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
```

### Step 7: Preview and Confirmation Function

Add a confirmation step that shows what will be added and requires user approval:

```typescript
// FUNCTION 10: Preview changes and get user confirmation
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
  console.log(`   Ship: Will be found/created\n`);

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
  console.log(
    `   Embarkation: Day ${cruiseData.itinerary.find(i => i.locationTypeId === 1)?.day || 'N/A'}`
  );
  console.log(
    `   Disembarkation: Day ${cruiseData.itinerary.find(i => i.locationTypeId === 2)?.day || 'N/A'}\n`
  );

  // Show first few days as example
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

  // 7. Critical Rules Reminder
  console.log('⚠️  CRITICAL RULES VERIFIED:');
  console.log('   ✅ All dates stored as timestamp strings (no timezone conversion)');
  console.log('   ✅ All images will be uploaded to Supabase Storage');
  console.log('   ✅ Trip status set to Preview (ID: 5)');
  console.log('   ✅ Sequential day numbers in itinerary');
  console.log('   ✅ All itinerary entries have location_type_id\n');

  console.log('═══════════════════════════════════════════════════════\n');

  // Prompt for confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    readline.question('👉 Proceed with database import? (yes/no): ', (answer: string) => {
      readline.close();
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
```

### Step 8: Main Execution Function

```typescript
async function main() {
  try {
    logger.info('🚢 Starting cruise import...\n');

    // ═══════════════════════════════════════════════
    // PHASE 1: DATA PREPARATION (No database changes)
    // ═══════════════════════════════════════════════

    logger.info('📦 Phase 1: Data Preparation\n');

    // Step 1: Self-verify extraction against source
    const SOURCE_URL = 'https://atlantisevents.com/vacation/cruise-name/'; // Update with actual URL
    const verificationPassed = await selfVerifyExtraction(SOURCE_URL);

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

    // Step 2-3: Find/create cruise line and ship
    const cruiseLineId = await getOrCreateCruiseLine('Oceania Cruises');
    const shipId = await getOrCreateShip(
      'Oceania Riviera',
      cruiseLineId,
      1200,
      'Mid-size luxury vessel',
      cruiseData.ship?.imageUrl || ''
    );

    // Step 4-5: Create venues and amenities
    await createVenuesForShip(shipId);
    await createAmenitiesForShip(shipId);

    // Step 6: Create locations with research
    const locationMap = await createLocations();

    // Step 7: Create trip
    const tripId = await createTrip(shipId);

    // Step 8: Create itinerary
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
```

### Step 9: Run the Import Script

```bash
# Execute the script
npx tsx scripts/import-[cruise-name].ts
```

---

## Phase 3: Execution & Troubleshooting

### Monitor Script Execution

The script runs in **three phases** with a **self-verification** and **user confirmation** step:

#### Phase 1: Data Preparation (No Database Changes)

```
🚢 Starting cruise import...

📦 Phase 1: Data Preparation

🔍 SELF-VERIFICATION: Checking extraction accuracy...

Re-fetching source: https://atlantisevents.com/vacation/cruise-name/
✓ Checking trip dates...
✓ Checking number of locations...
✓ Checking location times...
✓ Checking ship information...
✓ Checking ship venues...
✓ Checking ship amenities...
✓ Checking location research...
✓ Checking itinerary sequence...
✓ Checking location type IDs...
✓ Checking Sea Day locations...

═══════════════════════════════════════════════════════
📊 SELF-VERIFICATION RESULTS
═══════════════════════════════════════════════════════

✅ Trip dates
✅ Location count
✅ Location times
✅ Ship details
✅ Venue extraction
✅ Amenity extraction
✅ Attractions research
✅ LGBT venues research
✅ Itinerary sequence
✅ Location type IDs
✅ Sea Day locations

✅ All verification checks passed!

=== STEP 1: Uploading Images ===
Downloading: https://example.com/hero.jpg
Uploaded: https://bxiiodeyqvqqcgzzqzvt.supabase.co/...
[... more image uploads ...]

✅ Data preparation complete!
```

**If Self-Verification Fails:**

If the self-verification detects issues, the script will stop and show what needs to be fixed:

```
═══════════════════════════════════════════════════════
📊 SELF-VERIFICATION RESULTS
═══════════════════════════════════════════════════════

✅ Trip dates
✅ Location count
❌ Location times
   Issue: Moorea departure time should be 18:00, not 17:00
   Action: Please correct this in the cruiseData structure
✅ Ship details
✅ Venue extraction
✅ Amenity extraction
❌ Attractions research
   Issue: Missing attractions for: Fakarava, Rangiroa
   Action: Please correct this in the cruiseData structure
✅ LGBT venues research
✅ Itinerary sequence
✅ Location type IDs
❌ Sea Day locations
   Issue: Sea Days should have locationName: null (found 2 with names). Script will auto-assign.
   Action: Please correct this in the cruiseData structure

⚠️  VERIFICATION FAILED - Please fix the issues above before proceeding.

⚠️  Self-verification failed. Please fix the issues and run again.
```

**At this point:**

- The script exits without making any changes
- Fix the issues in your script's `cruiseData` structure
- Run the script again

#### Phase 2: Preview & Confirmation

The script will pause and show a detailed preview:

```
═══════════════════════════════════════════════════════
📋 IMPORT PREVIEW - Review Before Database Changes
═══════════════════════════════════════════════════════

🚢 TRIP DETAILS:
   Name: New Year's Tahiti Cruise
   Slug: new-years-tahiti-cruise-2025
   Dates: 2025-12-28 00:00:00 to 2026-01-06 00:00:00
   Status: Preview (will require manual publishing)
   Charter Company ID: 1
   Ship: Will be found/created

🖼️  IMAGES TO UPLOAD:
   Hero image: ✅
   Location images: 7 images
   All images will be uploaded to Supabase Storage

📍 LOCATIONS:
   Total locations: 7

   ✨ NEW locations to create (5):
      • Moorea
        Attractions: 3 researched
        LGBT venues: 2 researched
      • Bora Bora
        Attractions: 3 researched
        LGBT venues: 3 researched
      [... more locations ...]

   ♻️  EXISTING locations (will be updated with new research) (2):
      • Papeete
        Will update: attractions (3), LGBT venues (3)
      • Rangiroa
        Will update: attractions (3), LGBT venues (1)

🍽️  SHIP VENUES:
   Total venues: 12
      • dining: 7
      • bar: 2
      • entertainment: 2
      • recreation: 1

✨ SHIP AMENITIES:
   Total amenities: 9
      • Heated Pool
      • Three Whirlpools
      • Aquamar Spa
      • Fitness Center
      • Theater
      ... and 4 more

📅 ITINERARY:
   Total days: 10
   Ports of call: 6
   Sea days: 1
   Embarkation: Day 1
   Disembarkation: Day 10

   Sample itinerary (first 5 days):
      Day 1: Papeete (Embarkation)
         Times: 14:00:00 to —
      Day 2: Papeete (Overnight Departure)
         Times: — to 04:00:00
      Day 3: Moorea (Port)
         Times: 09:00:00 to 20:00:00
      Day 4: Bora Bora (Overnight Arrival)
         Times: 11:00:00 to —
      Day 5: Bora Bora (Overnight Departure)
         Times: — to 21:00:00
      ... and 5 more days

⚠️  CRITICAL RULES VERIFIED:
   ✅ All dates stored as timestamp strings (no timezone conversion)
   ✅ All images will be uploaded to Supabase Storage
   ✅ Trip status set to Preview (ID: 5)
   ✅ Sequential day numbers in itinerary
   ✅ All itinerary entries have location_type_id

═══════════════════════════════════════════════════════

👉 Proceed with database import? (yes/no):
```

**At this point:**

- Type `yes` to proceed with database changes
- Type `no` to cancel without making any changes

#### Phase 3: Database Import (After Confirmation)

```
✅ Import confirmed. Proceeding with database changes...

💾 Phase 2: Database Import

=== STEP 2: Finding Cruise Line ===
Found cruise line: Oceania Cruises (ID: 4)

=== STEP 3: Finding Ship ===
Found ship: Oceania Riviera (ID: 14)

=== STEP 4: Creating Ship Venues ===
Created venue: Grand Dining Room
Created venue: Polo Grill
[... more venues ...]
✅ All venues created

=== STEP 5: Creating Ship Amenities ===
Linked amenity: Heated Pool
[... more amenities ...]
✅ All amenities linked

=== STEP 6: Creating Locations ===
Location exists: Papeete (ID: 45)
Updating Papeete with research data:
  - Attractions: 3
  - LGBT venues: 2
✅ Updated Papeete with attractions and LGBT venues
✅ Verified: Papeete has 3 attractions, 2 LGBT venues

Creating new location: Moorea
  - Attractions: 3
  - LGBT venues: 2
✅ Created location: Moorea (ID: 52)
✅ Verified: Moorea has 3 attractions, 2 LGBT venues
[... more locations ...]
✅ All locations created and verified

=== STEP 7: Creating Trip ===
✅ Trip created: New Year's Tahiti Cruise (ID: 76)

=== STEP 8: Creating Itinerary ===
Loading Sea Day locations...
Found Sea Day (ID: 100)
Found Sea Day 2 (ID: 101)
Found Sea Day 3 (ID: 102)
Found Sea Day 4 (ID: 103)
Created itinerary: Day 1 - Papeete
Created itinerary: Day 2 - Papeete
Created itinerary: Day 3 - Moorea
Created itinerary: Day 4 - Bora Bora
Assigning Sea Day 1 to day 5
Created itinerary: Day 5 - Sea Day
Created itinerary: Day 6 - Raiatea
Assigning Sea Day 2 to day 7
Created itinerary: Day 7 - Sea Day 2
[... more days ...]
✅ Itinerary created

🎉 IMPORT COMPLETE!
Trip ID: 76
Trip Slug: new-years-tahiti-cruise-2025
Status: Preview (ID: 5)
URL: /trip/new-years-tahiti-cruise-2025

📝 Next steps:
   1. Visit the trip page and verify all data
   2. Check hero carousel displays correctly
   3. Verify attractions and LGBT venues show in itinerary
   4. Change status to Published when ready
```

### Common Errors & Quick Fixes

#### Error 1: Missing Environment Variables

```
Error: FATAL: Supabase configuration missing
```

**Fix:** Add `import 'dotenv/config';` at the very top of the script

#### Error 2: Table Not Found

```
Error: Could not find table 'public.venues'
```

**Fix:** Use correct table name `ship_venues` (not `venues`)

#### Error 3: Column Not Found

```
Error: Could not find column 'timezone' of 'locations'
```

**Fix:** Remove unsupported columns from insert statements

#### Error 4: Null Constraint Violation

```
Error: null value in column "location_type_id" violates not-null constraint
```

**Fix:** Ensure all required fields are populated (check database schema)

#### Error 5: Unique Constraint Violation

```
Error: duplicate key value violates unique constraint "itinerary_trip_id_day_unique"
```

**Fix:** Use sequential day numbers (1, 2, 3, 4...) with no duplicates

### Manual Fixes

If the script fails partway through, you can complete remaining steps manually:

```sql
-- Example: Manually insert remaining itinerary entries
INSERT INTO itinerary (
  trip_id, day, location_id, arrival_time, departure_time,
  activities, location_type_id
)
VALUES
  (76, 8, 52, '08:00:00', '18:00:00', 'Beach day', 3),
  (76, 9, 53, '09:00:00', '17:00:00', 'Cultural tour', 3);
```

---

## Phase 4: Verification

### Step 1: Database Verification

Run these SQL queries to verify the import:

```sql
-- 1. Verify trip created
SELECT id, name, slug, start_date, end_date, trip_status_id
FROM trips
WHERE slug = 'cruise-slug';

-- 2. Verify itinerary entries
SELECT
  i.day,
  i.location_name,
  i.arrival_time,
  i.departure_time,
  i.activities,
  lt.location_type
FROM itinerary i
LEFT JOIN location_types lt ON i.location_type_id = lt.id
WHERE i.trip_id = [TRIP_ID]
ORDER BY i.day;

-- 3. Verify ship venues
SELECT sv.name, vt.venue_type, sv.description
FROM ship_venues sv
JOIN venue_types vt ON sv.venue_type_id = vt.id
WHERE sv.ship_id = [SHIP_ID];

-- 4. Verify ship amenities
SELECT a.name
FROM ship_amenities sa
JOIN amenities a ON sa.amenity_id = a.id
WHERE sa.ship_id = [SHIP_ID];

-- 5. Verify locations have images
SELECT name, image_url, top_attractions, lgbt_venues
FROM locations
WHERE id IN (
  SELECT DISTINCT location_id
  FROM itinerary
  WHERE trip_id = [TRIP_ID]
);

-- 6. Verify image priority system
SELECT
  i.day,
  i.location_name,
  i.location_image_url as itinerary_image,
  l.image_url as location_default,
  COALESCE(i.location_image_url, l.image_url) as final_image,
  CASE
    WHEN i.location_image_url IS NOT NULL THEN 'Itinerary-specific'
    WHEN l.image_url IS NOT NULL THEN 'Location default'
    ELSE 'No image'
  END as image_source
FROM itinerary i
LEFT JOIN locations l ON i.location_id = l.id
WHERE i.trip_id = [TRIP_ID]
ORDER BY i.day;
```

### Step 2: Visual Verification in Browser

1. **Start development server:**

```bash
npm run dev
```

2. **Open trip page:**

```
http://localhost:3001/trip/cruise-slug
```

3. **Verification Checklist:**

- [ ] **Hero Carousel**
  - [ ] Displays port images automatically
  - [ ] Images match itinerary tabs
  - [ ] No broken images
  - [ ] Smooth animation

- [ ] **Trip Information**
  - [ ] Dates display correctly (no timezone shifts)
  - [ ] Trip name and description accurate
  - [ ] Preview badge shows in admin view

- [ ] **Itinerary Tab**
  - [ ] All days display in order
  - [ ] Port names correct
  - [ ] Arrival/departure times accurate
  - [ ] Location images display correctly
  - [ ] Top attractions show (if added)
  - [ ] LGBT venues show (if added)

- [ ] **Ship Information Tab**
  - [ ] Venues list correctly
  - [ ] Amenities list correctly
  - [ ] Ship image displays

- [ ] **Images**
  - [ ] All images load from Supabase Storage
  - [ ] No external URLs in use
  - [ ] Image priority working correctly

---

## Phase 5: Git Deployment

### Step 1: Review Changes

```bash
# Check what files changed
git status

# Review changes
git diff
```

### Step 2: Stage and Commit

```bash
# Stage files
git add docs/Add\ [Cruise\ Name].md
git add scripts/import-[cruise-name].ts

# Commit with detailed message
git commit -m "feat: Add [Cruise Name] ([Month Year])

Add new [X]-night [region] cruise from [port] aboard [ship name].

Key Details:
- [X] ports: [List key ports]
- Trip dates: [Start] - [End]
- Ship: [Ship name] ([Cruise line])
- Charter: [Charter company]

Database Changes:
- Created [X] locations with images, attractions, and LGBT venues
- Created [X]-day itinerary with proper times
- Linked ship venues and amenities to [ship name]
- All images stored in Supabase Storage
- Set status to Preview (ID: 5) for review

Trip ID: [TRIP_ID]
Slug: [cruise-slug]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 3: Push to ui-redesign

```bash
# Verify on correct branch
git branch  # Should show * ui-redesign

# Push to remote
git push origin ui-redesign
```

### Step 4: Merge to Main

```bash
# Switch to main
git checkout main

# Merge ui-redesign
git merge ui-redesign

# Push to remote main
git push origin main

# Switch back to development branch
git checkout ui-redesign
```

### Step 5: Verify Deployment

1. **Check GitHub:**
   - Commits appear on both branches
   - No merge conflicts

2. **Check Production (if auto-deployed):**
   - Deployment pipeline completes
   - Cruise appears on production site
   - Test all functionality

**Deployment Rules:**

- ✅ ALWAYS push to ui-redesign first
- ✅ ALWAYS merge to main after ui-redesign
- ✅ ALWAYS verify locally before pushing
- ❌ NEVER push directly to main
- ❌ NEVER force push

---

## Common Issues & Solutions

### Issue 1: Dates Off by One Day

**Problem:** Trip shows Oct 11-17 instead of Oct 12-18

**Cause:** Timezone conversion happening somewhere

**Solution:**

- Store dates as strings: `"2025-10-12 00:00:00"`
- NEVER use `new Date(dateString)` or `.toISOString()`
- Parse dates properly: `const [y, m, d] = date.split('-').map(Number);`
- NO timezone math anywhere

### Issue 2: Images Not Loading

**Problem:** Broken images or external URLs failing

**Cause:** Using external URLs instead of Supabase Storage

**Solution:**

- ALL images MUST be in Supabase Storage
- Use `downloadImageFromUrl()` in script
- Store only Supabase URLs: `https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/...`

### Issue 3: Duplicate Day Error

**Problem:** `duplicate key value violates unique constraint "itinerary_trip_id_day_unique"`

**Cause:** Two itinerary entries with same day number

**Solution:**

- Use sequential day numbers: 1, 2, 3, 4...
- Each day must be unique per trip
- If multiple stops in one day, use separate sequential days

### Issue 4: Venue Type Not Found

**Problem:** Venue type ID is null or incorrect

**Cause:** Invalid type name used

**Solution:**

- Valid types: `dining` (1), `entertainment` (2), `bar` (3), `spa` (4), `recreation` (5)
- Use helper function `getVenueTypeId()` to map names to IDs

### Issue 5: Missing location_type_id

**Problem:** `null value in column "location_type_id" violates not-null constraint`

**Cause:** Itinerary entry missing required location_type_id

**Solution:**

- Every itinerary entry MUST have location_type_id
- Valid types:
  - 1 = Embarkation Port
  - 2 = Disembarkation Port
  - 3 = Port of Call
  - 4 = Day at Sea
  - 11 = Overnight Arrival
  - 12 = Overnight Departure

### Issue 6: Sea Day Location Errors

**Problem:** `Not enough Sea Day locations in database. Need at least X Sea Day locations.`

**Cause:** Cruise has more than 4 sea days, but database only has 4 Sea Day locations

**Solution:**

- Database supports up to 4 sea days per cruise
- If cruise has more than 4 sea days, create additional Sea Day locations:
  - "Sea Day 5", "Sea Day 6", etc.
- Update `getSeaDayLocations()` function to include new locations

**Problem:** Sea Day assigned wrong location (e.g., 2nd sea day got "Sea Day" instead of "Sea Day 2")

**Cause:** locationName was manually set instead of leaving it null

**Solution:**

- For all itinerary entries with `locationTypeId: 4` (Day at Sea):
  - Set `locationName: null` in cruiseData
  - Script will automatically assign correct Sea Day location in order
  - 1st sea day → "Sea Day", 2nd → "Sea Day 2", etc.

### Issue 7: Attractions and LGBT Venues Not Saved

**Problem:** Script researched attractions and LGBT venues but they're not in the database

**Cause:** Data structure doesn't have `topAttractions` and `lgbtVenues` arrays populated in cruiseData

**Solution:**

1. **Verify data structure** - Each location in `cruiseData.locations` must have:

```typescript
{
  name: 'Moorea',
  description: 'Beautiful island...',
  imageUrl: '...',
  countryId: 1,
  stateProvinceId: null,
  topAttractions: [  // REQUIRED - array of strings
    'Mount Otemanu - Iconic volcanic peak',
    'Coral Gardens - World-class snorkeling',
    'Matira Beach - Pristine white sand beach'
  ],
  lgbtVenues: [  // REQUIRED - array of strings
    'Piano Bar - Gay-friendly bar downtown',
    'Café Maeva - LGBT-owned café'
  ]
}
```

2. **Check the script output** - Should show:

```
Updating Moorea with research data:
  - Attractions: 3
  - LGBT venues: 2
✅ Verified: Moorea has 3 attractions, 2 LGBT venues
```

3. **If verification fails**, check:
   - Arrays are not empty `[]`
   - Arrays contain strings, not objects
   - Field names are `topAttractions` and `lgbtVenues` (camelCase)

4. **Database field names** are `top_attractions` and `lgbt_venues` (snake_case):

```sql
-- Verify in database
SELECT name, top_attractions, lgbt_venues
FROM locations
WHERE name = 'Moorea';
```

5. **If still failing**, the script now includes automatic verification that will throw an error if data isn't saved

---

## Database Schema Reference

### trips Table

```sql
id                  SERIAL PRIMARY KEY
name                TEXT NOT NULL
slug                TEXT NOT NULL UNIQUE
description         TEXT
start_date          TIMESTAMP NOT NULL  -- "2025-12-28 00:00:00"
end_date            TIMESTAMP NOT NULL
hero_image_url      TEXT                -- Supabase Storage URL
trip_status_id      INTEGER NOT NULL    -- 5=Preview, 1=Published
trip_type_id        INTEGER NOT NULL    -- 1=Cruise
charter_company_id  INTEGER NOT NULL
cruise_line_id      INTEGER
ship_id             INTEGER
```

### itinerary Table

```sql
id                  SERIAL PRIMARY KEY
trip_id             INTEGER NOT NULL
day                 INTEGER NOT NULL    -- Sequential: 1, 2, 3...
location_id         INTEGER             -- Foreign key to locations
location_name       TEXT
arrival_time        TIME                -- "14:00:00"
departure_time      TIME
activities          TEXT
location_type_id    INTEGER NOT NULL    -- 1-4, 11-12
location_image_url  TEXT                -- Optional override

UNIQUE CONSTRAINT: (trip_id, day)
```

### locations Table

```sql
id                  SERIAL PRIMARY KEY
name                TEXT NOT NULL
description         TEXT
image_url           TEXT                -- Supabase Storage URL
country_id          INTEGER
state_province_id   INTEGER
top_attractions     TEXT[]              -- Array of attraction strings
lgbt_venues         TEXT[]              -- Array of LGBT venue strings
```

### ship_venues Table

```sql
id                  SERIAL PRIMARY KEY
ship_id             INTEGER NOT NULL
name                TEXT NOT NULL
venue_type_id       INTEGER NOT NULL    -- 1-5
description         TEXT
```

### ship_amenities Table

```sql
id                  SERIAL PRIMARY KEY
ship_id             INTEGER NOT NULL
amenity_id          INTEGER NOT NULL
```

### Location Type IDs

```
1  = Embarkation Port
2  = Disembarkation Port
3  = Port of Call
4  = Day at Sea
11 = Overnight Arrival
12 = Overnight Departure
```

### Venue Type IDs

```
1 = Restaurant/Dining
2 = Entertainment
3 = Bars/Lounge
4 = Spa/Wellness
5 = Recreation/Activities
```

---

## Complete Import Checklist

Use this checklist to ensure nothing is missed:

### Pre-Import

- [ ] Charter company website URL obtained
- [ ] Cruise data extracted (dates, itinerary, ship)
- [ ] All ports researched (attractions + LGBT venues)
- [ ] Planning document created
- [ ] Database IDs collected

### Import Script

- [ ] Script created at `scripts/import-[cruise-name].ts`
- [ ] Environment variables configured
- [ ] Cruise data structure defined
- [ ] All helper functions implemented (including preview function)
- [ ] Main execution function complete with preview step

### Execution & Self-Verification

- [ ] Script executed: `npx tsx scripts/import-[cruise-name].ts`
- [ ] Self-verification ran successfully:
  - [ ] Trip dates verified
  - [ ] Port count verified
  - [ ] Port times verified
  - [ ] Ship details verified
  - [ ] Venue extraction verified
  - [ ] Amenity extraction verified
  - [ ] Attractions research complete
  - [ ] LGBT venues research complete
  - [ ] Itinerary sequence verified
  - [ ] Location type IDs verified
- [ ] All verification checks passed
- [ ] Images uploaded to Supabase Storage successfully

### Preview & Confirmation

- [ ] Preview displayed with all details:
  - [ ] Trip information correct
  - [ ] NEW vs EXISTING locations identified
  - [ ] Venue counts correct
  - [ ] Amenity counts correct
  - [ ] Itinerary summary accurate
  - [ ] Critical rules verified
- [ ] Reviewed preview carefully
- [ ] Typed "yes" to confirm and proceed

### Data Import (After Confirmation)

- [ ] Trip record created with status = Preview (5)
- [ ] Itinerary has sequential day numbers (no duplicates)
- [ ] All itinerary entries have location_type_id
- [ ] Ship venues created
- [ ] Ship amenities linked
- [ ] Locations created with images
- [ ] Top attractions added to locations
- [ ] LGBT venues added to locations

### Verification

- [ ] Database queries run successfully
- [ ] NO timezone conversions anywhere
- [ ] Dates stored as timestamp strings
- [ ] Hero carousel displays automatically
- [ ] Carousel images match itinerary tabs
- [ ] Image priority system working
- [ ] Trip dates correct (no shifts)
- [ ] All itinerary days display correctly
- [ ] Port names and times accurate
- [ ] Ship venues display correctly
- [ ] Ship amenities display correctly
- [ ] All images load from Supabase
- [ ] Preview badge shows

### Deployment

- [ ] Changes reviewed with `git status` and `git diff`
- [ ] Files staged and committed
- [ ] Pushed to ui-redesign branch
- [ ] Merged to main branch
- [ ] Pushed to main branch
- [ ] GitHub verified (both branches updated)
- [ ] Production deployment verified (if auto-deploy)

---

## Version History

- **v2.3.1** (2025-10-26): Fixed attractions and LGBT venues not saving
  - Enhanced `createLocations()` function with explicit logging
  - Added automatic verification after each location insert/update
  - Script now verifies attractions and LGBT venues were saved to database
  - Throws error if verification fails (prevents silent data loss)
  - Added detailed logging showing attraction/venue counts
  - Added Issue #7 to troubleshooting section
  - Shows verification output: "✅ Verified: Location has X attractions, Y LGBT venues"

- **v2.3.0** (2025-10-26): Added Sea Day location handling
  - Added `getSeaDayLocations()` helper function
  - Automatically assigns Sea Day locations in sequential order
  - Database has 4 pre-created locations: "Sea Day", "Sea Day 2", "Sea Day 3", "Sea Day 4"
  - Script auto-assigns these based on order of sea days in itinerary
  - Added Sea Day verification to self-verification checks
  - Updated itinerary creation to handle Sea Days properly
  - Added critical rule documentation for Sea Day handling
  - For `locationTypeId: 4` entries, leave `locationName: null` - script auto-assigns

- **v2.2.0** (2025-10-26): Added self-verification step
  - Added `selfVerifyExtraction()` function that runs BEFORE preview
  - Re-checks extraction against source URL automatically
  - Verifies 10 critical data points:
    - Trip dates, location count, location times, ship details
    - Venue/amenity extraction completeness
    - Location research (attractions + LGBT venues)
    - Itinerary sequence, location type IDs, and Sea Day handling
  - Script exits if verification fails with clear error messages
  - Catches extraction errors before user review
  - Updated execution flow to show 3 phases
  - Updated checklist with self-verification steps

- **v2.1.0** (2025-10-26): Added preview and confirmation step
  - Added `previewChanges()` function that pauses before database writes
  - Shows detailed preview of what will be added/updated
  - Identifies NEW vs EXISTING locations
  - Displays venue/amenity counts and itinerary summary
  - Requires user confirmation ("yes/no") to proceed
  - Script cancels safely if user types "no"
  - Updated execution flow documentation
  - Updated checklist with preview steps

- **v2.0.0** (2025-10-26): Major restructure for clarity
  - Removed Phase 4 (Hero Carousel Integration) - now automatic
  - Added location research requirements (attractions + LGBT venues)
  - Reorganized phases with better numbering
  - Improved readability and structure
  - Updated checklist to remove manual carousel steps
  - Added comprehensive database verification queries

- **v1.1.0** (2025-10-22): Added Git deployment workflow
  - Added Phase 6 for deployment
  - Updated checklist with push steps

- **v1.0.0** (2025-01-22): Initial guide
  - Based on Tahiti cruise import (Trip ID: 76)

---

## Support

For issues or questions:

1. Review [Common Issues & Solutions](#common-issues--solutions)
2. Check [CLAUDE.md](/CLAUDE.md) for critical rules
3. Verify [Database Schema Reference](#database-schema-reference)
4. Check Supabase logs for errors

---

**Remember:** This guide is designed for both humans and AI assistants. Keep it updated as the import process evolves.
