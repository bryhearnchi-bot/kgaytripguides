# Cruise Import Guide V2 (AI-Optimized)

**Version:** 3.2.0 - All-Aboard Times + Overnight Ports + No Location Images
**For:** AI assistants performing cruise imports
**Lines:** ~250 (vs 2500 in full guide)
**Full Guide:** See [CRUISE_IMPORT_GUIDE.md](./CRUISE_IMPORT_GUIDE.md) for detailed troubleshooting and examples

> **Key Change in V2:** Check database FIRST, research SECOND. Only research locations that need data. This saves API costs and prevents redundant work.

---

## Critical Rules (MUST FOLLOW)

### 1. NO Timezone Conversions

- Store dates as strings: `"2025-12-28 00:00:00"`
- NEVER use `new Date(dateString)` or `.toISOString()`
- Parse: `const [y, m, d] = date.split('-').map(Number); new Date(y, m - 1, d);`

### 2. Images

- **Ship images:** Upload to Supabase Storage if researching new ship
- **Hero image:** Upload to Supabase Storage
- **Location images:** ❌ DO NOT research or upload - users add manually later

### 3. Database Check BEFORE Research

- Check existing locations FIRST
- Only research what's needed (saves API costs)
- Get user approval before researching

### 4. Sea Days - Use Pre-Existing Locations (CRITICAL)

- Database has pre-created Sea Day locations: "Sea Day", "Sea Day 2", "Sea Day 3", "Sea Day 4"
- For `locationTypeId: 4` (Day at Sea), set `locationName: null`
- Script auto-assigns Sea Day locations in sequential order
- Example: 3 sea days → assigns "Sea Day", "Sea Day 2", "Sea Day 3"
- **DO NOT create new sea day locations**
- **DO NOT research sea day locations**

### 5. Field Naming

- Database: `snake_case` (`start_date`, `hero_image_url`)
- API: `camelCase` (`startDate`, `heroImageUrl`)

---

## Import Flow (13 Steps)

### Phase 1: Data Extraction & Research

**Step 1: Extract Basic Data**

- Extract cruise URL with WebFetch
- Get: name, dates, **port names only** (NO research yet)
- Get: arrival times, departure times
- **Calculate all-aboard times:** 30 minutes before each departure time
  - Example: departure 18:00 → all_aboard 17:30
- **Identify overnight ports:** Same port on 2+ consecutive days
  - Day 1 of overnight: `locationTypeId: 11` (Overnight Arrival)
  - Day 2 of overnight: `locationTypeId: 12` (Overnight Departure)
  - Example: Mykonos days 3-4 → Day 3: type 11, Day 4: type 12
- Get: **ship name and cruise line** (NO venues/amenities research yet)

**Step 2: Database Check → Research Plan → User Approval**

**A. Check Ship:**

```sql
-- Check if ship exists and has data
SELECT s.id, s.name, s.cruise_line_id,
       (SELECT COUNT(*) FROM ship_venues WHERE ship_id = s.id) as venue_count,
       (SELECT COUNT(*) FROM ship_amenities WHERE ship_id = s.id) as amenity_count
FROM ships s
WHERE s.name = 'Ship Name' AND s.cruise_line_id = (
  SELECT id FROM cruise_lines WHERE name = 'Cruise Line Name'
);
```

**B. Check Locations:**

```sql
-- Check existing locations
SELECT id, name,
       CASE WHEN top_attractions IS NOT NULL THEN 'Has attractions' ELSE 'Missing' END,
       CASE WHEN lgbt_venues IS NOT NULL THEN 'Has LGBT venues' ELSE 'Missing' END
FROM locations
WHERE name IN ('Port1', 'Port2', 'Port3');
```

Present to user:

```
📊 DATABASE CHECK RESULTS

SHIP:
✅ Oceania Riviera - EXISTS (12 venues, 8 amenities) - NO RESEARCH NEEDED
   OR
🆕 Viking Star - NOT FOUND - RESEARCH NEEDED (venues, amenities, capacity, description)

LOCATIONS:

EXISTING (complete data):
✅ Mykonos - Has attractions (3), LGBT venues (2) - NO RESEARCH NEEDED

EXISTING (incomplete data):
✅ Santorini - Has attractions (3), Missing LGBT venues - PARTIAL RESEARCH NEEDED

NEW:
🆕 Naxos - NOT FOUND - FULL RESEARCH NEEDED (description, image, attractions, LGBT venues)

RESEARCH PLAN:
Ship:
- Skip ship research (exists with complete data)
  OR
- Research ship venues and amenities

Locations:
- Skip research: 1 location (complete data)
- Partial research: 1 location (LGBT venues only)
- Full research: 1 location (all data)

Total tasks: X ship + X locations (saving X API calls)

Approve research plan? (yes/no)
```

**Step 3: Research ONLY Approved Items**

**A. Ship (if needed):**

- Ship venues (name, type, description)
- Ship amenities (name, description)
- Ship capacity
- Ship description
- Ship image URL

**B. Locations (only those needing data):**

- Top 3 attractions (with descriptions)
- Top 3 LGBT venues (with descriptions)
- Description
- ❌ **DO NOT research or upload images for locations** - Users will add manually later

**Step 4: Create Planning Doc**

- Document at `docs/Add [Cruise Name].md`

**Step 5: Present Research → User Approval**

```
📋 RESEARCH REVIEW

SHIP RESEARCH (if applicable):
Ship Name: Viking Star
Capacity: 930 passengers
Venues: 12 venues researched
  - Grand Dining Room (dining)
  - Pool Grill (dining)
  - ...
Amenities: 8 amenities researched
  - Infinity Pool
  - Spa & Wellness Center
  - ...

LOCATION RESEARCH:
[Show all research findings for locations that needed research]

Approve all research? (yes/no)
```

### Phase 2: Import Script Creation

**Prerequisites:**

- User approved research plan (Step 2)
- User approved research findings (Step 5)

**Create:** `scripts/import-[cruise-name].ts`

**Structure:**

```typescript
import 'dotenv/config'; // MUST be first line
import { downloadImageFromUrl } from '../server/image-utils';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../server/logging/logger';

const cruiseData = {
  trip: {
    name: 'Cruise Name',
    slug: 'cruise-slug',
    startDate: '2025-12-28 00:00:00', // NO timezone conversion
    endDate: '2026-01-06 00:00:00',
    statusId: 5, // Preview
    tripTypeId: 1, // Cruise
    // ... IDs from database
  },
  locations: [
    /* ONLY locations that needed research */
  ],
  itinerary: [
    {
      day: 1, // Sequential, unique
      locationName: 'Barcelona',
      arrivalTime: '14:00:00',
      departureTime: null,
      allAboardTime: null, // No departure = no all-aboard
      locationTypeId: 1, // Embarkation
      activities: 'Board ship',
    },
    {
      day: 2, // Regular port
      locationName: 'Palma',
      arrivalTime: '08:00:00',
      departureTime: '18:00:00',
      allAboardTime: '17:30:00', // 30 min before departure
      locationTypeId: 3, // Port of Call
      topAttractions: ['...'],
      lgbtVenues: ['...'],
    },
    {
      day: 3, // Overnight port - Day 1
      locationName: 'Mykonos',
      arrivalTime: '11:00:00',
      departureTime: null, // Stays overnight
      allAboardTime: null,
      locationTypeId: 11, // Overnight Arrival
      activities: 'Overnight in port',
    },
    {
      day: 4, // Overnight port - Day 2
      locationName: 'Mykonos',
      arrivalTime: null, // Already in port
      departureTime: '21:00:00',
      allAboardTime: '20:30:00', // 30 min before departure
      locationTypeId: 12, // Overnight Departure
      activities: 'Final day in port',
    },
    {
      day: 5, // Sea day
      locationName: null, // CRITICAL: Must be null for sea days
      arrivalTime: null,
      departureTime: null,
      allAboardTime: null,
      locationTypeId: 4, // Day at Sea
      activities: 'Relax and enjoy ship amenities',
      // Script will auto-assign to "Sea Day", "Sea Day 2", etc. in order
    },
  ],
  venues: [
    /* Ship venues */
  ],
  amenities: [
    /* Ship amenities */
  ],
};

async function main() {
  // 1. Self-verify extraction
  // 2. Upload images to Supabase
  // 3. Preview changes
  // 4. Get user confirmation
  // 5. Import to database (locations, trip, itinerary)
  // 6. Populate location_attractions and location_lgbt_venues tables
}
```

### Phase 3: Execution

**Step 7: Self-Verification**

- Script verifies extraction against source
- Checks dates, times, locations, research completeness
- Exits if verification fails

**Step 8: Upload Images**

- All images → Supabase Storage
- Update URLs in cruiseData

**Step 9: Preview Changes**

- Show what will be added/updated
- User must review

**Step 10: User Confirmation**

- User types "yes" to proceed
- Any other input cancels

**Step 11: Database Import**

- Create/update locations with research
  - ⚠️ **CRITICAL:** Must populate BOTH JSONB fields AND separate tables:
    - JSONB fields: `top_attractions`, `top_lgbt_venues` (arrays of strings)
    - Separate tables: `location_attractions`, `location_lgbt_venues` (normalized records)
    - Frontend reads from separate tables, NOT JSONB fields
    - Parse each string: split on " - " to get name and description
    - Assign category (Historical/Cultural/Nature) or venue_type (Bar/Club/Restaurant)
    - Insert with order_index (0, 1, 2)
- Create trip (status = Preview)
- Create itinerary
- Link venues/amenities

**Step 12: Verify in Browser**

- Check trip page
- Verify images, dates, itinerary

**Step 13: Deploy**

- Commit with detailed message
- Push to ui-redesign → merge to main

---

## Database Schema Quick Ref

### trips

```
start_date: TIMESTAMP ("2025-12-28 00:00:00")
trip_status_id: 5 (Preview)
trip_type_id: 1 (Cruise)
```

### itinerary

```
day: INTEGER (sequential, unique per trip)
location_type_id:
  1 = Embarkation
  2 = Disembarkation
  3 = Port of Call
  4 = Day at Sea
  11 = Overnight Arrival (day 1 of overnight port)
  12 = Overnight Departure (day 2 of overnight port)
arrival_time: TIME ("14:00:00")
departure_time: TIME ("18:00:00")
all_aboard_time: TIME ("17:30:00") - REQUIRED if departure_time exists (30 min before)
UNIQUE: (trip_id, day)
```

### locations

```
top_attractions: TEXT[] (array of strings)
lgbt_venues: TEXT[] (array of strings)
```

---

## Common Errors

### Dates Off by One Day

**Cause:** Timezone conversion
**Fix:** Use timestamp strings, no Date() parsing

### Duplicate Day Error

**Cause:** Two itinerary entries with same day
**Fix:** Use sequential days: 1, 2, 3, 4...

### Missing All-Aboard Times

**Problem:** Ports with departures missing all-aboard times
**Cause:** Forgot to calculate all-aboard time from departure
**Fix:**

- For ANY departure_time, calculate all_aboard_time = departure - 30 minutes
- Example: departure 18:00 → all_aboard 17:30

### Missing Attractions/LGBT Venues (NOT SHOWING ON FRONTEND)

**Problem:** Data imported but attractions/venues don't appear on location pages
**Cause:** Data only stored in JSONB fields, not in separate tables
**Fix:**

- Frontend reads from `location_attractions` and `location_lgbt_venues` tables
- Must populate separate tables, not just JSONB arrays
- Parse each string: split on " - " to get name and description
- Example code:

```typescript
const dashIndex = attraction.indexOf(' - ');
const name = dashIndex > 0 ? attraction.substring(0, dashIndex) : attraction;
const description = dashIndex > 0 ? attraction.substring(dashIndex + 3) : '';

await supabase.from('location_attractions').insert({
  location_id: locationId,
  name: name,
  description: description,
  category: 'Cultural', // or 'Historical', 'Nature'
  order_index: i,
});
```

### Overnight Ports Not Marked

**Problem:** Overnight ports showing as regular ports
**Cause:** Wrong location_type_id used
**Fix:**

- Day 1 of overnight: `locationTypeId: 11` (Overnight Arrival)
- Day 2 of overnight: `locationTypeId: 12` (Overnight Departure)
- Example: Mykonos 2 nights → Day 3: type 11, Day 4: type 12

### Sea Day Errors

**Problem:** Sea days not working or wrong locations assigned
**Cause:** locationName set instead of null, or trying to create new sea day locations
**Fix:**

- For `locationTypeId: 4`, ALWAYS set `locationName: null`
- Database has pre-created locations: "Sea Day", "Sea Day 2", "Sea Day 3", "Sea Day 4"
- Script auto-assigns in sequential order
- DO NOT create or research new sea day locations

---

## User Approval Checkpoints

1. **Step 2:** Research plan approval (BEFORE research)
2. **Step 5:** Research findings approval (BEFORE script creation)
3. **Step 10:** Database import confirmation (BEFORE database changes)

**Never skip user approvals. They prevent costly mistakes.**

---

## For Full Details

See **CRUISE_IMPORT_GUIDE.md** for:

- Detailed troubleshooting
- Complete code examples
- Database queries
- Version history
