# Add Tropical Americas Cruise - Implementation Plan

## Test Case URL

https://atlantisevents.com/vacation/tropical-americas/

## Cruise Overview

- **Name:** Tropical Americas Cruise
- **Dates:** January 15-26, 2026 (11 nights)
- **Ship:** Brilliant Lady
- **Cruise Line:** Virgin Voyages
- **Charter Company:** Atlantis Events
- **Ports:** 6 ports (Miami, Costa Maya, Puerto Limon, Colon, Cartagena, Oranjestad)
- **Days:** 12 days total (11 nights)
- **Expected Guests:** ~2,600 passengers

## Database IDs to Use

- **Charter Company ID:** 1 (Atlantis)
- **Cruise Line ID:** 1 (Virgin Voyages)
- **Ship ID:** 12 (Brilliant Lady)
- **Trip Type ID:** 1 (Cruise)
- **Trip Status ID:** 5 (Preview - for review before publishing)

## Location Details

### Locations to Create/Find

1. **Miami, Florida** (USA)
   - Description: Features South Beach, the gay district, Wynwood Arts District with 50+ galleries, renowned bars, clubs, and dining scene.
   - Image: Will use existing if available, or find suitable image
   - Country: United States

2. **Costa Maya, Mexico**
   - Description: Combination of ancient Mayan ruins, coastal villages, and natural lagoons featuring varied aquamarine waters with cultural and historical attractions.
   - Image: https://cdn.brandfolder.io/74B7KV5M/at/h6wrbhrvb65fx3mn3pmjj699/ta26-inline-costamaya-beach.jpg
   - Country: Mexico

3. **Puerto Limon, Costa Rica**
   - Description: Gateway featuring Afro-Caribbean culture, rainforests with exotic wildlife, national parks, and eco-tourism activities.
   - Image: https://cdn.brandfolder.io/74B7KV5M/at/qbtbjrv6kh76tpmn3jkp8ft/ta26-inline-guys-jungle.jpg
   - Country: Costa Rica

4. **Colon, Panama**
   - Description: Caribbean seaport at the Atlantic Ocean entrance to the Panama Canal, with historical significance as a 19th-century railroad terminus and duty-free shopping.
   - Image: https://cdn.brandfolder.io/74B7KV5M/at/knmgfzjtbq9bmt5vhnj2pv5/ta26-inline-panama-river.jpg
   - Country: Panama

5. **Cartagena, Colombia**
   - Description: UNESCO World Heritage Site featuring cobblestoned streets, colonial architecture, walled old town, and contemporary Caribbean amenities.
   - Image: https://cdn.brandfolder.io/74B7KV5M/at/srqgr7kgkzv69grqv8tvgqff/ta26-inline-cartagena-town-walking.jpg
   - Country: Colombia

6. **Oranjestad, Aruba**
   - Description: Dutch colonial influences meeting tropical landscape with powdery white beaches, crystal-clear waters, rocky northern coast with cliffs and cacti.
   - Image: https://cdn.brandfolder.io/74B7KV5M/at/wgc43qfmkwnvwgsqqwxhz/ta26-inline-aruba-flamingos.jpg
   - Country: Aruba

## Ship Venues to Create (Virgin Voyages Brilliant Lady)

All venues for ship_id = 12:

1. **Extra Virgin** (Restaurant/Dining - Type 1)
   - Description: Italian dining experience

2. **Gumbae** (Restaurant/Dining - Type 1)
   - Description: Korean BBQ experience

3. **Test Kitchen** (Restaurant/Dining - Type 1)
   - Description: Inventive tasting menu

4. **The Wake** (Restaurant/Dining - Type 1)
   - Description: Brunch and steakhouse

5. **Razzle Dazzle** (Casual Dining - Type 7)
   - Description: All-day treats and casual dining

6. **Red Room** (Entertainment - Type 2)
   - Description: Transformational space featuring drag, comedy, acrobatics, Broadway performers

7. **The Manor** (Entertainment - Type 2)
   - Description: Intimate nightclub with comedians, drag shows, specialty acts

8. **Pool Deck** (Recreation - Type 5)
   - Description: Designed for dancing and themed parties with DJs, lasers, video production

## Ship Amenities to Create

For ship_id = 12, using amenity IDs from amenities table:

1. Fitness Center (ID: 4)
2. Spa (ID: 3)
3. Pool (ID: 2)
4. Complimentary WiFi (ID: 48)

## Itinerary

| Day | Date       | Location                 | Location Type ID         | Arrival  | Departure |
| --- | ---------- | ------------------------ | ------------------------ | -------- | --------- |
| 1   | 2026-01-15 | Miami, Florida           | 1 (Embarkation)          | —        | 19:00:00  |
| 2   | 2026-01-16 | Day at Sea               | 4 (Day at Sea)           | —        | —         |
| 3   | 2026-01-17 | Costa Maya, Mexico       | 3 (Port)                 | 08:00:00 | 17:00:00  |
| 4   | 2026-01-18 | Day at Sea               | 4 (Day at Sea)           | —        | —         |
| 5   | 2026-01-19 | Puerto Limon, Costa Rica | 3 (Port)                 | 09:00:00 | 18:00:00  |
| 6   | 2026-01-20 | Colon, Panama            | 3 (Port)                 | 08:00:00 | 17:00:00  |
| 7   | 2026-01-21 | Cartagena, Colombia      | 11 (Overnight Arrival)   | 10:00:00 | —         |
| 8   | 2026-01-22 | Cartagena, Colombia      | 12 (Overnight Departure) | —        | 08:00:00  |
| 9   | 2026-01-23 | Oranjestad, Aruba        | 3 (Port)                 | 10:00:00 | 19:00:00  |
| 10  | 2026-01-24 | Day at Sea               | 4 (Day at Sea)           | —        | —         |
| 11  | 2026-01-25 | Day at Sea               | 4 (Day at Sea)           | —        | —         |
| 12  | 2026-01-26 | Miami, Florida           | 2 (Disembarkation)       | 07:00:00 | —         |

## Trip Details

- **Slug:** `tropical-americas-2026`
- **Start Date:** `2026-01-15 00:00:00` (NO timezone conversion)
- **End Date:** `2026-01-26 00:00:00` (NO timezone conversion)
- **Hero Image:** Use one of the port images (e.g., Cartagena or Aruba)
- **Description:** Experience the most exotic Caribbean cruise featuring 11 unforgettable nights aboard Virgin Voyages' Brilliant Lady. Sail from Miami to pristine ports including ancient Mayan ruins in Costa Maya, lush rainforests of Costa Rica, the historic Panama Canal gateway, UNESCO World Heritage Site Cartagena with an extended 2-day stay, and the stunning beaches of Aruba. Features signature Atlantis entertainment including themed T-dances, world-class DJs, drag performers, and Virgin Voyages' revolutionary dining and entertainment venues.

## Implementation Steps

### Step 1: Download and Upload Images

All images will be downloaded from Atlantis Events CDN and uploaded to Supabase Storage:

- Costa Maya: `ta26-inline-costamaya-beach.jpg`
- Costa Rica: `ta26-inline-guys-jungle.jpg`
- Panama: `ta26-inline-panama-river.jpg`
- Cartagena: `ta26-inline-cartagena-town-walking.jpg`
- Aruba: `ta26-inline-aruba-flamingos.jpg`

Target bucket: `images/locations/`

### Step 2: Find/Create Locations

Query existing locations first, create only if missing:

- Miami, Florida (likely exists)
- Costa Maya, Mexico
- Puerto Limon, Costa Rica
- Colon, Panama
- Cartagena, Colombia
- Oranjestad, Aruba

### Step 3: Create Ship Venues

Insert 8 venues for Brilliant Lady (ship_id = 12):

- 5 Dining venues
- 2 Entertainment venues
- 1 Recreation venue

### Step 4: Create Ship Amenities

Link existing amenities to Brilliant Lady:

- Fitness Center
- Spa
- Pool
- Complimentary WiFi

### Step 5: Create Trip Record

Insert trip with:

- Status ID: 5 (Preview)
- Charter Company ID: 1 (Atlantis)
- Cruise Line ID: 1 (Virgin Voyages)
- Ship ID: 12 (Brilliant Lady)

### Step 6: Create Itinerary

Insert 12 itinerary entries with sequential day numbers (1-12)

### Step 7: Update Hero Carousel

Add Tropical Americas port images to hero carousel component:

- File: `client/src/components/shadcn-studio/blocks/hero-section-01/hero-section-01.tsx`
- Add image array with 5+ port images
- Add slug check for `tropical-americas-2026`
- Add desktop carousel section

### Step 8: Validation

Run verification queries:

```sql
-- Verify trip
SELECT id, name, slug, start_date, end_date, trip_status_id
FROM trips
WHERE slug = 'tropical-americas-2026';

-- Verify itinerary
SELECT i.day, l.name AS location_name, i.arrival_time, i.departure_time, lt.type
FROM itinerary i
LEFT JOIN locations l ON i.location_id = l.id
LEFT JOIN location_types lt ON i.location_type_id = lt.id
WHERE i.trip_id = [TRIP_ID]
ORDER BY i.day;

-- Verify ship venues
SELECT sv.name, vt.name as venue_type
FROM ship_venues sv
JOIN venue_types vt ON sv.venue_type_id = vt.id
WHERE sv.ship_id = 12
ORDER BY sv.name;

-- Verify ship amenities
SELECT a.name
FROM ship_amenities sa
JOIN amenities a ON sa.amenity_id = a.id
WHERE sa.ship_id = 12
ORDER BY a.name;
```

## CRITICAL RULES

### 1. NO Timezone Conversions

- Store dates as: `"2026-01-15 00:00:00"` (timestamp string)
- Store times as: `"19:00:00"` (24-hour format)
- NEVER use `new Date(dateString)` or `.toISOString()`

### 2. ALL Images in Supabase Storage

- Download all external images first
- Upload to Supabase storage bucket: `images/locations/`
- Use only Supabase storage URLs in database

### 3. Trip Status

- Set to Preview (ID: 5) initially
- Change to Published (ID: 1) after verification

### 4. Database Field Naming

- Database: snake_case (`start_date`, `hero_image_url`)
- API/Frontend: camelCase (handled in transform layer)

### 5. Sequential Day Numbers

- Use day numbers 1-12 (no duplicates)
- Cartagena overnight = Day 7 (arrival) + Day 8 (departure)

### 6. Location Type IDs

- 1 = Embarkation
- 2 = Disembarkation
- 3 = Port of Call
- 4 = Day at Sea
- 11 = Overnight Arrival
- 12 = Overnight Departure

## Next Steps

1. Create import script: `scripts/import-tropical-americas.ts`
2. Execute script: `npx tsx scripts/import-tropical-americas.ts`
3. Update hero carousel component
4. Visual verification at: `/trip/tropical-americas-2026`
5. Set status to Published after approval

---

**Created:** 2025-10-22
**Status:** Planning Complete - Ready for Import Script
