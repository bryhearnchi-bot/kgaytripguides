# Cruise Guide PDF Import Protocol

**Purpose:** This document provides step-by-step instructions for AI agents to extract and import data from Atlantis cruise guide PDFs into the database.

**Target Audience:** AI language models processing cruise guide PDFs

---

## Required Context Before Starting

### Database Connection

- Use Supabase MCP tool: `mcp__supabase__execute_sql` with project_id: `bxiiodeyqvqqcgzzqzvt`
- Database URL: `postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres`

### Key Tables

- `trips` - Main trip records
- `itinerary` - Daily port schedule
- `events` - Entertainment schedule
- `talent` - Performers and artists
- `ship_venues` - Venue locations on ships
- `party_themes` - Theme assignments via `trip_party_themes` junction table
- `trip_info_sections` - Important information sections
- `faqs` - Frequently asked questions

---

## Step 1: Identify the Trip in Database

### 1.1 Read the PDF

- Extract: Trip name, dates, ship name, ports
- **Example from PDF page 1:** "Hong Kong to Singapore Cruise | Celebrity Solstice | November 16-28, 2025"

### 1.2 Find Trip Record

```sql
SELECT id, name, slug, start_date, end_date, ship_id
FROM trips
WHERE name ILIKE '%[destination keywords]%'
   OR slug ILIKE '%[keywords]%'
LIMIT 5;
```

**Action:** Note the `trip_id` and `ship_id` for all subsequent operations.

---

## Step 2: Verify Itinerary

### 2.1 Extract Itinerary from PDF

**Location:** Usually titled "Your Itinerary" or "Itinerary" (often page 4)

**Extract these fields:**

- Day number
- Date
- Port/Location name
- Arrival time (24-hour format: HH:MM)
- Departure time (24-hour format: HH:MM)
- Location type (port, at sea, overnight, etc.)

**Example from PDF:**

```
Day 1 | November 16 | Hong Kong | Depart 5:30 pm
Day 2 | November 17 | At Sea
Day 3 | November 18 | Halong Bay | 7 am - overnight
```

### 2.2 Query Existing Itinerary

```sql
SELECT i.id, i.day, i.date, i.location_name,
       i.arrival_time, i.departure_time, i.location_type_id
FROM itinerary i
WHERE trip_id = [trip_id]
ORDER BY i.order_index, i.day;
```

### 2.3 Compare and Report

- **If match:** Confirm "Itinerary already correct - no changes needed"
- **If differences:** Report discrepancies to user BEFORE making changes
- Convert times: "5:30 pm" → "17:30", "7 am" → "07:00"

**Critical:** Do NOT modify itinerary without explicit user approval if differences exist.

---

## Step 3: Extract and Verify Party Themes

### 3.1 Find Party Themes in PDF

**Location:** Usually titled "Party Themes" (often pages 7-8)

**Extract:**

- Theme name
- Short description
- Any dress code/costume notes

**Example:**

```
Dog Tag T-Dance - The troops come home for Atlantis' longest-running signature afternoon party.
```

### 3.2 Query Assigned Themes

```sql
SELECT pt.id, pt.name, pt.short_description, tpt.order_index
FROM party_themes pt
JOIN trip_party_themes tpt ON pt.id = tpt.party_theme_id
WHERE tpt.trip_id = [trip_id]
ORDER BY tpt.order_index;
```

### 3.3 Verify Match

- **If themes already assigned:** Confirm "All party themes already assigned correctly"
- **If missing:** Note which themes need assignment (but don't auto-assign without user approval)

---

## Step 4: Extract Entertainment Schedule

### 4.1 Locate Entertainment Pages

**Location:** Usually titled "Entertainment Preview" or "The Atlantis Experience" (pages 11-17)

**Structure:** Organized by day with event listings

### 4.2 Extract Event Data

For EACH event, extract:

| Field           | Example          | Notes                                         |
| --------------- | ---------------- | --------------------------------------------- |
| **Date**        | November 16      | Convert to YYYY-MM-DD: 2025-11-16             |
| **Time**        | 7:30 pm          | Convert to 24-hour: 19:30                     |
| **Title**       | Trinity the Tuck | Exact as shown                                |
| **Venue**       | Theater          | Map to ship venue name                        |
| **Type**        | show             | Classify as: party, show, lounge, fun, social |
| **Talent**      | Trinity the Tuck | List all performers                           |
| **Party Theme** | Dog Tag T-Dance  | Link if themed event                          |
| **Description** | Show description | Optional but helpful                          |

**Common Venues in PDF → Database Mapping:**

- "Theater" → "Solstice Theatre" (or ship's main theater name)
- "Sky Lounge" → "Sky Observation Lounge"
- "Pool Deck" → "Pool Deck"
- "Passport Bar" → "Passport Bar"
- "Atrium" → "Atrium"
- "Quasar" → "Quasar"
- "Celebrity Central" → "Celebrity Central"

**Event Type Classification:**

- **party** → Themed parties, T-Dances, dance events
- **show** → Performances, headliners, productions
- **lounge** → Piano bar, cabaret acts
- **fun** → Bingo, games, activities
- **social** → Orientations, meet-ups, gatherings

### 4.3 Create Event Extraction Table

Build a structured list like:

```
Day 1 - Sunday, Nov 16 (Hong Kong):
1. Sail-Away Party | Pool Deck | 5 pm | party | no talent
2. Trinity the Tuck | Theater | 7:30 & 10 pm | show | Trinity the Tuck
3. Mary Mac | Sky Lounge | 9 pm | show | Mary Mac
...

Day 2 - Monday, Nov 17 (At Sea):
1. Dog Tag T-Dance | Pool Deck | 4-6 pm | party | THEME: Dog Tag T-Dance
2. Rhys Nicholson | Theater | 7:30 & 10 pm | show | Rhys Nicholson
...
```

### 4.4 Handle Multiple Showtimes

**PDF shows:** "Trinity the Tuck | Theater | 7:30 & 10 pm"

**Database approach:** Create ONE event with the first showtime (19:30)

- The description can note "Multiple showtimes: 7:30 & 10 pm"

---

## Step 5: Extract and Match Talent

### 5.1 Create Talent List from Entertainment Schedule

Extract ALL unique performer names mentioned across all events.

**Example:** Trinity the Tuck, Mary Mac, Rob Houchen, Amber Iman, etc.

### 5.2 Check Existing Talent

```sql
SELECT id, name FROM talent
WHERE name IN ('Trinity the Tuck', 'Mary Mac', 'Rob Houchen', ...)
ORDER BY name;
```

### 5.3 Identify New Talent

**If talent NOT in database:**

Create list of missing talent with:

- Full name
- Role/category (comedian, vocalist, drag performer, etc.)
- Brief description from PDF

**Example:**

```
NEED TO ADD:
- Amber Iman | Vocalists | 2024 Tony nominee
- Rhys Nicholson | Comedy | Australian comedian, Drag Race Down Under judge
```

### 5.4 Research New Talent

For each NEW talent, use web search to find:

- Full professional bio (2-3 sentences)
- Known for / credentials
- Social media: Instagram (@handle), Twitter (@handle), website
- Proper talent category

**Talent Categories:**

1. Headliners
2. Vocalists
3. Drag & Variety
4. DJ's
5. Piano Bar / Cabaret
6. Comedy
7. Shows

### 5.5 Add New Talent

```sql
INSERT INTO talent (name, bio, known_for, social_links, talent_category_id)
VALUES (
  'Amber Iman',
  'Full bio here...',
  'Tony nominee, Lempicka, Goddess',
  '{"instagram": "@amberiman_", "twitter": "@amberskyez"}'::jsonb,
  2  -- Vocalists
);
```

---

## Step 6: Verify and Add Ship Venues

### 6.1 Get Existing Venues

```sql
SELECT id, name, venue_type_id
FROM ship_venues
WHERE ship_id = [ship_id]
ORDER BY name;
```

### 6.2 Check for Missing Venues

Compare PDF venue names against database results.

**Common missing venues:**

- Pool Deck (type: Recreation = 5)
- Quasar or nightclub name (type: Entertainment = 2)
- Atrium (type: Bars / Lounge = 3)
- Celebrity Central or similar (type: Entertainment = 2)

### 6.3 Add Missing Venues

```sql
INSERT INTO ship_venues (ship_id, name, venue_type_id, description)
VALUES
  (13, 'Pool Deck', 5, 'Main outdoor pool deck area for T-Dances and parties'),
  (13, 'Quasar', 2, 'Main nightclub and dance venue');
```

**Venue Type IDs:**

- Restaurant: 1
- Entertainment: 2
- Bars / Lounge: 3
- Spa: 4
- Recreation: 5
- Casual Dining: 7

---

## Step 7: Add All Events to Database

### 7.1 Get Required IDs

**Get venue IDs:**

```sql
SELECT id, name FROM ship_venues WHERE ship_id = [ship_id] ORDER BY name;
```

**Get talent IDs:**

```sql
SELECT id, name FROM talent
WHERE name IN ([all talent names from extraction])
ORDER BY name;
```

**Get event type IDs:**

```sql
SELECT id, name FROM event_types ORDER BY display_order;
```

- party: 1, show: 2, dining: 3, lounge: 4, fun: 5, club: 6, after: 7, social: 8

**Get party theme IDs (if needed):**

```sql
SELECT pt.id, pt.name
FROM party_themes pt
JOIN trip_party_themes tpt ON pt.id = tpt.party_theme_id
WHERE tpt.trip_id = [trip_id];
```

### 7.2 Insert Events

**Use migrations for large batch inserts:**

```sql
INSERT INTO events (trip_id, date, time, title, event_type_id, ship_venue_id, party_theme_id, talent_ids, description)
VALUES
(75, '2025-11-16', '17:00', 'Sail-Away Party', 1, 119, NULL, NULL, 'Description here'),
(75, '2025-11-16', '19:30', 'Trinity the Tuck', 2, 68, NULL, '[25]'::jsonb, 'RuPaul''s Drag Race winner...'),
(75, '2025-11-17', '16:00', 'Dog Tag T-Dance', 1, 119, 3, NULL, 'Atlantis'' most infamous party');
```

**Key Notes:**

- `date`: Format as 'YYYY-MM-DD'
- `time`: 24-hour format 'HH:MM'
- `talent_ids`: JSON array of talent IDs `'[25, 9]'::jsonb` or NULL
- `party_theme_id`: Only for themed events, otherwise NULL
- `description`: Use single quotes, escape apostrophes with ''

### 7.3 Organize by Day

Create separate insert statements or migration parts for each day to keep organized.

---

## Step 7B: CRITICAL - Populate trip_talent Junction Table

**⚠️ IMPORTANT: After inserting events, you MUST populate the trip_talent junction table.**

The frontend displays talent by reading from `trip_talent`, NOT directly from `events.talent_ids`.

### 7B.1 Extract Unique Talent from Events

```sql
-- Get all unique talent IDs from events for this trip
SELECT DISTINCT jsonb_array_elements_text(e.talent_ids)::int as talent_id
FROM events e
WHERE e.trip_id = 75
  AND e.talent_ids IS NOT NULL
ORDER BY talent_id;
```

### 7B.2 Populate trip_talent Table

```sql
INSERT INTO trip_talent (trip_id, talent_id, notes)
SELECT DISTINCT
  75 as trip_id,
  jsonb_array_elements_text(e.talent_ids)::int as talent_id,
  'Performing on [Trip Name]' as notes
FROM events e
WHERE e.trip_id = 75
  AND e.talent_ids IS NOT NULL
ON CONFLICT DO NOTHING;
```

### 7B.3 Verify trip_talent Population

```sql
-- Verify count matches expected talent
SELECT COUNT(*) as talent_count
FROM trip_talent
WHERE trip_id = 75;

-- Cross-check with event talent_ids
SELECT COUNT(DISTINCT jsonb_array_elements_text(talent_ids)::int) as unique_talent_in_events
FROM events
WHERE trip_id = 75 AND talent_ids IS NOT NULL;
```

**Both counts should match! If they don't, talent won't display on the trip guide.**

---

## Step 7C: CRITICAL - Add DJs to trip_talent

**⚠️ IMPORTANT: DJs are listed in the cruise guide but are NOT attached to specific events.**

DJs provide music throughout the cruise but typically don't have scheduled event slots in the entertainment schedule. They must be manually added to the `trip_talent` table.

### 7C.1 Locate DJs in PDF

**Location:** Usually titled "Our DJs" (often page 17 or in the Team Atlantis section, page 28)

**Example from PDF:**

```
Our DJs
Abel         Miami
Dan Slater   Dallas
DJ Suri      Madrid
GSP          Miami/Atlanta
```

### 7C.2 Check if DJs Already Exist in Talent Database

```sql
-- Search for DJs by name
SELECT t.id, t.name, tc.category as talent_category
FROM talent t
JOIN talent_categories tc ON t.talent_category_id = tc.id
WHERE t.name IN ('Abel', 'Dan Slater', 'DJ Suri', 'GSP')
  AND tc.category = 'DJ''s'
ORDER BY t.name;
```

### 7C.3 Add DJs to trip_talent (NOT to events)

**Key Point:** DJs are added to `trip_talent` only. They do NOT get `talent_ids` in the `events` table.

```sql
-- Add DJs to trip_talent junction table
INSERT INTO trip_talent (trip_id, talent_id, notes, created_at)
VALUES
  (75, 16, 'Performing on Hong Kong to Singapore Cruise 2025', CURRENT_TIMESTAMP),  -- Abel
  (75, 17, 'Performing on Hong Kong to Singapore Cruise 2025', CURRENT_TIMESTAMP),  -- Dan Slater
  (75, 18, 'Performing on Hong Kong to Singapore Cruise 2025', CURRENT_TIMESTAMP),  -- DJ Suri
  (75, 19, 'Performing on Hong Kong to Singapore Cruise 2025', CURRENT_TIMESTAMP)   -- GSP
ON CONFLICT DO NOTHING;
```

### 7C.4 Verify DJs Were Added

```sql
-- Verify DJs are in trip_talent
SELECT t.name, tc.category
FROM trip_talent tt
JOIN talent t ON tt.talent_id = t.id
JOIN talent_categories tc ON t.talent_category_id = tc.id
WHERE tt.trip_id = 75 AND tc.category = 'DJ''s'
ORDER BY t.name;
```

**Expected:** All DJs listed in the PDF should appear in results.

### 7C.5 If New DJs Need to Be Added to Talent Database

If any DJs don't exist in the talent database:

```sql
-- First, get the DJ category ID
SELECT id FROM talent_categories WHERE category = 'DJ''s';  -- Usually ID 4

-- Add new DJ
INSERT INTO talent (name, talent_category_id, known_for)
VALUES ('New DJ Name', 4, 'Location from PDF (e.g., Miami)')
RETURNING id;

-- Then add to trip_talent using the returned ID
INSERT INTO trip_talent (trip_id, talent_id, notes)
VALUES (75, [returned_id], 'Performing on Hong Kong to Singapore Cruise 2025');
```

---

## Step 8: Extract Info Sections (REQUIRED)

**⚠️ CRITICAL: Info sections require BOTH table inserts AND junction table assignments.**

### 8.1 Identify Important Information

**Look for sections like:**

- Embarkation Day information
- Visa requirements
- Disembarkation details
- Packing and weather advice
- Currency information
- Online registration instructions

**Example from PDF pages 5-7, 9-10, 18-21:**

- "Get Ready" → Visa info, registration, packing
- "Embarkation Day" → Port location, check-in times
- "Packing and Weather" → What to bring, temperature ranges
- "Currency and Payments" → Exchange rates, payment methods

### 8.2 Create Info Sections

```sql
INSERT INTO trip_info_sections (title, content, section_type)
VALUES
('Vietnam Visas', 'You do not need to obtain a visa in advance...', 'trip_specific'),
('Embarkation Day - November 16', 'Embarkation begins at 11 am...', 'trip_specific'),
('Packing and Weather', 'Pack for a variety of conditions...', 'trip_specific');
```

**Section Types:**

- `trip_specific` - Tied to this specific trip
- `general` - Reusable across trips (requires manual assignment)
- `always` - Auto-appears on all trips

### 8.3 CRITICAL - Assign Sections to Trip

**⚠️ The frontend reads from `trip_section_assignments`, not directly from `trip_info_sections`.**

```sql
-- Get the section IDs we just created
WITH new_sections AS (
  SELECT id, title
  FROM trip_info_sections
  WHERE title IN (
    'Vietnam Visas',
    'Thailand Visas',
    'Celebrity Online Registration',
    'Embarkation Day - November 16',
    'Packing and Weather',
    'Currency and Payments',
    'Disembarkation Day - Singapore'
  )
)
-- Create assignments to trip 75 in proper order
INSERT INTO trip_section_assignments (trip_id, section_id, order_index)
SELECT
  75 as trip_id,
  id as section_id,
  CASE title
    WHEN 'Vietnam Visas' THEN 1
    WHEN 'Thailand Visas' THEN 2
    WHEN 'Celebrity Online Registration' THEN 3
    WHEN 'Embarkation Day - November 16' THEN 4
    WHEN 'Packing and Weather' THEN 5
    WHEN 'Currency and Payments' THEN 6
    WHEN 'Disembarkation Day - Singapore' THEN 7
  END as order_index
FROM new_sections
ORDER BY order_index;
```

### 8.4 Verify Section Assignments

```sql
SELECT
  tsa.order_index,
  tis.title,
  tis.section_type,
  LENGTH(tis.content) as content_length
FROM trip_section_assignments tsa
JOIN trip_info_sections tis ON tis.id = tsa.section_id
WHERE tsa.trip_id = 75
ORDER BY tsa.order_index;
```

---

## Step 9: Assign FAQs (REQUIRED)

**⚠️ CRITICAL: FAQs require junction table assignments to display on trip guide.**

### 9.1 Check Existing General FAQs

```sql
SELECT id, question
FROM faqs
WHERE section_type = 'general'
ORDER BY id;
```

Most trips can use the existing general FAQs about travel documents, dining, smoking, WiFi, etc.

### 9.2 Assign General FAQs to Trip

**⚠️ The frontend reads from `trip_faq_assignments`, not directly from `faqs` table.**

```sql
-- Assign all general FAQs to trip 75
INSERT INTO trip_faq_assignments (trip_id, faq_id, order_index)
SELECT
  75 as trip_id,
  id as faq_id,
  ROW_NUMBER() OVER (ORDER BY id) as order_index
FROM faqs
WHERE section_type = 'general'
  AND id != 1  -- Exclude any test FAQs
ON CONFLICT DO NOTHING;
```

### 9.3 Create Trip-Specific FAQs (If Needed)

Only create new FAQs if the general ones don't cover trip-specific questions:

```sql
-- Create trip-specific FAQ
INSERT INTO faqs (question, answer, section_type)
VALUES
('What shore excursions are available?', 'Details about this specific trip...', 'general');

-- Then assign it
INSERT INTO trip_faq_assignments (trip_id, faq_id, order_index)
VALUES (75, [new_faq_id], [next_order_index]);
```

### 9.4 Verify FAQ Assignments

```sql
SELECT COUNT(*) as total_faqs_assigned
FROM trip_faq_assignments
WHERE trip_id = 75;

-- Should see 20-40 FAQs assigned
```

---

## Step 10: Final Verification

### 10.1 Verify Event Count

```sql
SELECT COUNT(*) as total_events,
       COUNT(DISTINCT date) as unique_dates,
       COUNT(CASE WHEN party_theme_id IS NOT NULL THEN 1 END) as themed_events
FROM events
WHERE trip_id = [trip_id];
```

**Expected:**

- 50-70 events typical for 7-14 day cruise
- One less day than cruise length (no events on disembarkation day)
- Number of themed events = number of party themes assigned

### 10.2 Sample Event Quality

```sql
SELECT e.title, e.date, e.time, sv.name as venue, pt.name as party_theme
FROM events e
LEFT JOIN ship_venues sv ON e.ship_venue_id = sv.id
LEFT JOIN party_themes pt ON e.party_theme_id = pt.id
WHERE e.trip_id = [trip_id]
ORDER BY e.date, e.time
LIMIT 20;
```

**Check:**

- Dates in correct format
- Times in 24-hour format
- Venues properly mapped
- Party themes linked correctly

### 10.3 Verify Talent

```sql
SELECT name FROM talent
WHERE id IN ([list of new talent IDs])
ORDER BY name;
```

### 10.4 Create Summary Report

**Report format:**

```
✅ VERIFICATION COMPLETE

Trip: Hong Kong to Singapore Cruise 2025 (ID: 75)
Dates: November 16-28, 2025
Ship: Celebrity Solstice (ID: 13)

ADDED TO DATABASE:
- 7 new talent profiles
- 4 new ship venues
- 63 entertainment events
  - 12 days with events
  - 11 themed party events

VERIFIED:
- Itinerary: Perfect match (no changes)
- Party themes: All 11 assigned correctly
- Events: All dates, times, venues correct
- Talent: All performers added with bios
- DJs: All 4 DJs added to trip_talent

✅ IMPORT COMPLETE
```

---

## Critical Rules

### DO NOT:

1. ❌ Modify itinerary without user approval if differences exist
2. ❌ Guess or hallucinate talent information - always web search for real data
3. ❌ Mix up event times - always convert to 24-hour format correctly
4. ❌ Create duplicate events for multiple showtimes (use description instead)
5. ❌ Assign party themes incorrectly - verify event name matches theme name
6. ❌ Forget to populate junction tables after inserting data

### ALWAYS:

1. ✅ Verify trip_id and ship_id before any operations
2. ✅ Double-check all extractions against PDF before inserting
3. ✅ Use proper foreign key IDs (don't insert names directly)
4. ✅ Format dates as YYYY-MM-DD and times as HH:MM
5. ✅ Escape apostrophes in SQL strings (use '')
6. ✅ Use migrations for large batch inserts
7. ✅ Provide verification queries after all inserts
8. ✅ **CRITICAL: Populate ALL junction tables (trip_talent, trip_section_assignments, trip_faq_assignments)**
9. ✅ **CRITICAL: Add DJs to trip_talent - DJs are NOT attached to events, only to the trip itself**

### TIME CONVERSION REFERENCE:

- 12:00 am (midnight) → 00:00
- 1:00 am → 01:00
- 12:00 pm (noon) → 12:00
- 1:00 pm → 13:00
- 2:00 pm → 14:00
- 5:30 pm → 17:30
- 7:30 pm → 19:30
- 11:00 pm → 23:00

---

## Example Workflow Summary

1. Read PDF → Extract trip name, dates, ship
2. Find trip_id and ship_id in database
3. Verify itinerary matches (report if different)
4. Verify party themes assigned (report if missing)
5. Extract ALL entertainment events from PDF
6. Create comprehensive event list with all details
7. Check which talent are new → Web search for bios
8. Add new talent to database
9. Check which ship venues are missing
10. Add missing venues to database
11. Get all IDs needed (venues, talent, event types, themes)
12. Insert all events using migrations
13. **⚠️ CRITICAL: Populate trip_talent junction table**
14. **⚠️ CRITICAL: Add DJs to trip_talent (DJs are NOT in events)**
15. Extract and create trip info sections
16. **⚠️ CRITICAL: Assign sections via trip_section_assignments**
17. **⚠️ CRITICAL: Assign FAQs via trip_faq_assignments**
18. Run verification queries
19. Report completion with summary

## Junction Table Checklist

Before marking the import complete, verify ALL three junction tables are populated:

```sql
-- ✅ Verify trip_talent
SELECT COUNT(*) FROM trip_talent WHERE trip_id = [trip_id];

-- ✅ Verify trip_section_assignments
SELECT COUNT(*) FROM trip_section_assignments WHERE trip_id = [trip_id];

-- ✅ Verify trip_faq_assignments
SELECT COUNT(*) FROM trip_faq_assignments WHERE trip_id = [trip_id];
```

**Expected counts:**

- trip_talent: 10-20 performers (includes DJs)
- trip_section_assignments: 5-10 info sections
- trip_faq_assignments: 20-40 FAQs

**If any count is 0, the data will NOT display on the trip guide!**

---

**Last Updated:** 2025-01-11
**Version:** 1.1
**Tested On:** Hong Kong to Singapore Cruise 2025 (Celebrity Solstice)
**Changes in v1.1:** Added Step 7C for DJ handling - DJs must be added to trip_talent but are NOT attached to events
