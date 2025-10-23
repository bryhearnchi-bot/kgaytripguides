# Add Symphony Caribbean Cruise - Implementation Plan

## Test Case URL

https://atlantisevents.com/vacation/symphony-caribbean-cruise/

## Cruise Overview

- **Name:** Symphony Caribbean Cruise
- **Dates:** February 1-8, 2026
- **Duration:** 7 nights / 8 days
- **Ship:** Symphony of the Seas
- **Cruise Line:** Royal Caribbean International
- **Charter Company:** Atlantis Events
- **Departure Port:** Miami, Florida
- **Ports:** 3 ports (Labadee, San Juan, St. Maarten) + 3 sea days
- **Expected Guests:** 5,500

## Database IDs to Use

- **Charter Company ID:** 1 (Atlantis)
- **Cruise Line ID:** 2 (Royal Carribean - note DB has typo)
- **Ship ID:** Need to create - Symphony of the Seas
- **Trip Type ID:** 1 (Cruise)
- **Trip Status ID:** 5 (Preview - for review before publishing)

## Slug

`symphony-caribbean-cruise-2026`

---

## CRITICAL RULES

1. **NO Timezone Conversions**: All dates/times are in destination timezone
   - Store as strings: `"2026-02-01 00:00:00"`
   - Never use `new Date(dateString)` or `.toISOString()`

2. **ALL Images in Supabase Storage**: No external URLs
   - Download external images first
   - Upload to appropriate Supabase bucket
   - Use only Supabase Storage URLs in database

3. **Image Priority System**:
   - **Location images** (`locations.image_url`): DEFAULT image for a location
   - **Itinerary images** (`itinerary.location_image_url`): OPTIONAL override for specific entry
   - Hero carousel automatically uses images based on priority

4. **Trip Status**: Set to Preview (ID: 5) initially

5. **Database Field Naming**:
   - Database: snake_case (`start_date`, `hero_image_url`)
   - API/Frontend: camelCase (`startDate`, `heroImageUrl`)

---

## Implementation Steps

### Step 1: Create Ship Record

**Ship:** Symphony of the Seas

- **Cruise Line ID:** 2 (Royal Carribean)
- **Capacity:** 5,500
- **Decks:** 17
- **Description:** The world's largest cruise ship, Symphony of the Seas features 17 decks across 7 distinct neighborhoods including Central Park, the Aqua Theater, ice rink, FlowRider surfing simulators, rock climbing wall, and zip line.

**Ship Image:**

- Source: Find official Royal Caribbean image
- Upload to: `images/ships/`
- Filename: `symphony-of-the-seas.jpg`

### Step 2: Create Ship Venues

| Venue Name          | Type              | Description                                                                                                                      |
| ------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Main Theater        | Entertainment (2) | Three-story main theater with 1,300 seats featuring Atlantis signature performers, special guests, and dazzling production shows |
| Aqua Theater        | Entertainment (2) | Choreographed dive show with high-diving acrobatics and aquatic performances                                                     |
| Studio B            | Entertainment (2) | Ice-skating show venue and themed dance events space                                                                             |
| Comedy Club         | Entertainment (2) | Featuring Gay Comedy All-Stars                                                                                                   |
| Dazzles             | Entertainment (2) | Drag performances and live singers                                                                                               |
| Central Park        | Recreation (5)    | Lush garden neighborhood with real plants and trees                                                                              |
| The Rising Tide Bar | Bars / Lounge (3) | Unique moving bar that travels between decks                                                                                     |
| Pool Deck Nightclub | Entertainment (2) | Massive outdoor nightclub with walls of video, lasers, and dazzling lighting                                                     |

### Step 3: Create Ship Amenities

Use existing amenity IDs from database:

- Pool (ID: 2)
- Spa (ID: 3)
- Fitness Center (ID: 4)
- Theater (ID: 11)
- Rock Climbing (ID: 19)
- Zip Line (ID: 20)
- Ice Rink (create new if doesn't exist)
- FlowRider (create new if doesn't exist)

### Step 4: Create/Find Locations

#### Location 1: Miami (EXISTING - ID: 69)

- **Status:** Already exists in database
- **Action:** Use existing location ID 69

#### Location 2: Labadee, Haiti (NEW)

- **Name:** Labadee
- **Country:** Haiti
- **Description:** Royal Caribbean's private beach paradise in Haiti, offering pristine beaches, the Dragon's Breath zip line, water sports, and tropical relaxation.
- **Image:** Find image of Labadee beach
- **Upload to:** `images/locations/`
- **Filename:** `labadee-haiti.jpg`

#### Location 3: San Juan, Puerto Rico (NEW - likely exists, check first)

- **Name:** San Juan
- **Country:** Puerto Rico (or United States - check DB)
- **State/Province:** Puerto Rico
- **Description:** Historic colonial city with colorful streets, El Morro fortress, vibrant Old Town, and access to El Yunque rainforest.
- **Image:** Find image of Old San Juan
- **Upload to:** `images/locations/`
- **Filename:** `san-juan-puerto-rico.jpg`

#### Location 4: St. Maarten (NEW - likely exists, check first)

- **Name:** St. Maarten
- **Country:** Sint Maarten / Saint Martin
- **Description:** Dual-nation Caribbean island famous for Orient Beach, Maho Beach plane watching, duty-free shopping in Philipsburg, and beautiful beaches.
- **Image:** Find image of St. Maarten beach or Maho Beach
- **Upload to:** `images/locations/`
- **Filename:** `st-maarten.jpg`

### Step 5: Create Trip Record

```typescript
{
  name: "Symphony Caribbean Cruise",
  slug: "symphony-caribbean-cruise-2026",
  description: "The World's Biggest Gay Festival at Sea! Join 5,500 guests aboard the largest ship ever to host an all-gay cruise - Royal Caribbean's Symphony of the Seas. Experience 7 nights of non-stop entertainment including headliners Kerry Ellis, Shangela, and Dylan Mulvaney, world-class DJs, spectacular production shows, the White Party, and endless pool deck celebrations. Explore stunning Caribbean ports including Labadee's private beach paradise, historic San Juan, and beautiful St. Maarten.",
  startDate: "2026-02-01 00:00:00", // NO timezone conversion
  endDate: "2026-02-08 00:00:00",
  heroImageUrl: "", // Will be populated with ship or destination image
  tripStatusId: 5, // Preview
  tripTypeId: 1, // Cruise
  charterCompanyId: 1, // Atlantis
  cruiseLineId: 2, // Royal Carribean
  shipId: [NEW_SHIP_ID], // From Step 1
}
```

### Step 6: Create Itinerary

**IMPORTANT:** Sequential day numbers (1, 2, 3, 4, 5, 6, 7, 8)

| Day | Date       | Location              | Location Type ID   | Arrival | Departure | Activities                                                                                                                                                 |
| --- | ---------- | --------------------- | ------------------ | ------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 2026-02-01 | Miami                 | 1 (Embarkation)    | —       | 16:30     | Embarkation day. Board the ship and get ready for an amazing week!                                                                                         |
| 2   | 2026-02-02 | Day at Sea            | 4 (Day at Sea)     | —       | —         | Full day at sea! Enjoy T-dance, pool deck parties, shows, FlowRider, rock climbing, and explore the ship.                                                  |
| 3   | 2026-02-03 | Labadee, Haiti        | 3 (Port)           | 09:00   | 16:30     | Private beach paradise! Zip-lining on Dragon's Breath, water sports, beach relaxation, and tropical drinks.                                                |
| 4   | 2026-02-04 | San Juan, Puerto Rico | 3 (Port)           | 14:00   | 21:00     | Explore colorful Old Town, visit El Morro fortress, or venture to El Yunque rainforest. Evening departure allows time for dinner in the historic district. |
| 5   | 2026-02-05 | St. Maarten           | 3 (Port)           | 09:00   | 19:00     | Beach day at famous Orient Beach, plane watching at Maho Beach, or duty-free shopping in Philipsburg.                                                      |
| 6   | 2026-02-06 | Day at Sea            | 4 (Day at Sea)     | —       | —         | Enjoy spa treatments, pool activities, FlowRider surfing, ice skating show, and Aqua Theater performances.                                                 |
| 7   | 2026-02-07 | Day at Sea            | 4 (Day at Sea)     | —       | —         | Final day at sea! White Party, farewell shows, pool deck celebrations, and last-minute shopping.                                                           |
| 8   | 2026-02-08 | Miami                 | 2 (Disembarkation) | 07:00   | —         | Disembarkation. No flights before 10:00 AM recommended.                                                                                                    |

**Notes:**

- All times in destination local timezone
- Use location_id from Step 4 for each port
- location_type_id: 1=Embarkation, 2=Disembarkation, 3=Port, 4=Day at Sea
- Sequential day numbers (no duplicates)

### Step 7: Add Talent (Optional - can be added later)

Featured performers mentioned:

- Kerry Ellis
- Shangela
- Dylan Mulvaney
- Markus Schulz (past performer)
- Above & Beyond
- Oliver Heldens
- R3HAB
- Paul Van Dyk
- Cosmic Gate
- Galantis

**Action:** Can be added after trip is created using the Talent management interface.

### Step 8: Update Hero Carousel

**Good news!** The hero carousel is now **fully automatic**. It will:

1. Fetch itinerary data from the API
2. Extract port images using the priority system (itinerary → location)
3. Display them automatically in the carousel

**No manual code changes needed!** Just ensure locations have images in Step 4.

### Step 9: Validation Queries

After import, run these queries to verify:

```sql
-- Verify trip was created
SELECT id, name, slug, start_date, end_date, trip_status_id
FROM trips
WHERE slug = 'symphony-caribbean-cruise-2026';

-- Verify itinerary entries (should be 8 days)
SELECT
  i.day,
  COALESCE(l.name, 'Day at Sea') AS location_name,
  i.arrival_time,
  i.departure_time,
  lt.type as location_type
FROM itinerary i
LEFT JOIN locations l ON i.location_id = l.id
LEFT JOIN location_types lt ON i.location_type_id = lt.id
WHERE i.trip_id = [TRIP_ID]
ORDER BY i.day;

-- Verify ship venues (should be 8+)
SELECT sv.name, vt.name as venue_type
FROM ship_venues sv
JOIN venue_types vt ON sv.venue_type_id = vt.id
WHERE sv.ship_id = [SHIP_ID];

-- Verify ship amenities
SELECT a.name
FROM ship_amenities sa
JOIN amenities a ON sa.amenity_id = a.id
WHERE sa.ship_id = [SHIP_ID];

-- Verify locations have images
SELECT name, image_url, country
FROM locations
WHERE id IN (
  SELECT DISTINCT location_id
  FROM itinerary
  WHERE trip_id = [TRIP_ID]
  AND location_id IS NOT NULL
);
```

### Step 10: Visual Verification Checklist

Start dev server and visit: `http://localhost:3001/trip/symphony-caribbean-cruise-2026`

- [ ] Hero carousel displays port images automatically
- [ ] Trip name and dates correct (Feb 1-8, 2026)
- [ ] 8-day itinerary displays correctly
- [ ] Port names and times accurate
- [ ] Day at Sea entries display properly
- [ ] Ship image displays
- [ ] Ship venues show correctly
- [ ] Ship amenities display
- [ ] All images load from Supabase Storage (no broken images)
- [ ] Trip status shows "Preview" badge
- [ ] No timezone shifts in dates

---

## Image URLs to Download

### Ship Images

1. **Symphony of the Seas Hero:**
   - Find official Royal Caribbean image
   - Suggested: Aerial shot or profile view
   - Upload as: `symphony-of-the-seas.jpg`

### Location Images

2. **Labadee, Haiti:**
   - Private beach or zip line
   - Upload as: `labadee-haiti.jpg`

3. **San Juan, Puerto Rico:**
   - Old San Juan colorful buildings or El Morro
   - Upload as: `san-juan-puerto-rico.jpg`

4. **St. Maarten:**
   - Beach scene (Orient Beach or Maho Beach)
   - Upload as: `st-maarten.jpg`

**Note:** Miami already has an image (existing location ID: 69)

---

## Special Notes

### White Party

- Mentioned in marketing as a signature event
- Can be added to events table after trip creation
- Date: Likely Day 7 (Feb 7) evening

### Music Lineup

- Concert series features EDM/electronic artists
- Can add as events or talent later

### Atlantis Signature Features

- T-dances (afternoon pool deck events)
- Production shows in main theater
- Aqua Theater dive shows
- Ice skating performances
- Pool deck nightclub with lasers and video walls

---

## Next Steps

1. ✅ Planning document created
2. ⏳ Create import script: `scripts/import-symphony-caribbean.ts`
3. ⏳ Execute import script
4. ⏳ Verify in database
5. ⏳ Test in browser
6. ⏳ Set status to Published (if approved)

---

## Estimated Timeline

- Script creation: 30 minutes
- Image sourcing and upload: 30 minutes
- Script execution: 5 minutes
- Verification: 15 minutes
- **Total:** ~1.5 hours

---

_Created: 2025-10-22_
_Status: Planning Complete - Ready for Import Script_
