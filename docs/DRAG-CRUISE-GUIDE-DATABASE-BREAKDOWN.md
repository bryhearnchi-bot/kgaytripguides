# DragStars Cruise 2025 - Database Population Breakdown

This document provides a structured template for extracting information from the DragStars Cruise Guide PDF and mapping it to the database tables.

---

## 1. TRIP INFORMATION (trips table)

**Database Table:** `trips`

**What to extract from guide:**

- Cruise name/title
- Departure date (start_date)
- Return date (end_date)
- Ship name (need ship_id from ships table)
- Overall trip description
- Hero/cover image

**Database Fields:**

```
name: "DragStars Cruise 2025" (or exact name from guide)
slug: "dragstars-cruise-2025"
start_date: "YYYY-MM-DD" (e.g., "2025-10-12")
end_date: "YYYY-MM-DD" (e.g., "2025-10-18")
ship_id: [lookup from ships table - which ship?]
trip_type_id: 1 (assuming cruise)
trip_status_id: [1=draft, 2=upcoming, 3=active, 4=completed, 5=archived]
charter_company_id: [lookup charter company - likely DragStars/Atlantis]
hero_image_url: "[Supabase storage URL]"
description: "[Main trip description from guide]"
highlights: [
  "World-class drag performances",
  "Theme parties every night",
  "Multiple ports of call",
  etc.
]
is_active: true
```

---

## 2. ITINERARY / PORTS (itinerary table)

**Database Table:** `itinerary`

**What to extract from guide:**

- Departure port and time
- Each port of call with arrival/departure times
- Days at sea
- Return port and time

**Sample Format (one row per day):**

| Day  | Date       | Location               | Arrival    | Departure | All Aboard | Type           |
| ---- | ---------- | ---------------------- | ---------- | --------- | ---------- | -------------- |
| 1    | 2025-10-12 | Port of Miami, Florida | Pre-Cruise | 17:00     | -          | Departure Port |
| 2    | 2025-10-13 | At Sea                 | -          | -         | -          | Day at Sea     |
| 3    | 2025-10-14 | Cozumel, Mexico        | 08:00      | 18:00     | 17:30      | Port of Call   |
| etc. | ...        | ...                    | ...        | ...       | ...        | ...            |

**Database Fields per row:**

```
trip_id: [ID of the DragStars cruise trip]
day: 1, 2, 3, etc.
date: "2025-10-12" (YYYY-MM-DD format - NO TIMEZONE CONVERSION)
location_name: "Port of Miami, Florida"
location_id: [lookup from locations table if exists]
location_type_id: [1=Departure Port, 2=Port of Call, 3=Day at Sea, etc.]
arrival_time: "08:00" (24-hour format, NULL for departure day/at sea)
departure_time: "17:00" (24-hour format)
all_aboard_time: "17:30" (24-hour format, usually 30 min before departure)
description: "[Any special notes about this port]"
location_image_url: "[Supabase storage URL]"
order_index: 0, 1, 2, etc.
segment: "main"
```

---

## 3. EVENTS / PARTIES / ENTERTAINMENT (events table)

**Database Table:** `events`

**What to extract from guide:**

- Each scheduled event (parties, shows, performances)
- Event name/title
- Date and time
- Performers/talent
- Venue location on ship
- Theme (if applicable)
- Description/dress code

**Sample Events Table Preview:**

| Date       | Time  | Title             | Performers               | Venue        | Type  | Theme       | Description                                                  |
| ---------- | ----- | ----------------- | ------------------------ | ------------ | ----- | ----------- | ------------------------------------------------------------ |
| 2025-10-12 | 22:00 | Sail Away Party   | DJ Tracy Young           | Pool Deck    | Party | Nautical    | Kick off the cruise with our signature sail away party       |
| 2025-10-13 | 21:00 | Drag Extravaganza | Shangela, Alyssa Edwards | Main Theater | Show  | -           | Full production drag show featuring RuPaul's Drag Race stars |
| 2025-10-13 | 23:30 | White Party       | DJ Paulo                 | Pool Deck    | Party | White Party | Dress in all white for this iconic party                     |
| 2025-10-14 | 20:00 | Comedy Show       | Bianca Del Rio           | Comedy Club  | Show  | -           | Stand-up comedy with the winner of Season 6                  |
| etc.       | ...   | ...               | ...                      | ...          | ...   | ...         | ...                                                          |

**Database Fields per event:**

```
trip_id: [ID of the DragStars cruise trip]
date: "2025-10-12" (YYYY-MM-DD - NO TIMEZONE CONVERSION)
time: "22:00" (24-hour format, e.g., 14:00 = 2 PM, 23:30 = 11:30 PM)
title: "Sail Away Party"
description: "Kick off the cruise with our signature sail away party. Dress code: Resort casual"
event_type_id: [lookup: 1=party, 2=show, 3=dining, etc.]
party_theme_id: [lookup from party_themes table, NULL if no theme]
ship_venue_id: [lookup from ship_venues for this ship]
image_url: "[Supabase storage URL for event flyer]"
talent_ids: [1, 5, 12] (array of talent IDs performing)
```

**Event Type Reference:**

- Party (themed dance parties)
- Show (drag shows, comedy, performances)
- Dining (special dinners, tea dances)
- Activity (games, contests, workshops)
- Meet & Greet (talent meet and greets)

---

## 4. TALENT / PERFORMERS (talent table)

**Database Table:** `talent`

**What to extract from guide:**

- All performers mentioned
- Their names
- What they're known for
- Profile images (if available)

**Talent List Template:**

Create one record for each NEW performer not already in the database.

**Format:**

```
name: "Shangela"
bio: "[Brief bio if available in guide]"
known_for: "RuPaul's Drag Race Season 3, All Stars, A Star Is Born"
talent_category_id: 1 (assuming 1=Drag Queen, check talent_categories)
profile_image_url: "[Supabase storage URL]"
social_links: {
  "instagram": "@itsshangelaladymusic",
  "twitter": "@itsSHANGELA"
}
website: "https://www.shangela.com"
```

**Check existing talent first:**
Run this query to see who's already in the database:

```sql
SELECT id, name FROM talent ORDER BY name;
```

**Only create NEW talent records for performers not already listed.**

---

## 5. TRIP-TALENT ASSIGNMENTS (trip_talent table)

**Database Table:** `trip_talent`

**Purpose:** Link talent to this specific trip

**For each performer appearing on the cruise:**

```
trip_id: [ID of the DragStars cruise trip]
talent_id: [ID from talent table]
notes: "[Optional: specific notes about their performance/role on this trip]"
```

---

## 6. FAQ CONTENT (faqs table)

**Database Table:** `faqs`

**What to extract from guide:**

- Common questions sections
- Any Q&A sections
- Important policies
- What to bring/pack
- Check-in procedures
- WiFi/connectivity info
- Health/safety protocols

**Sample FAQs:**

```
Q: What time is embarkation?
A: Check-in begins at 12:00 PM. All guests must be on board by 4:30 PM for our 5:00 PM departure.

Q: What is the dress code?
A: Days are resort casual. Themed parties require costumes (see party themes). No formal nights.

Q: Is WiFi available on the ship?
A: Yes, WiFi packages are available for purchase. See the guest services desk.

Q: What should I bring?
A: Costumes for theme parties, sunscreen, comfortable shoes, medications, and travel documents.
```

**Database Fields per FAQ:**

```
question: "What time is embarkation?"
answer: "Check-in begins at 12:00 PM. All guests must be on board by 4:30 PM for our 5:00 PM departure."
section_type: "trip-specific" (for DragStars-specific) OR "general" (reusable)
```

---

## 7. TRIP INFO SECTIONS (trip_info_sections table)

**Database Table:** `trip_info_sections`

**What to extract from guide:**

- Important information blocks
- Travel requirements
- Packing lists
- Pre-cruise details
- Health/safety info
- Booking/payment info

**Sample Sections:**

```
title: "Travel Documents Required"
content: "All guests must have a valid passport with at least 6 months validity..."
section_type: "trip_specific"
```

```
title: "What to Pack"
content: "- Costumes for 5 themed parties
- Sunscreen and sunglasses
- Comfortable walking shoes for port excursions..."
section_type: "trip_specific"
```

```
title: "Pre-Cruise Hotel Information"
content: "Staying in Miami before the cruise? We recommend..."
section_type: "trip_specific"
```

**Categories for sections:**

- Travel Requirements
- Packing Guide
- Pre-Cruise Info
- Health & Safety
- Payment & Cancellation
- Onboard Policies
- Shore Excursions

---

## 8. PARTY THEMES (party_themes table)

**Database Table:** `party_themes`

**What to extract from guide:**

- Each themed party name
- Description of theme
- Costume suggestions/requirements

**Sample Format:**

```
name: "White Party"
short_description: "The iconic all-white party"
long_description: "Dress to impress in your finest white attire for this legendary party under the stars..."
costume_ideas: "White pants, white shirts, white accessories. Get creative but keep it classy!"
image_url: "[Supabase storage URL]"
amazon_shopping_list_url: "[Optional shopping list link]"
```

**Common drag cruise themes:**

- White Party
- Black & White Ball
- Superhero Party
- Disco Inferno / 70s Night
- Nautical/Sailor Theme
- Beach Party
- Glow Party / Neon Night

---

## EXTRACTION CHECKLIST

Use this checklist when reviewing the PDF:

### Basic Trip Info

- [ ] Cruise name
- [ ] Start date (MM/DD/YYYY format in guide, convert to YYYY-MM-DD)
- [ ] End date
- [ ] Ship name
- [ ] Departure port
- [ ] Charter company (DragStars/Atlantis/other)
- [ ] Hero image

### Itinerary

- [ ] Day 1: Embarkation details
- [ ] Each port of call with times
- [ ] Days at sea
- [ ] Final day: Disembarkation

### Events/Entertainment

- [ ] List all scheduled events with dates/times
- [ ] Note which talent performs at each event
- [ ] Identify venues for each event
- [ ] Note any dress codes or special requirements

### Talent

- [ ] List all performers mentioned
- [ ] Cross-reference with existing talent database
- [ ] Note what they're known for

### Parties

- [ ] List all themed parties
- [ ] Theme descriptions
- [ ] Costume requirements

### FAQs

- [ ] Check-in/embarkation procedures
- [ ] What to bring/pack
- [ ] Dress codes
- [ ] WiFi/connectivity
- [ ] Health/safety protocols
- [ ] Payment/booking info

### Trip Info

- [ ] Travel document requirements
- [ ] Pre-cruise hotel info
- [ ] Shore excursion details
- [ ] Onboard policies
- [ ] Contact information

---

## IMPORTANT NOTES

### Date/Time Formatting Rules (CRITICAL!)

**From CLAUDE.md - NO TIMEZONE CONVERSIONS:**

- Store dates as: `"2025-10-12"` (YYYY-MM-DD format)
- Store times as: `"14:00"` (24-hour format, HH:MM)
- **NEVER convert to UTC or any other timezone**
- All dates/times are in the LOCAL TIMEZONE of the destination
- Example: "October 12, 2025" → `"2025-10-12"`
- Example: "2:00 PM" → `"14:00"`
- Example: "11:30 PM" → `"23:30"`

### Image Storage Rules (CRITICAL!)

**From CLAUDE.md - ALL IMAGES IN SUPABASE:**

- **NEVER use external image URLs**
- All images must be uploaded to Supabase storage
- If AI finds external images, download them first, then upload to Supabase
- Use Supabase storage URLs only
- Bucket structure: `images/trips/`, `images/talent/`, `images/events/`

### Field Naming

**API uses camelCase, Database uses snake_case:**

- Database: `start_date`, `hero_image_url`, `ship_name`
- API responses: `startDate`, `heroImageUrl`, `shipName`
- Transformation happens in the storage layer

---

## QUICK REFERENCE - TABLE RELATIONSHIPS

```
trips
├── itinerary (trip_id → trips.id)
├── events (trip_id → trips.id)
├── trip_talent (trip_id → trips.id)
├── trip_info_sections (via trip_section_assignments)
└── faqs (via trip_faq_assignments)

events
├── talent (via talent_ids array)
├── party_themes (party_theme_id → party_themes.id)
├── event_types (event_type_id → event_types.id)
└── ship_venues (ship_venue_id → ship_venues.id)

talent
├── talent_categories (talent_category_id → talent_categories.id)
└── trip_talent (talent_id → talent.id)
```

---

## NEXT STEPS

1. **Open the PDF guide** and have this document side-by-side
2. **Fill in the templates** above with actual data from the guide
3. **Take screenshots** of complex sections if needed
4. **Prepare images** - download any images you want to use
5. **Share the completed data** with me and I'll help you:
   - Upload images to Supabase storage
   - Create the database insert scripts
   - Populate the database
   - Verify everything displays correctly

---

**Need help with any section? Just ask!**
