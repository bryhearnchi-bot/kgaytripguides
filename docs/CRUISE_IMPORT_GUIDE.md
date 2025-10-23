# Cruise Import Guide: Step-by-Step Process

This guide documents the complete process for importing a new cruise into the KGay Travel Guides application, from data extraction to UI integration.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Data Extraction and Planning](#phase-1-data-extraction-and-planning)
4. [Phase 2: Import Script Creation](#phase-2-import-script-creation)
5. [Phase 3: Execution and Troubleshooting](#phase-3-execution-and-troubleshooting)
6. [Phase 4: Hero Carousel Integration](#phase-4-hero-carousel-integration)
7. [Phase 5: Verification](#phase-5-verification)
8. [Common Issues and Solutions](#common-issues-and-solutions)
9. [Database Schema Reference](#database-schema-reference)

---

## Overview

Adding a new cruise involves:

1. Extracting data from the charter company's website
2. Creating an automated import script
3. Uploading images to Supabase Storage
4. Populating database tables (trips, itinerary, locations, ship_venues, ship_amenities)
5. Integrating port images into the hero carousel
6. Setting trip status to 'Preview' for review

**Timeline:** 2-3 hours for a complete cruise import

---

## Prerequisites

### Required Information

- Charter company website URL with cruise details
- Cruise dates and itinerary
- Ship information (name, cruise line)
- Port information (names, descriptions, images)
- Ship venues and amenities

### Environment Setup

```bash
# Ensure .env file has required variables
DATABASE_URL="postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres"
SUPABASE_URL="https://bxiiodeyqvqqcgzzqzvt.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
```

### Tools

- Node.js with TypeScript (tsx)
- Supabase database access
- WebFetch or similar scraping capability

---

## Phase 1: Data Extraction and Planning

### Step 1.1: Extract Cruise Data from Website

Use WebFetch to extract data from the charter company's cruise page:

```typescript
// Example: Extract from Atlantis Events cruise page
const cruiseUrl = 'https://atlantisevents.com/vacation/cruise-name/';

// Extract:
// - Cruise name and dates
// - Itinerary (ports, arrival/departure times)
// - Ship information
// - Pricing and cabin types
// - Special events or theme parties
```

### Step 1.2: Create Planning Document

Create a comprehensive planning document (e.g., `docs/Add [Cruise Name].md`) with:

```markdown
# Add [Cruise Name] - Implementation Plan

## Test Case URL

[Charter company cruise page URL]

## Cruise Overview

- **Name:** [Full cruise name]
- **Dates:** [Start date] - [End date]
- **Ship:** [Ship name]
- **Cruise Line:** [Cruise line name]
- **Charter Company:** [Charter company name]
- **Ports:** [Number of ports]
- **Days:** [Number of days]

## Database IDs to Use

- Charter Company ID: [ID from charter_companies table]
- Cruise Line ID: [ID from cruise_lines table]
- Ship ID: [ID from ships table]
- Trip Type ID: [ID from trip_types table - usually 1 for Cruise]
- Trip Status ID: 5 (Preview - for review before publishing)

## Implementation Steps

### Step 1: Download and Upload Images

[List all images needed with source URLs]

### Step 2: Find/Create Cruise Line

[Instructions for finding or creating cruise line]

### Step 3: Find/Create Ship

[Instructions for finding or creating ship]

### Step 4: Create Ship Venues

[List of venues with types and descriptions]

### Step 5: Create Ship Amenities

[List of amenities]

### Step 6: Create/Find Locations

[List of ports with details]

### Step 7: Create Trip Record

[Trip details and settings]

### Step 8: Create Itinerary

[Day-by-day itinerary with location IDs and times]

### Step 9: Update Hero Carousel

[Instructions for adding port images to carousel]

### Step 10: Validation

[Verification queries and checks]
```

### Step 1.3: Document Critical Rules

Include these critical rules in the planning document:

**CRITICAL RULES:**

1. **NO Timezone Conversions**: All dates/times are in destination timezone
   - Store as strings: `"2025-12-28 00:00:00"`
   - Never use `new Date(dateString)` or `.toISOString()`

2. **ALL Images in Supabase Storage**: No external URLs
   - Download external images first
   - Upload to appropriate Supabase bucket
   - Use only Supabase Storage URLs in database

3. **Trip Status**: Always set to Preview (ID: 5) initially
   - Allows review before publishing
   - Change to Published (ID: 1) after verification

4. **Database Field Naming**:
   - Database: snake_case (`start_date`, `hero_image_url`)
   - API/Frontend: camelCase (`startDate`, `heroImageUrl`)

---

## Phase 2: Import Script Creation

### Step 2.1: Create Import Script Structure

Create script at `scripts/import-[cruise-name].ts`:

```typescript
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
    name: 'Cruise Name',
    slug: 'cruise-slug',
    description: 'Cruise description',
    startDate: '2025-12-28 00:00:00', // Timestamp string, NO timezone conversion
    endDate: '2026-01-06 00:00:00',
    heroImageUrl: '', // Will be populated
    statusId: 5, // Preview status
    tripTypeId: 1, // Cruise type
    charterCompanyId: 1, // From charter_companies table
    cruiseLineId: 4, // From cruise_lines table
    shipId: 14, // From ships table
  },

  venues: [
    {
      name: 'Venue Name',
      type: 'dining', // dining, entertainment, bar, spa, recreation
      description: 'Venue description',
    },
    // ... more venues
  ],

  amenities: [
    {
      name: 'Amenity Name',
      categoryId: 1, // From amenity_categories table
      description: 'Amenity description',
    },
    // ... more amenities
  ],

  locations: [
    {
      name: 'Port Name',
      description: 'Port description',
      imageUrl: '', // External URL - will be downloaded and uploaded
      countryId: 1, // From countries table
      stateProvinceId: null, // Optional
    },
    // ... more locations
  ],

  itinerary: [
    {
      day: 1, // Sequential day number (must be unique per trip)
      locationId: null, // Will be populated after location creation
      arrivalTime: '14:00:00', // 24-hour format
      departureTime: '23:59:00',
      activities: 'Embarkation',
      locationTypeId: 1, // 1=Embarkation, 2=Disembarkation, 3=Port, 4=Day at Sea, 11=Overnight Arrival, 12=Overnight Departure
      imageUrl: '', // Optional itinerary-specific image
    },
    // ... more itinerary entries
  ],
};
```

### Step 2.2: Implement Helper Functions

```typescript
// Get venue type ID from type name
async function getVenueTypeId(typeName: string): Promise<number> {
  const typeMap: Record<string, number> = {
    dining: 1, // Restaurant
    entertainment: 2, // Entertainment
    bar: 3, // Bars / Lounge
    spa: 4, // Spa
    recreation: 5, // Recreation
  };
  return typeMap[typeName] || 1;
}

// Download and upload image to Supabase
async function uploadImage(
  externalUrl: string,
  bucketType: string, // 'ships', 'locations', 'trips', 'general'
  name: string
): Promise<string> {
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
```

### Step 2.3: Implement Import Steps

```typescript
// Step 1: Upload all images
async function uploadAllImages(): Promise<void> {
  logger.info('Step 1: Uploading images...');

  // Upload location images
  for (const location of cruiseData.locations) {
    if (location.imageUrl) {
      const supabaseUrl = await uploadImage(
        location.imageUrl,
        'locations',
        `${location.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
      );
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
}

// Step 2: Find or create cruise line
async function findCruiseLine(): Promise<number> {
  logger.info('Step 2: Finding cruise line...');

  const { data, error } = await supabase
    .from('cruise_lines')
    .select('id')
    .eq('name', 'Cruise Line Name')
    .single();

  if (error || !data) {
    throw new Error('Cruise line not found');
  }

  return data.id;
}

// Step 3: Find or create ship
async function findShip(cruiseLineId: number): Promise<number> {
  logger.info('Step 3: Finding ship...');

  const { data, error } = await supabase
    .from('ships')
    .select('id')
    .eq('name', 'Ship Name')
    .eq('cruise_line_id', cruiseLineId)
    .single();

  if (error || !data) {
    throw new Error('Ship not found');
  }

  return data.id;
}

// Step 4: Create ship venues
async function createVenuesForShip(shipId: number): Promise<void> {
  logger.info('Step 4: Creating ship venues...');

  for (const venue of cruiseData.venues) {
    const venueTypeId = await getVenueTypeId(venue.type);

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
  }
}

// Step 5: Create ship amenities
async function createAmenitiesForShip(shipId: number): Promise<void> {
  logger.info('Step 5: Creating ship amenities...');

  for (const amenity of cruiseData.amenities) {
    const { error } = await supabase.from('ship_amenities').insert({
      ship_id: shipId,
      name: amenity.name,
      amenity_category_id: amenity.categoryId,
      description: amenity.description,
    });

    if (error) {
      logger.error(`Failed to create amenity: ${amenity.name}`, error);
      throw error;
    }
  }
}

// Step 6: Create or find locations
async function createLocations(): Promise<Map<string, number>> {
  logger.info('Step 6: Creating locations...');

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
        description: location.description,
        image_url: location.imageUrl,
        country_id: location.countryId,
        state_province_id: location.stateProvinceId,
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

// Step 7: Create trip record
async function createTrip(): Promise<number> {
  logger.info('Step 7: Creating trip record...');

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
      cruise_line_id: cruiseData.trip.cruiseLineId,
      ship_id: cruiseData.trip.shipId,
    })
    .select('id')
    .single();

  if (error || !data) {
    logger.error('Failed to create trip', error);
    throw error;
  }

  logger.info(`Created trip: ${cruiseData.trip.name} (ID: ${data.id})`);
  return data.id;
}

// Step 8: Create itinerary entries
async function createItinerary(tripId: number, locationMap: Map<string, number>): Promise<void> {
  logger.info('Step 8: Creating itinerary entries...');

  for (const entry of cruiseData.itinerary) {
    // Map location name to ID
    const locationName = cruiseData.locations.find((_, index) => index === entry.locationId)?.name;

    const locationId = locationName ? locationMap.get(locationName) : null;

    const { error } = await supabase.from('itinerary').insert({
      trip_id: tripId,
      day: entry.day,
      location_id: locationId,
      arrival_time: entry.arrivalTime,
      departure_time: entry.departureTime,
      activities: entry.activities,
      location_type_id: entry.locationTypeId,
      location_image_url: entry.imageUrl,
    });

    if (error) {
      logger.error(`Failed to create itinerary entry for day ${entry.day}`, error);
      throw error;
    }
  }

  logger.info('Itinerary created successfully');
}
```

### Step 2.4: Main Execution Function

```typescript
async function main() {
  try {
    logger.info('Starting cruise import...');

    // Step 1: Upload all images
    await uploadAllImages();

    // Step 2: Find cruise line
    const cruiseLineId = await findCruiseLine();

    // Step 3: Find ship
    const shipId = await findShip(cruiseLineId);

    // Step 4: Create ship venues
    await createVenuesForShip(shipId);

    // Step 5: Create ship amenities
    await createAmenitiesForShip(shipId);

    // Step 6: Create locations
    const locationMap = await createLocations();

    // Step 7: Create trip
    const tripId = await createTrip();

    // Step 8: Create itinerary
    await createItinerary(tripId, locationMap);

    logger.info('✅ Cruise import completed successfully!');
    logger.info(`Trip ID: ${tripId}`);
    logger.info(`Trip URL: /trip/${cruiseData.trip.slug}`);
  } catch (error) {
    logger.error('❌ Cruise import failed', error);
    process.exit(1);
  }
}

// Run the import
main();
```

### Step 2.5: Run the Import Script

```bash
# Execute the import script
npx tsx scripts/import-[cruise-name].ts
```

---

## Phase 3: Execution and Troubleshooting

### Step 3.1: Monitor Script Execution

Watch for these common issues during execution:

1. **Missing Environment Variables**

   ```
   Error: FATAL: Supabase configuration missing
   Fix: Add `import 'dotenv/config';` at top of script
   ```

2. **Table Not Found**

   ```
   Error: Could not find the table 'public.venues' in the schema cache
   Fix: Use 'ship_venues' instead of 'venues' table
   ```

3. **Column Not Found**

   ```
   Error: Could not find the 'timezone' column of 'locations'
   Fix: Remove unsupported columns from insert statements
   ```

4. **Null Constraint Violation**

   ```
   Error: null value in column "location_type_id" violates not-null constraint
   Fix: Ensure all required fields are populated
   ```

5. **Unique Constraint Violation**
   ```
   Error: duplicate key value violates unique constraint "itinerary_trip_id_day_unique"
   Fix: Use sequential day numbers (1, 2, 3...) instead of duplicates
   ```

### Step 3.2: Manual Fixes (if needed)

If the script fails mid-way, you may need to complete some steps manually:

```sql
-- Example: Manually insert itinerary entries
INSERT INTO itinerary (trip_id, day, location_id, arrival_time, departure_time, activities, location_type_id)
VALUES
  (76, 1, 45, '14:00:00', '23:59:00', 'Embarkation Day', 1),
  (76, 2, 46, '08:00:00', '18:00:00', 'Scenic cruising and water sports', 3),
  -- ... more entries
;
```

---

## Phase 4: Hero Carousel Integration

### Step 4.1: Retrieve Port Image URLs

Query the database to get all port image URLs:

```sql
SELECT
  l.name,
  l.image_url
FROM itinerary i
JOIN locations l ON i.location_id = l.id
WHERE i.trip_id = 76  -- Replace with your trip ID
  AND l.image_url IS NOT NULL
  AND i.location_type_id IN (1, 2, 3, 11, 12)  -- Ports only, not sea days
ORDER BY i.day;
```

### Step 4.2: Update Hero Carousel Component

Edit `client/src/components/shadcn-studio/blocks/hero-section-01/hero-section-01.tsx`:

**Add image array:**

```typescript
// [Cruise Name] cruise images (from locations table)
const cruiseNameImages = [
  'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-xxx.jpg', // Port 1
  'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-yyy.jpg', // Port 2
  // ... more port images
];
```

**Add slug check:**

```typescript
const isCruiseNameCruise = slug === 'cruise-slug';
```

**Update image selection:**

```typescript
const images = isHalloweenCruise
  ? halloweenImages
  : isHongKongCruise
    ? hongKongImages
    : isTahitiCruise
      ? tahitiImages
      : isCruiseNameCruise
        ? cruiseNameImages
        : greekImages;
```

**Add desktop carousel section:**

```typescript
) : isCruiseNameCruise ? (
  <>
    {/* First set of port images */}
    <img
      src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-xxx.jpg"
      alt="Port 1"
      className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
      loading="lazy"
    />
    <img
      src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-yyy.jpg"
      alt="Port 2"
      className="h-[14.4rem] w-[19.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
      loading="lazy"
    />
    {/* ... more images with varying heights */}

    {/* Duplicate set for seamless loop */}
    <img
      src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-xxx.jpg"
      alt="Port 1"
      className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
      loading="lazy"
    />
    {/* ... duplicate all images */}
  </>
```

**Image sizing guidelines:**

- Vary heights between 12.6rem and 18rem for visual interest
- Width should be ~1.33x to 1.5x the height for landscape images
- Follow the pattern of existing cruises (Greek, Halloween, Hong Kong)

---

## Phase 5: Verification

### Step 5.1: Database Verification

Run these queries to verify data was imported correctly:

```sql
-- Verify trip was created
SELECT id, name, slug, start_date, end_date, trip_status_id
FROM trips
WHERE slug = 'cruise-slug';

-- Verify itinerary entries
SELECT
  i.day,
  l.name AS location_name,
  i.arrival_time,
  i.departure_time,
  i.activities,
  lt.location_type
FROM itinerary i
LEFT JOIN locations l ON i.location_id = l.id
LEFT JOIN location_types lt ON i.location_type_id = lt.id
WHERE i.trip_id = [TRIP_ID]
ORDER BY i.day;

-- Verify ship venues
SELECT sv.name, vt.venue_type
FROM ship_venues sv
JOIN venue_types vt ON sv.venue_type_id = vt.id
WHERE sv.ship_id = [SHIP_ID];

-- Verify ship amenities
SELECT sa.name, ac.category_name
FROM ship_amenities sa
JOIN amenity_categories ac ON sa.amenity_category_id = ac.id
WHERE sa.ship_id = [SHIP_ID];

-- Verify locations have images
SELECT name, image_url
FROM locations
WHERE id IN (
  SELECT DISTINCT location_id
  FROM itinerary
  WHERE trip_id = [TRIP_ID]
);
```

### Step 5.2: Visual Verification

1. **Start development server:**

   ```bash
   npm run dev
   ```

2. **Visit trip page:**

   ```
   http://localhost:3001/trip/cruise-slug
   ```

3. **Check these elements:**
   - [ ] Hero carousel displays port images
   - [ ] Trip dates are correct (no timezone shifts)
   - [ ] Itinerary shows all days correctly
   - [ ] Port names and times are accurate
   - [ ] Ship venues display correctly
   - [ ] Ship amenities display correctly
   - [ ] All images load from Supabase Storage
   - [ ] Trip status shows "Preview" badge

---

## Common Issues and Solutions

### Issue 1: Dates Are Off by One Day

**Problem:** Trip displays as Oct 11-17 instead of Oct 12-18

**Cause:** Timezone conversion is happening somewhere in the code

**Solution:**

- Dates MUST be stored as strings: `"2025-10-12 00:00:00"`
- NEVER use `new Date(dateString)` or `.toISOString()`
- Parse dates: `const [y, m, d] = date.split('-').map(Number); new Date(y, m - 1, d);`
- NO timezone conversions anywhere in the pipeline

### Issue 2: Images Not Loading

**Problem:** Images show broken or don't display

**Cause:** Using external URLs instead of Supabase Storage

**Solution:**

- ALL images must be uploaded to Supabase Storage
- Use `downloadImageFromUrl()` to download and upload external images
- Store only Supabase Storage URLs in database
- Format: `https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/[folder]/[filename]`

### Issue 3: Duplicate Itinerary Day Error

**Problem:** `duplicate key value violates unique constraint "itinerary_trip_id_day_unique"`

**Cause:** Database has unique constraint on (trip_id, day)

**Solution:**

- Use sequential day numbers: 1, 2, 3, 4, etc.
- If a cruise has multiple stops in one calendar day, use separate sequential days
- Example: Day 5 Morning Port + Day 5 Evening Port = Day 5 and Day 6

### Issue 4: Venue Type Not Found

**Problem:** Venue type ID is null or incorrect

**Cause:** Using wrong type name or ID

**Solution:**

- Valid venue types: `dining` (1), `entertainment` (2), `bar` (3), `spa` (4), `recreation` (5)
- Query venue_types table for complete list
- Use helper function to map type names to IDs

### Issue 5: Location Type Missing

**Problem:** `null value in column "location_type_id" violates not-null constraint`

**Cause:** Itinerary entry missing location_type_id

**Solution:**

- Every itinerary entry MUST have a location_type_id
- Valid types:
  - 1 = Embarkation
  - 2 = Disembarkation
  - 3 = Port of Call
  - 4 = Day at Sea
  - 11 = Overnight Arrival
  - 12 = Overnight Departure

---

## Database Schema Reference

### Key Tables and Columns

#### trips

```sql
- id (primary key)
- name (text, required)
- slug (text, required, unique)
- description (text)
- start_date (timestamp, required) -- Store as string: "2025-12-28 00:00:00"
- end_date (timestamp, required)
- hero_image_url (text) -- Supabase Storage URL only
- trip_status_id (integer, required) -- 5 = Preview, 1 = Published
- trip_type_id (integer, required) -- 1 = Cruise
- charter_company_id (integer, required)
- cruise_line_id (integer, nullable)
- ship_id (integer, nullable)
```

#### itinerary

```sql
- id (primary key)
- trip_id (integer, required, foreign key)
- day (integer, required) -- Sequential: 1, 2, 3...
- location_id (integer, nullable, foreign key)
- arrival_time (time, nullable) -- Format: "14:00:00"
- departure_time (time, nullable)
- activities (text)
- location_type_id (integer, required) -- 1=Embark, 2=Disembark, 3=Port, 4=Sea
- location_image_url (text, nullable) -- Optional itinerary-specific image

UNIQUE CONSTRAINT: (trip_id, day)
```

#### locations

```sql
- id (primary key)
- name (text, required)
- description (text)
- image_url (text) -- Supabase Storage URL only
- country_id (integer, required)
- state_province_id (integer, nullable)
```

#### ship_venues

```sql
- id (primary key)
- ship_id (integer, required, foreign key)
- name (text, required)
- venue_type_id (integer, required) -- 1=Dining, 2=Entertainment, 3=Bar, 4=Spa, 5=Recreation
- description (text)
```

#### ship_amenities

```sql
- id (primary key)
- ship_id (integer, required, foreign key)
- name (text, required)
- amenity_category_id (integer, required)
- description (text)
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

### Amenity Category IDs

```
Query amenity_categories table for current list
Common: Pool, Gym, WiFi, Dining, Entertainment
```

---

## Template Prompt for AI

Use this prompt to have an AI create a cruise import plan:

```
I need to import a new cruise into the KGay Travel Guides application.

**Cruise URL:** [Insert charter company cruise page URL]

**Instructions:**

1. Review the cruise import guide at docs/CRUISE_IMPORT_GUIDE.md
2. Extract all cruise data from the provided URL using WebFetch
3. Create a comprehensive implementation plan document similar to docs/Add Tahiti Cruise.md
4. Include all 11 steps:
   - Image downloads and uploads
   - Finding/creating cruise line and ship
   - Creating ship venues and amenities
   - Creating locations
   - Creating trip record (status = Preview)
   - Creating itinerary
   - Updating hero carousel
   - Validation queries

**Critical Requirements:**
- NO timezone conversions (store dates as timestamp strings in destination timezone)
- ALL images must be uploaded to Supabase Storage (no external URLs)
- Set trip status to Preview (ID: 5) for review
- Use sequential day numbers in itinerary (no duplicates)
- Include location_type_id for all itinerary entries
- Use ship_venues table (not venues)
- Follow exact database schema from CRUISE_IMPORT_GUIDE.md

Please create the implementation plan first, then I'll review it before we proceed with the import script.
```

---

## Checklist

Before marking a cruise import as complete:

- [ ] All images uploaded to Supabase Storage
- [ ] Trip record created with status = Preview
- [ ] Itinerary has sequential day numbers (no duplicates)
- [ ] All itinerary entries have location_type_id
- [ ] Ship venues created (using ship_venues table)
- [ ] Ship amenities created
- [ ] Locations created with Supabase image URLs
- [ ] Hero carousel updated with port images
- [ ] NO timezone conversions anywhere
- [ ] Dates stored as timestamp strings
- [ ] Database verification queries run successfully
- [ ] Visual verification completed in browser
- [ ] Trip displays correctly at /trip/[slug]
- [ ] Committed to ui-redesign branch
- [ ] Merged to main branch

---

## Version History

- **v1.0.0** (2025-01-22): Initial guide based on Tahiti cruise import process
- Created by: Claude Code AI
- Based on: New Year's Tahiti Cruise import (Trip ID: 76)

---

## Support

For issues or questions:

1. Review common issues section above
2. Check CLAUDE.md for critical rules
3. Verify database schema in docs/REFERENCE.md
4. Check Supabase logs for errors

---

**Remember:** This guide is designed to be read by both humans and AI assistants. Keep it updated as the import process evolves.
