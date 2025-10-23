# Automated Cruise Import Plan: Tahiti New Year's Eve Cruise

**Document Version:** 1.0
**Created:** October 21, 2025
**Test Case:** https://atlantisevents.com/vacation/taheatea/
**Purpose:** Define systematic process for importing cruise data from Atlantis Events URLs into KGay Travel Guides database

---

## Executive Summary

This document outlines the complete workflow for importing cruise data from external sources (Atlantis Events) into the KGay Travel Guides database. The process includes web scraping, data transformation, image handling, and database insertion while adhering to all application critical rules (especially NO timezone conversions and Supabase-only image storage).

---

## Extracted Data from Test URL

### Cruise Overview

- **Name:** New Year's Tahiti Cruise
- **Dates:** December 28, 2025 - January 6, 2026 (10 days)
- **Ship:** Oceania Riviera
- **Cruise Line:** Oceania Cruises
- **Capacity:** 1,200 passengers
- **Status:** Sold Out
- **Charter Company:** Atlantis Events

### Itinerary Summary

| Day | Date   | Port            | Arrival          | Departure           | Notes                      |
| --- | ------ | --------------- | ---------------- | ------------------- | -------------------------- |
| 1   | Dec 28 | Papeete, Tahiti | Embarkation ~2pm | Overnight           | Stays overnight            |
| 2   | Dec 29 | Moorea          | 9:00am           | 8:00pm              | Departs 4am from Papeete   |
| 3   | Dec 30 | Bora Bora       | 11:00am          | Overnight           | Overnight stay             |
| 4   | Dec 31 | Bora Bora       | -                | 9:00pm              | New Year's Eve celebration |
| 5   | Jan 1  | Raiatea         | 7:00am           | 5:00pm              |                            |
| 6   | Jan 2  | Huahine         | 7:00am           | 5:00pm              |                            |
| 7   | Jan 3  | Rangiroa        | 7:00am           | 4:00pm              |                            |
| 8   | Jan 4  | Fakarava        | 8:00am           | 7:00pm              |                            |
| 9   | Jan 5  | At Sea          | -                | -                   | Sea day                    |
| 10  | Jan 6  | Papeete, Tahiti | 1:00am           | Disembarkation ~7am |                            |

### Ship Information: Oceania Riviera

**Dining Venues (6 restaurants, no surcharges):**

- Grand Dining Room
- Polo Grill (steakhouse)
- Toscana (Italian)
- Jacques (French bistro)
- Red Ginger (Asian)
- Terrace Cafe
- La Reserve by Wine Spectator (specialty)

**Bars & Lounges (9 total):**

- Casino
- Piano Bar
- Multiple bars and lounges (names TBD from detailed scraping)

**Amenities:**

- Heated pool
- Three whirlpools
- Aquamar Spa
- Fitness center
- Theater (signature entertainment)
- Culinary Center
- Teak deck spaces

**Special Features:**

- Free house beverage package
- Complimentary WiFi
- Atlantis signature entertainment
- New Year's Eve fireworks in Bora Bora

---

## Step-by-Step Implementation Plan

### Step 1: Web Scraping & Data Extraction

**Objective:** Extract all cruise information from the Atlantis Events URL

**Required Data Points:**

1. **Trip Metadata**
   - Trip name
   - Trip subtitle (if any)
   - Start date (YYYY-MM-DD format)
   - End date (YYYY-MM-DD format)
   - Description (full text from page)
   - Highlights (bulleted features)
   - Hero image URL

2. **Ship Metadata**
   - Ship name
   - Cruise line name
   - Passenger capacity
   - Number of decks (if available)
   - Ship description
   - Ship image URL

3. **Itinerary Data**
   - For each port stop:
     - Port name
     - Country
     - Date (YYYY-MM-DD)
     - Arrival time (HH:MM in 24-hour format)
     - Departure time (HH:MM in 24-hour format)
     - All-aboard time (if specified)
     - Port description/highlights
     - Port image URL (from scrollable widget)
     - Overnight indicator (true/false)

4. **Venues & Amenities**
   - Restaurant names and types
   - Bar/lounge names
   - Spa/fitness facilities
   - Entertainment venues
   - Recreational amenities

**Technical Approach:**

```javascript
// Pseudo-code for web scraping
const extractCruiseData = async url => {
  // Use Playwright or Cheerio to fetch page
  const page = await fetchPage(url);

  // Extract structured data
  const cruiseData = {
    trip: extractTripMetadata(page),
    ship: extractShipData(page),
    itinerary: extractItinerary(page),
    venues: extractVenues(page),
    amenities: extractAmenities(page),
    images: extractAllImages(page),
  };

  return cruiseData;
};
```

**Selectors to Target (examples):**

- Trip title: `h1.cruise-title` or similar
- Description: `.description` or `p.cruise-description`
- Itinerary widget: `.itinerary-item`, `.port-stops`, etc.
- Ship details: `.ship-info`, `.vessel-details`

---

### Step 2: Image Processing & Upload to Supabase

**CRITICAL RULE:** ALL images MUST be stored in Supabase Storage. NO external URLs in database.

**Process:**

1. **Download Images**

   ```javascript
   // For each extracted image URL
   for (const imageData of extractedImages) {
     const buffer = await downloadImage(imageData.url);
     const supabaseUrl = await uploadToSupabase(buffer, imageData.type);
     imageData.supabaseUrl = supabaseUrl;
   }
   ```

2. **Image Categories & Storage Paths**
   - **Hero/Trip Image:**
     - Bucket: `images`
     - Folder: `trips/`
     - Example: `trips/tahiti-nye-cruise-hero-{uuid}.jpg`

   - **Ship Image:**
     - Bucket: `images`
     - Folder: `ships/`
     - Example: `ships/oceania-riviera-{uuid}.jpg`

   - **Port Images:**
     - Bucket: `images`
     - Folder: `locations/`
     - Example: `locations/bora-bora-{uuid}.jpg`

3. **Upload Function** (use existing `downloadImageFromUrl()`)

   ```typescript
   import { downloadImageFromUrl } from '@/server/image-utils';

   // Download and upload to Supabase
   const supabaseUrl = await downloadImageFromUrl(externalUrl, 'ships', 'oceania-riviera.jpg');
   ```

**Validation:**

- Verify image is valid (JPEG, PNG, WebP, GIF, AVIF)
- Check file size (< 5MB)
- Scan for malware (basic checks in place)
- Verify successful upload before proceeding

---

### Step 3: Cruise Line Creation/Lookup

**Database Table:** `cruise_lines`

**Process:**

1. **Check if cruise line exists:**

   ```sql
   SELECT id FROM cruise_lines WHERE name = 'Oceania Cruises';
   ```

2. **If not exists, create:**

   ```sql
   INSERT INTO cruise_lines (name)
   VALUES ('Oceania Cruises')
   RETURNING id;
   ```

3. **Store `cruise_line_id`** for ship creation

**API Implementation:**

```typescript
// Check for existing cruise line
const { data: existingCruiseLine } = await supabase
  .from('cruise_lines')
  .select('id')
  .eq('name', 'Oceania Cruises')
  .single();

let cruiseLineId;
if (existingCruiseLine) {
  cruiseLineId = existingCruiseLine.id;
} else {
  const { data: newCruiseLine } = await supabase
    .from('cruise_lines')
    .insert({ name: 'Oceania Cruises' })
    .select('id')
    .single();
  cruiseLineId = newCruiseLine.id;
}
```

---

### Step 4: Ship Creation/Lookup

**Database Table:** `ships`

**Schema Reference:**

```typescript
interface Ship {
  id: number;
  name: string;
  cruise_line_id: number;
  capacity: number;
  decks: number;
  image_url: string;
  description: text;
  deck_plans_url: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Process:**

1. **Check if ship exists:**

   ```sql
   SELECT id FROM ships WHERE name = 'Oceania Riviera';
   ```

2. **If not exists, create ship:**

   ```sql
   INSERT INTO ships (
     name,
     cruise_line_id,
     capacity,
     decks,
     image_url,
     description,
     deck_plans_url
   )
   VALUES (
     'Oceania Riviera',
     {cruise_line_id},
     1200,
     NULL, -- if not available
     {supabase_image_url},
     {description},
     NULL -- if not available
   )
   RETURNING id;
   ```

3. **Store `ship_id`** for later use

**Important Notes:**

- Ship capacity: 1,200 passengers
- Number of decks: Extract if available on page
- Deck plans URL: May not be available from Atlantis page

---

### Step 5: Venue Creation & Ship Linking

**Database Tables:**

- `venue_types` (lookup table)
- `venues`
- `ship_venues` (junction table)

**Venue Types:**

- 1 = dining
- 2 = entertainment
- 3 = bars
- 4 = spa
- 5 = recreation

**Process for Each Venue:**

1. **Check if venue exists:**

   ```sql
   SELECT id FROM venues
   WHERE name = 'Polo Grill'
   AND venue_type_id = 1;
   ```

2. **If not exists, create venue:**

   ```sql
   INSERT INTO venues (name, venue_type_id, description)
   VALUES ('Polo Grill', 1, 'Steakhouse')
   RETURNING id;
   ```

3. **Link venue to ship:**
   ```sql
   INSERT INTO ship_venues (ship_id, venue_id)
   VALUES ({ship_id}, {venue_id})
   ON CONFLICT DO NOTHING;
   ```

**Dining Venues to Create:**

- Grand Dining Room (type: dining)
- Polo Grill (type: dining, description: "Steakhouse")
- Toscana (type: dining, description: "Italian")
- Jacques (type: dining, description: "French bistro")
- Red Ginger (type: dining, description: "Asian")
- Terrace Cafe (type: dining)
- La Reserve by Wine Spectator (type: dining)

**Bar Venues to Create:**

- Casino (type: bars)
- Piano Bar (type: bars)
- [Additional bars from detailed scraping]

**Entertainment Venues:**

- Theater (type: entertainment)
- Culinary Center (type: recreation)

**Batch Implementation:**

```typescript
const venues = [
  { name: 'Grand Dining Room', type: 1 },
  { name: 'Polo Grill', type: 1, description: 'Steakhouse' },
  { name: 'Toscana', type: 1, description: 'Italian' },
  // ... etc
];

for (const venue of venues) {
  // Get or create venue
  let venueId = await getOrCreateVenue(venue);

  // Link to ship
  await linkVenueToShip(shipId, venueId);
}
```

---

### Step 6: Amenity Creation & Ship Linking

**Database Tables:**

- `amenities`
- `ship_amenities` (junction table)

**Amenities to Create:**

- Heated Pool
- Three Whirlpools
- Aquamar Spa
- Fitness Center
- Theater
- Casino
- Teak Deck Spaces
- Complimentary WiFi
- Free House Beverage Package

**Process:**

1. **For each amenity:**

   ```sql
   -- Check if exists
   SELECT id FROM amenities WHERE name = 'Heated Pool';

   -- If not exists, create
   INSERT INTO amenities (name, description)
   VALUES ('Heated Pool', NULL)
   RETURNING id;

   -- Link to ship
   INSERT INTO ship_amenities (ship_id, amenity_id)
   VALUES ({ship_id}, {amenity_id})
   ON CONFLICT DO NOTHING;
   ```

**Implementation:**

```typescript
const amenities = [
  'Heated Pool',
  'Three Whirlpools',
  'Aquamar Spa',
  'Fitness Center',
  'Theater',
  'Casino',
  'Teak Deck Spaces',
  'Complimentary WiFi',
  'Free House Beverage Package',
];

for (const amenityName of amenities) {
  const amenityId = await getOrCreateAmenity(amenityName);
  await linkAmenityToShip(shipId, amenityId);
}
```

---

### Step 7: Location Creation/Lookup

**Database Table:** `locations`

**Locations for Tahiti Cruise:**

1. Papeete, Tahiti
2. Moorea
3. Bora Bora
4. Raiatea
5. Huahine
6. Rangiroa
7. Fakarava

**Schema:**

```typescript
interface Location {
  id: number;
  name: string;
  country: string;
  description: text;
  image_url: string;
  coordinates: jsonb; // { latitude: number, longitude: number }
  timezone: string;
  metadata: jsonb;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Process for Each Location:**

1. **Check if location exists:**

   ```sql
   SELECT id FROM locations
   WHERE name = 'Bora Bora'
   AND country = 'French Polynesia';
   ```

2. **If not exists, create:**

   ```sql
   INSERT INTO locations (
     name,
     country,
     image_url,
     timezone,
     description
   )
   VALUES (
     'Bora Bora',
     'French Polynesia',
     {supabase_image_url},
     'Pacific/Tahiti',
     {description_from_page}
   )
   RETURNING id;
   ```

3. **Store `location_id` map** for itinerary creation

**All Locations:**

```typescript
const locations = [
  {
    name: 'Papeete',
    country: 'French Polynesia',
    timezone: 'Pacific/Tahiti',
    imageUrl: { supabase_url },
    description: 'Capital city of French Polynesia...',
  },
  {
    name: 'Moorea',
    country: 'French Polynesia',
    timezone: 'Pacific/Tahiti',
    imageUrl: { supabase_url },
    description: 'Sister island to Tahiti...',
  },
  // ... etc for all 7 locations
];
```

---

### Step 8: Trip Creation

**Database Table:** `trips`

**Critical Fields:**

```typescript
interface Trip {
  id: number;
  name: string;
  slug: string;
  charter_company_id: number; // Atlantis Events
  trip_type_id: number; // Cruise type
  start_date: string; // 'YYYY-MM-DD' - NO TIMEZONE CONVERSION
  end_date: string; // 'YYYY-MM-DD' - NO TIMEZONE CONVERSION
  ship_id: number;
  resort_id: null; // Must be null for cruise
  hero_image_url: string;
  description: text;
  highlights: text;
  status: 'draft' | 'published' | 'archived';
  created_at: timestamp;
  updated_at: timestamp;
}
```

**CRITICAL RULES:**

- **NO TIMEZONE CONVERSIONS:** Dates stored as strings exactly as shown
- Dec 28, 2025 stays as `'2025-12-28'` string
- **Ship OR Resort:** ship_id populated, resort_id = NULL
- **Slug generation:** Lowercase, hyphens, unique

**Process:**

1. **Generate slug:**

   ```typescript
   const slug = generateSlug("Tahiti New Year's Eve Cruise 2025");
   // Result: 'tahiti-new-years-eve-cruise-2025'
   ```

2. **Get charter company ID:**

   ```sql
   SELECT id FROM charter_companies WHERE name = 'Atlantis Events';
   ```

3. **Get trip type ID:**

   ```sql
   SELECT id FROM trip_types WHERE name = 'Cruise';
   ```

4. **Create trip:**

   ```sql
   INSERT INTO trips (
     name,
     slug,
     charter_company_id,
     trip_type_id,
     start_date,
     end_date,
     ship_id,
     resort_id,
     hero_image_url,
     description,
     highlights,
     status
   )
   VALUES (
     'Tahiti New Year''s Eve Cruise',
     'tahiti-new-years-eve-cruise-2025',
     {atlantis_id},
     {cruise_type_id},
     '2025-12-28',  -- NO CONVERSION!
     '2026-01-06',  -- NO CONVERSION!
     {ship_id},
     NULL,
     {hero_image_supabase_url},
     {description},
     {highlights},
     'draft'
   )
   RETURNING id;
   ```

5. **Store `trip_id`** for itinerary creation

**Important Notes:**

- Status starts as 'draft' for review
- Can be published after verification
- Dates are ALWAYS in destination timezone (Tahiti local time)

---

### Step 9: Itinerary Creation

**Database Table:** `itinerary`

**Schema:**

```typescript
interface ItineraryItem {
  id: number;
  trip_id: number;
  location_id: number | null;
  day_number: number;
  date: string; // 'YYYY-MM-DD' - NO TIMEZONE CONVERSION
  arrival_time: string | null; // 'HH:MM' 24-hour format
  departure_time: string | null; // 'HH:MM' 24-hour format
  all_aboard_time: string | null; // 'HH:MM' 24-hour format
  description: text;
  image_url: string;
  location_type_id: number | null;
  is_sea_day: boolean;
}
```

**CRITICAL RULES:**

- **NO TIMEZONE CONVERSIONS:** All dates/times in Tahiti local time
- **24-hour format:** "14:00" not "2:00 PM"
- **Date strings:** "2025-12-28" stored as VARCHAR, not DATE type
- **Sea days:** location_id = NULL, is_sea_day = TRUE

**Itinerary Data:**

```typescript
const itineraryItems = [
  {
    dayNumber: 1,
    date: '2025-12-28',
    locationId: { papeete_id },
    arrivalTime: '14:00', // Embarkation ~2pm
    departureTime: null, // Overnight
    allAboardTime: null,
    description: 'Embarkation day in Papeete. Overnight stay.',
    imageUrl: { papeete_image_url },
    locationTypeId: 1, // Overnight Arrival
    isSeaDay: false,
  },
  {
    dayNumber: 2,
    date: '2025-12-29',
    locationId: { papeete_id },
    arrivalTime: null,
    departureTime: '04:00', // Departs 4am
    allAboardTime: '03:30', // Estimate
    description: 'Depart Papeete early morning.',
    imageUrl: null,
    locationTypeId: 2, // Overnight Departure
    isSeaDay: false,
  },
  {
    dayNumber: 2,
    date: '2025-12-29',
    locationId: { moorea_id },
    arrivalTime: '09:00',
    departureTime: '20:00',
    allAboardTime: '19:30',
    description: 'Explore Moorea...',
    imageUrl: { moorea_image_url },
    locationTypeId: null,
    isSeaDay: false,
  },
  {
    dayNumber: 3,
    date: '2025-12-30',
    locationId: { bora_bora_id },
    arrivalTime: '11:00',
    departureTime: null, // Overnight
    allAboardTime: null,
    description: 'Arrive in Bora Bora. Overnight stay.',
    imageUrl: { bora_bora_image_url },
    locationTypeId: 1, // Overnight Arrival
    isSeaDay: false,
  },
  {
    dayNumber: 4,
    date: '2025-12-31',
    locationId: { bora_bora_id },
    arrivalTime: null,
    departureTime: '21:00', // 9pm after NYE
    allAboardTime: '20:30',
    description: "New Year's Eve celebration in Bora Bora with fireworks!",
    imageUrl: null,
    locationTypeId: 2, // Overnight Departure
    isSeaDay: false,
  },
  {
    dayNumber: 5,
    date: '2026-01-01',
    locationId: { raiatea_id },
    arrivalTime: '07:00',
    departureTime: '17:00',
    allAboardTime: '16:30',
    description: "New Year's Day in Raiatea...",
    imageUrl: { raiatea_image_url },
    locationTypeId: null,
    isSeaDay: false,
  },
  {
    dayNumber: 6,
    date: '2026-01-02',
    locationId: { huahine_id },
    arrivalTime: '07:00',
    departureTime: '17:00',
    allAboardTime: '16:30',
    description: 'Huahine port visit...',
    imageUrl: { huahine_image_url },
    locationTypeId: null,
    isSeaDay: false,
  },
  {
    dayNumber: 7,
    date: '2026-01-03',
    locationId: { rangiroa_id },
    arrivalTime: '07:00',
    departureTime: '16:00',
    allAboardTime: '15:30',
    description: 'Rangiroa atoll visit...',
    imageUrl: { rangiroa_image_url },
    locationTypeId: null,
    isSeaDay: false,
  },
  {
    dayNumber: 8,
    date: '2026-01-04',
    locationId: { fakarava_id },
    arrivalTime: '08:00',
    departureTime: '19:00',
    allAboardTime: '18:30',
    description: 'Fakarava UNESCO Biosphere Reserve...',
    imageUrl: { fakarava_image_url },
    locationTypeId: null,
    isSeaDay: false,
  },
  {
    dayNumber: 9,
    date: '2026-01-05',
    locationId: null, // Sea day
    arrivalTime: null,
    departureTime: null,
    allAboardTime: null,
    description: 'Day at sea. Enjoy ship amenities and relaxation.',
    imageUrl: null,
    locationTypeId: null,
    isSeaDay: true, // TRUE for sea days
  },
  {
    dayNumber: 10,
    date: '2026-01-06',
    locationId: { papeete_id },
    arrivalTime: '01:00', // 1am arrival
    departureTime: '07:00', // Disembarkation ~7am
    allAboardTime: null,
    description: 'Arrive back in Papeete. Disembarkation day.',
    imageUrl: null,
    locationTypeId: null,
    isSeaDay: false,
  },
];
```

**SQL Insert:**

```sql
INSERT INTO itinerary (
  trip_id,
  location_id,
  day_number,
  date,
  arrival_time,
  departure_time,
  all_aboard_time,
  description,
  image_url,
  location_type_id,
  is_sea_day
)
VALUES
  ({trip_id}, {location_id}, 1, '2025-12-28', '14:00', NULL, NULL, {desc}, {url}, 1, false),
  -- ... repeat for all 11 itinerary entries (some ports have 2 entries for overnight)
```

**Notes:**

- Some ports have **2 itinerary entries** (overnight stays: arrival + departure)
- Papeete appears 3 times: Day 1 arrival, Day 2 departure, Day 10 return
- Bora Bora has 2 entries: Day 3 arrival, Day 4 departure
- Times are in **24-hour format** ("14:00" not "2:00 PM")
- All-aboard times estimated as 30 min before departure

---

### Step 10: Data Validation

**Critical Validation Rules:**

1. **Date Format Validation:**

   ```typescript
   const isValidDate = (dateStr: string): boolean => {
     // Must match YYYY-MM-DD
     const regex = /^\d{4}-\d{2}-\d{2}$/;
     if (!regex.test(dateStr)) return false;

     // Parse WITHOUT timezone conversion
     const [y, m, d] = dateStr.split('-').map(Number);
     const date = new Date(y, m - 1, d);

     // Verify it's a valid date
     return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
   };
   ```

2. **Time Format Validation:**

   ```typescript
   const isValidTime = (timeStr: string): boolean => {
     // Must match HH:MM in 24-hour format
     const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
     return regex.test(timeStr);
   };
   ```

3. **Field Naming Validation:**

   ```typescript
   // API/Frontend uses camelCase
   const apiData = {
     startDate: '2025-12-28',
     heroImageUrl: 'https://...',
     shipName: 'Oceania Riviera',
   };

   // Database uses snake_case
   const dbData = {
     start_date: '2025-12-28',
     hero_image_url: 'https://...',
     ship_name: 'Oceania Riviera',
   };

   // Transform in storage layer
   const transformToDb = apiData => {
     return {
       start_date: apiData.startDate,
       hero_image_url: apiData.heroImageUrl,
       ship_name: apiData.shipName,
     };
   };
   ```

4. **Image URL Validation:**

   ```typescript
   const isSupabaseUrl = (url: string): boolean => {
     const supabaseUrl = process.env.SUPABASE_URL;
     return url.startsWith(`${supabaseUrl}/storage/v1/object/public/images/`);
   };

   // All image URLs MUST be Supabase storage URLs
   if (!isSupabaseUrl(heroImageUrl)) {
     throw new Error('Images must be uploaded to Supabase storage');
   }
   ```

5. **Zod Schema Validation:**

   ```typescript
   import { tripWizardSchema, itineraryEntrySchema } from '@/server/schemas/trip-wizard-schemas';

   // Validate trip data
   const validatedData = tripWizardSchema.parse(tripData);

   // Validate each itinerary entry
   itineraryEntries.forEach(entry => {
     itineraryEntrySchema.parse(entry);
   });
   ```

6. **Business Rule Validation:**
   - Trip must have EITHER ship_id OR resort_id (not both, not neither)
   - Start date must be before end date
   - Itinerary dates must be within trip date range
   - Sea days must have location_id = NULL
   - Non-sea days must have location_id populated

---

### Step 11: Database Transaction & Rollback

**Use Database Transactions:**

All inserts should be wrapped in a transaction to ensure atomicity. If any step fails, roll back all changes.

```typescript
const createCruiseFromUrl = async (url: string) => {
  // Begin transaction
  const { data, error } = await supabase.rpc('begin_transaction');

  try {
    // Step 1: Scrape data
    const cruiseData = await scrapeCruiseData(url);

    // Step 2: Download and upload images
    const images = await processImages(cruiseData.images);

    // Step 3: Create/get cruise line
    const cruiseLineId = await getOrCreateCruiseLine(cruiseData.ship.cruiseLine);

    // Step 4: Create/get ship
    const shipId = await getOrCreateShip({
      ...cruiseData.ship,
      cruiseLineId,
      imageUrl: images.ship,
    });

    // Step 5: Create/link venues
    await createVenuesForShip(shipId, cruiseData.venues);

    // Step 6: Create/link amenities
    await createAmenitiesForShip(shipId, cruiseData.amenities);

    // Step 7: Create/get locations
    const locationIds = await createLocations(cruiseData.locations, images.locations);

    // Step 8: Create trip
    const tripId = await createTrip({
      ...cruiseData.trip,
      shipId,
      heroImageUrl: images.hero,
    });

    // Step 9: Create itinerary
    await createItinerary(tripId, cruiseData.itinerary, locationIds, images.itinerary);

    // Step 10: Validate all data
    await validateTripData(tripId);

    // Commit transaction
    await supabase.rpc('commit_transaction');

    return { success: true, tripId };
  } catch (error) {
    // Rollback on any error
    await supabase.rpc('rollback_transaction');
    throw error;
  }
};
```

---

## Automation Implementation Roadmap

### Phase 1: Manual Testing (Current)

- Manually create cruise using extracted data
- Verify all relationships work correctly
- Test API endpoints with new data
- Confirm no timezone issues

### Phase 2: Semi-Automated Script

- Create CLI script: `npm run import-cruise -- --url https://...`
- Interactive prompts for ambiguous data
- Manual review before final insert
- Detailed logging of all operations

### Phase 3: API Endpoint

- Create admin endpoint: `POST /api/admin/import-cruise`
- Accept URL in request body
- Return import status and trip ID
- Support dry-run mode for preview

### Phase 4: AI Agent Integration

- Build autonomous AI agent
- Natural language processing for data extraction
- Intelligent image selection
- Automatic error handling and retry logic
- Notification system for human review

---

## API Endpoint Specification

### Endpoint: `POST /api/admin/import-cruise`

**Request Body:**

```json
{
  "url": "https://atlantisevents.com/vacation/taheatea/",
  "options": {
    "dryRun": false,
    "autoPublish": false,
    "skipImages": false,
    "overrides": {
      "charterCompanyId": 1,
      "tripTypeId": 2
    }
  }
}
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "tripId": 123,
    "slug": "tahiti-new-years-eve-cruise-2025",
    "status": "draft",
    "summary": {
      "cruise": "Tahiti New Year's Eve Cruise",
      "ship": "Oceania Riviera",
      "dates": "2025-12-28 to 2026-01-06",
      "ports": 7,
      "itineraryItems": 11,
      "venues": 15,
      "amenities": 9,
      "images": 8
    }
  },
  "message": "Cruise imported successfully"
}
```

**Response (Dry Run):**

```json
{
  "success": true,
  "dryRun": true,
  "preview": {
    "trip": {
      /* trip data */
    },
    "ship": {
      /* ship data */
    },
    "itinerary": [
      /* itinerary items */
    ],
    "venues": [
      /* venues */
    ],
    "amenities": [
      /* amenities */
    ],
    "locations": [
      /* locations */
    ],
    "images": [
      /* image URLs */
    ]
  },
  "message": "Dry run complete - no data inserted"
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Failed to scrape cruise data",
  "details": {
    "step": "web-scraping",
    "message": "Unable to extract itinerary data",
    "url": "https://atlantisevents.com/vacation/taheatea/"
  }
}
```

---

## Error Handling & Edge Cases

### Common Issues:

1. **Missing Port Images**
   - **Solution:** Use placeholder or skip image field
   - **Fallback:** Search for location images from other sources

2. **Ambiguous Arrival/Departure Times**
   - **Solution:** Prompt for human verification
   - **Fallback:** Extract from PDF itinerary if available

3. **Ship Already Exists with Different Data**
   - **Solution:** Compare and update if newer data
   - **Option:** Create new ship version with suffix (e.g., "Oceania Riviera (2025)")

4. **Location Name Variations**
   - **Example:** "Bora Bora" vs "Bora-Bora" vs "Bora Bora, French Polynesia"
   - **Solution:** Normalize location names
   - **Fuzzy matching:** Use string similarity to find existing locations

5. **Overnight Stays**
   - **Issue:** One location, two itinerary entries (arrival + departure)
   - **Solution:** Create separate entries with location_type_id set correctly

6. **Date Parsing from Different Formats**
   - **Examples:** "Dec 28", "December 28, 2025", "28/12/2025"
   - **Solution:** Use robust date parser (e.g., `date-fns/parse`)
   - **Validation:** Always output to "YYYY-MM-DD" format

7. **External Images 404 or Blocked**
   - **Solution:** Graceful degradation, skip image
   - **Retry logic:** Attempt 3 times with exponential backoff
   - **Notification:** Alert admin of missing images

---

## Testing Checklist

### Pre-Import Validation:

- [ ] URL is accessible and returns valid HTML
- [ ] Cruise data is extractable from page
- [ ] All required fields have data
- [ ] Images are downloadable
- [ ] Supabase storage is accessible

### Post-Import Validation:

- [ ] Trip created with correct dates (no timezone shift)
- [ ] Ship created/linked correctly
- [ ] All venues created and linked
- [ ] All amenities created and linked
- [ ] All locations created with images
- [ ] Itinerary has correct number of entries
- [ ] Itinerary dates match trip date range
- [ ] All images uploaded to Supabase
- [ ] No external image URLs in database
- [ ] API returns correct data (camelCase)
- [ ] Database has correct data (snake_case)

### Frontend Testing:

- [ ] Trip displays correctly on trip guide page
- [ ] Itinerary renders with all ports
- [ ] Images load from Supabase storage
- [ ] Dates display correctly (no timezone issues)
- [ ] Times display in 12-hour format for users (converted from 24-hour)
- [ ] Ship details show all venues and amenities

### Edge Case Testing:

- [ ] Overnight stays show correctly (2 entries)
- [ ] Sea days display properly (no location)
- [ ] Multiple trips on same ship (relationship intact)
- [ ] Duplicate prevention (same cruise not imported twice)
- [ ] Image upload failures handled gracefully

---

## Critical Rules Reminder

### 1. NO TIMEZONE CONVERSIONS - EVER

- ✅ Store: `"2025-12-28"` as string
- ✅ Parse: `const [y,m,d] = date.split('-').map(Number); new Date(y, m-1, d);`
- ❌ NEVER: `new Date("2025-12-28")` or `date.toISOString()`
- **Why:** Trip dates are in destination timezone, not user's browser timezone

### 2. ALL IMAGES IN SUPABASE STORAGE

- ✅ Download external images
- ✅ Upload to Supabase bucket `images/`
- ✅ Store Supabase public URL in database
- ❌ NEVER store external URLs

### 3. FIELD NAMING CONVENTIONS

- **API/Frontend:** camelCase (`startDate`, `heroImageUrl`)
- **Database:** snake_case (`start_date`, `hero_image_url`)
- **Transform in storage layer**

### 4. SQL FUNCTION SEARCH PATH

```sql
CREATE OR REPLACE FUNCTION my_function()
RETURNS TABLE(...) AS $$
BEGIN
  SET search_path = public, extensions;  -- REQUIRED!
  RETURN QUERY SELECT ...;
END;
$$ LANGUAGE plpgsql;
```

### 5. DATABASE OPERATIONS

- ✅ Use Supabase only
- ❌ NO mock data
- ❌ NO other databases

---

## Future Enhancements

### v2.0 Features:

1. **PDF Parsing:** Extract itinerary from PDF deck plans
2. **Multi-source Support:** Import from other cruise sites (RSVP, Pied Piper, etc.)
3. **Image AI Enhancement:** Auto-crop, resize, optimize images
4. **Duplicate Detection:** Fuzzy matching to prevent duplicate cruises
5. **Batch Import:** Import multiple cruises from a list of URLs
6. **Scheduled Sync:** Auto-update cruise data weekly from source URLs
7. **Change Detection:** Alert when cruise details change on source site
8. **Price Tracking:** Monitor price changes over time
9. **Availability Tracking:** Scrape sold-out status, waitlist info
10. **Social Media Integration:** Auto-post new cruises to Instagram/Facebook

### v3.0 AI Agent:

- Natural language input: "Import the Mediterranean cruise from Atlantis"
- Intelligent field mapping
- Autonomous error resolution
- Learning from corrections
- Multi-language support

---

## Appendix A: Database Schema Reference

### Tables Used:

- `trips` - Main trip data
- `ships` - Ship information
- `cruise_lines` - Cruise line lookup
- `venues` - Dining, bars, entertainment
- `venue_types` - Venue category lookup
- `amenities` - Ship amenities (pool, spa, etc.)
- `ship_venues` - Many-to-many: ships ↔ venues
- `ship_amenities` - Many-to-many: ships ↔ amenities
- `locations` - Port cities/destinations
- `itinerary` - Daily port schedule
- `location_types` - Itinerary location types (overnight arrival, etc.)

### Relationships:

```
trips
  ├─ ship_id → ships
  │            ├─ cruise_line_id → cruise_lines
  │            ├─ ship_venues → venues
  │            └─ ship_amenities → amenities
  └─ itinerary
       └─ location_id → locations
```

---

## Appendix B: Example Implementation Code

### Complete Import Function:

```typescript
import { scrapeCruiseData } from './scrapers/atlantis-scraper';
import { downloadImageFromUrl } from './image-utils';
import { supabase } from './supabase-client';
import { logger } from './logger';

export const importCruiseFromUrl = async (url: string) => {
  logger.info('Starting cruise import', { url });

  try {
    // 1. Scrape data
    const data = await scrapeCruiseData(url);

    // 2. Process images
    const heroImageUrl = await downloadImageFromUrl(
      data.heroImage,
      'trips',
      'tahiti-cruise-hero.jpg'
    );

    const shipImageUrl = await downloadImageFromUrl(
      data.ship.image,
      'ships',
      `${data.ship.name.toLowerCase().replace(/\s/g, '-')}.jpg`
    );

    // 3. Create/get cruise line
    const { data: cruiseLine } = await supabase
      .from('cruise_lines')
      .upsert({ name: data.ship.cruiseLine })
      .select('id')
      .single();

    // 4. Create/get ship
    const { data: ship } = await supabase
      .from('ships')
      .upsert({
        name: data.ship.name,
        cruise_line_id: cruiseLine.id,
        capacity: data.ship.capacity,
        image_url: shipImageUrl,
        description: data.ship.description,
      })
      .select('id')
      .single();

    // 5. Create trip
    const { data: trip } = await supabase
      .from('trips')
      .insert({
        name: data.name,
        slug: generateSlug(data.name),
        start_date: data.startDate, // NO CONVERSION!
        end_date: data.endDate, // NO CONVERSION!
        ship_id: ship.id,
        hero_image_url: heroImageUrl,
        description: data.description,
        status: 'draft',
      })
      .select('id')
      .single();

    // 6. Create itinerary
    for (const item of data.itinerary) {
      const locationImageUrl = item.image
        ? await downloadImageFromUrl(item.image, 'locations', `${item.locationName}.jpg`)
        : null;

      // Get/create location
      const { data: location } = await supabase
        .from('locations')
        .upsert({
          name: item.locationName,
          country: 'French Polynesia',
          image_url: locationImageUrl,
          timezone: 'Pacific/Tahiti',
        })
        .select('id')
        .single();

      // Create itinerary entry
      await supabase.from('itinerary').insert({
        trip_id: trip.id,
        location_id: item.isSeaDay ? null : location.id,
        day_number: item.dayNumber,
        date: item.date, // NO CONVERSION!
        arrival_time: item.arrivalTime,
        departure_time: item.departureTime,
        description: item.description,
        image_url: locationImageUrl,
        is_sea_day: item.isSeaDay,
      });
    }

    logger.info('Cruise import complete', { tripId: trip.id });
    return { success: true, tripId: trip.id };
  } catch (error) {
    logger.error('Cruise import failed', error);
    throw error;
  }
};
```

---

**END OF DOCUMENT**

_This plan will be updated as the automation process is refined and tested._
