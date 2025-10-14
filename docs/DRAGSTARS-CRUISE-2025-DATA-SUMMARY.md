# DragStars Cruise 2025 - Complete Data Extraction & Database Mapping

**Source:** DS25-Cruise-Vacation-Guide-final.pdf
**Extracted:** 2025
**Status:** Ready for database population

---

## EXECUTIVE SUMMARY

This document contains ALL extracted information from the DragStars Cruise 2025 guide, organized by database table with exact data ready for insertion.

---

## 1. TRIP INFORMATION (trips table)

### Basic Trip Details

```sql
name: "DragStars Cruise 2025"
slug: "dragstars-cruise-2025"
start_date: "2025-10-15"
end_date: "2025-10-19"
ship_id: [Need to lookup: Virgin Voyages Valiant Lady]
trip_type_id: 1 (Cruise)
trip_status_id: 2 (Upcoming)
charter_company_id: [Need to confirm: DragStars or Atlantis Events]
hero_image_url: "[Upload cover image from guide to Supabase]"
description: "Experience a revolution in fun on the high seas aboard Virgin Voyages Valiant Lady. DragStars presents world-class drag entertainers, themed parties, and nonstop entertainment sailing from Miami to Key West and Bimini."
is_active: true
```

### Trip Highlights (highlights JSON field)

```json
[
  "World-class drag performances from RuPaul's Drag Race stars",
  "Three themed evening parties: Wig Party, Halloween Preview, Scarlet Night",
  "Intimate venues including Red Room, The Manor, and Social Club",
  "Key West and Bimini port visits",
  "Virgin Voyages' revolutionary adult-only cruise experience",
  "No formal dress code - casual and comfortable",
  "All dining included at multiple specialty restaurants"
]
```

---

## 2. ITINERARY (itinerary table)

| Day | Date       | Location          | Arrive | Depart | All Aboard | Location Type  | Description                                          |
| --- | ---------- | ----------------- | ------ | ------ | ---------- | -------------- | ---------------------------------------------------- |
| 1   | 2025-10-15 | Miami, Florida    | -      | 18:00  | -          | Departure Port | Embarkation starts at 13:30. Terminal V, Port Miami. |
| 2   | 2025-10-16 | Slay Day at Sea   | -      | -      | -          | Day at Sea     | Full day of entertainment, shows, and activities     |
| 3   | 2025-10-17 | Key West, Florida | 08:00  | 17:00  | 16:30      | Port of Call   | Historic island with LGBT venues and attractions     |
| 4   | 2025-10-18 | Bimini, Bahamas   | 09:00  | 18:00  | 17:30      | Port of Call   | Beach resort destination, Beach Games at 12:00       |
| 5   | 2025-10-19 | Miami, Florida    | 07:00  | -      | -          | Return Port    | Disembarkation until 10:30 AM                        |

**Database Format:**

```sql
-- Day 1
trip_id: [dragstars-cruise-2025 ID]
day: 1
date: "2025-10-15"
location_name: "Miami, Florida"
location_id: [lookup Miami in locations table]
location_type_id: 1 (Departure Port)
arrival_time: NULL
departure_time: "18:00"
all_aboard_time: NULL
description: "Embarkation starts at 1:30 PM. Terminal V, 718 N Cruise Blvd, Miami, FL 33132. Check-in open until 5:00 PM."
order_index: 0
segment: "main"

-- Day 2
trip_id: [dragstars-cruise-2025 ID]
day: 2
date: "2025-10-16"
location_name: "Slay Day at Sea"
location_id: NULL
location_type_id: 3 (Day at Sea)
arrival_time: NULL
departure_time: NULL
all_aboard_time: NULL
description: "Full day of drag entertainment, shows, games, and activities at sea."
order_index: 1
segment: "main"

-- Day 3
trip_id: [dragstars-cruise-2025 ID]
day: 3
date: "2025-10-17"
location_name: "Key West, Florida"
location_id: [lookup Key West in locations table]
location_type_id: 2 (Port of Call)
arrival_time: "08:00"
departure_time: "17:00"
all_aboard_time: "16:30"
description: "Explore historic Key West with its vibrant LGBT scene and cultural attractions."
order_index: 2
segment: "main"

-- Day 4
trip_id: [dragstars-cruise-2025 ID]
day: 4
date: "2025-10-18"
location_name: "Bimini, Bahamas"
location_id: [lookup Bimini in locations table]
location_type_id: 2 (Port of Call)
arrival_time: "09:00"
departure_time: "18:00"
all_aboard_time: "17:30"
description: "Beautiful Bahamian beach resort. Beach Games on shore at 12:00 PM."
order_index: 3
segment: "main"

-- Day 5
trip_id: [dragstars-cruise-2025 ID]
day: 5
date: "2025-10-19"
location_name: "Miami, Florida"
location_id: [lookup Miami in locations table]
location_type_id: 4 (Return Port)
arrival_time: "07:00"
departure_time: NULL
all_aboard_time: NULL
description: "Disembarkation begins at 7:00 AM, hotel-style checkout until 10:30 AM. Do not book flights before 11:00 AM."
order_index: 4
segment: "main"
```

---

## 3. EVENTS / ENTERTAINMENT SCHEDULE (events table)

### WEDNESDAY, OCTOBER 15 (Miami - Embarkation)

| Time  | Event                | Venue        | Type         | Performers         | Description                                                      |
| ----- | -------------------- | ------------ | ------------ | ------------------ | ---------------------------------------------------------------- |
| 17:00 | Sailaway Party       | Aquatic Club | Party        | -                  | Party on the pool deck as we sail away from Miami!               |
| 17:30 | Meet Our Stars       | Aquatic Club | Meet & Greet | All Stars          | Meet the DragStars talent                                        |
| 19:30 | Bob the Drag Queen   | Red Room     | Show         | Bob the Drag Queen | Legendary Drag Race winner, Madonna tour guest star. First show. |
| 21:00 | Nurse Jackie         | The Manor    | Show         | Jackie Cox         | Drag Race fan favorite with brand new medical-themed show        |
| 22:00 | Bob the Drag Queen   | Red Room     | Show         | Bob the Drag Queen | Second showing                                                   |
| 22:00 | Karaoke with Plasma! | Social Club  | Activity     | Plasma             | Interactive karaoke                                              |
| 23:00 | Mirage               | The Manor    | Show         | Mirage             | "Legs of Las Vegas" showgirl performance                         |
| 23:00 | Welcome Wig Party    | Aquatic Club | Party        | -                  | Wigstock-inspired party. Wigs optional!                          |

### THURSDAY, OCTOBER 16 (Slay Day at Sea)

| Time  | Event                     | Venue         | Type         | Performers        | Description                                             |
| ----- | ------------------------- | ------------- | ------------ | ----------------- | ------------------------------------------------------- |
| 11:00 | Drag Brunch               | Razzle Dazzle | Dining       | Multiple          | Drag brunch experience                                  |
| 14:00 | Drag Bingo                | Red Room      | Activity     | Mirage & The Diva | Interactive bingo with prizes                           |
| 16:00 | Kiki with the Stars (Q&A) | Red Room      | Meet & Greet | All Stars         | Question and answer session                             |
| 17:00 | Drag Fashion Show Contest | Aquatic Club  | Activity     | -                 | Guest fashion show competition                          |
| 19:30 | Sugar & Spice             | Red Room      | Show         | Sugar & Spice     | Twin drag duo with interactive competition              |
| 21:00 | Symone                    | The Manor     | Show         | Symone            | "The Ebony Enchantress" performance                     |
| 22:00 | Alyssa Edwards            | Red Room      | Show         | Alyssa Edwards    | RuPaul's Drag Race Global All-Stars winner storytelling |
| 22:00 | Karaoke with Jackie Cox   | Social Club   | Activity     | Jackie Cox        | Interactive karaoke                                     |
| 23:00 | Plasma                    | The Manor     | Show         | Plasma            | Broadway beltress performs Barbra Streisand tribute     |
| 23:00 | Halloween Preview Party   | Aquatic Club  | Party        | -                 | Showcase ghoulish fashion and holiday looks             |

### FRIDAY, OCTOBER 17 (Key West)

| Time  | Event                         | Venue        | Type         | Performers       | Description                                       |
| ----- | ----------------------------- | ------------ | ------------ | ---------------- | ------------------------------------------------- |
| 18:00 | Kiki with the Stars (Q&A)     | Red Room     | Meet & Greet | All Stars        | Question and answer session                       |
| 19:00 | Live Podcast w/ Sugar & Spice | The Manor    | Show         | Sugar & Spice    | Live podcast recording                            |
| 19:30 | Trinity The Tuck              | Red Room     | Show         | Trinity The Tuck | "The best tuck in the business, Live!" First show |
| 21:00 | Mirage                        | The Manor    | Show         | Mirage           | Showgirl performance                              |
| 22:00 | Trinity The Tuck              | Red Room     | Show         | Trinity The Tuck | Second showing                                    |
| 22:00 | Karaoke with Trinity Monroe   | Social Club  | Activity     | Trinity Monroe   | Interactive karaoke                               |
| 22:30 | Sugar & Spice                 | Aquatic Club | Party        | Sugar & Spice    | Pool deck performance                             |
| 23:00 | Scarlet Night                 | Aquatic Club | Party        | -                | Red-themed party. Wear your brightest red outfit! |

### SATURDAY, OCTOBER 18 (Bimini)

| Time  | Event                     | Venue       | Type         | Performers     | Description                                           |
| ----- | ------------------------- | ----------- | ------------ | -------------- | ----------------------------------------------------- |
| 12:00 | Beach Games on Bimini     | Ashore      | Activity     | -              | Beach games and activities on Bimini                  |
| 18:00 | Kiki with the Stars (Q&A) | Red Room    | Meet & Greet | All Stars      | Question and answer session                           |
| 19:00 | Make-Up Contest           | The Manor   | Activity     | -              | Guest makeup competition                              |
| 19:30 | Bianca Del Rio            | Red Room    | Show         | Bianca Del Rio | Comedy show from "Dead Inside" world tour. First show |
| 21:00 | Nurse Jackie              | The Manor   | Show         | Jackie Cox     | Medical-themed drag show                              |
| 22:00 | Bianca Del Rio            | Red Room    | Show         | Bianca Del Rio | Second showing                                        |
| 22:00 | Karaoke with Lana Ja'Rae  | Social Club | Activity     | Lana Ja'Rae    | Interactive karaoke                                   |

**Database Insert Format (Sample):**

```sql
-- Sailaway Party
trip_id: [dragstars-cruise-2025 ID]
date: "2025-10-15"
time: "17:00"
title: "Sailaway Party"
description: "Party on the pool deck as we sail away from Miami! Kick off the cruise with music, drinks, and celebration."
event_type_id: 1 (Party)
party_theme_id: NULL
ship_venue_id: [Aquatic Club venue ID]
image_url: NULL
talent_ids: []

-- Bob the Drag Queen (First Show)
trip_id: [dragstars-cruise-2025 ID]
date: "2025-10-15"
time: "19:30"
title: "Bob the Drag Queen"
description: "Legendary Drag Race winner, sidekick and guest star for Madonna's Celebration tour. Bob the Drag Queen does it all, and this superstar delivers the perfect start!"
event_type_id: 2 (Show)
party_theme_id: NULL
ship_venue_id: [Red Room venue ID]
image_url: NULL
talent_ids: [Bob the Drag Queen ID]

-- Welcome Wig Party
trip_id: [dragstars-cruise-2025 ID]
date: "2025-10-15"
time: "23:00"
title: "Welcome Wig Party"
description: "Channel the zany vibrant energy of Wigstock – the original drag festival for our first night together. Join our queens on the top decks and don your favorite wig – or not – and for a few hours of musical madness."
event_type_id: 1 (Party)
party_theme_id: [Welcome Wig Party theme ID]
ship_venue_id: [Aquatic Club venue ID]
image_url: NULL
talent_ids: []
```

---

## 4. TALENT / PERFORMERS (talent table)

### Headlining Stars (Create NEW records for any not in database)

**Check existing database first with:**

```sql
SELECT id, name FROM talent WHERE name IN (
  'Alyssa Edwards', 'Bianca Del Rio', 'Bob the Drag Queen',
  'Jackie Cox', 'Mirage', 'Plasma', 'Sugar & Spice',
  'Symone', 'Trinity The Tuck', 'House Of Avalon'
);
```

### Talent Details:

**1. Alyssa Edwards**

```sql
name: "Alyssa Edwards"
bio: "From a small town in Mesquite, Texas to the greatest worldwide stage drag has ever seen. Winner of RuPaul's Drag Race Global All-Stars."
known_for: "RuPaul's Drag Race, Dancing Queen, Global All-Stars Winner"
talent_category_id: 1 (Drag Queen)
profile_image_url: "[Upload to Supabase storage]"
```

**2. Bianca Del Rio**

```sql
name: "Bianca Del Rio"
bio: "Legendary Drag Race winner, dubbed 'the Joan Rivers of the drag world'. Has sold out Carnegie Hall and Wembley Arena with hilarious comedy."
known_for: "RuPaul's Drag Race Season 6 Winner, Dead Inside World Tour, Comedy"
talent_category_id: 1 (Drag Queen)
profile_image_url: "[Upload to Supabase storage]"
```

**3. Bob the Drag Queen**

```sql
name: "Bob the Drag Queen"
bio: "Legendary Drag Race winner, sidekick and guest star for Madonna's Celebration tour."
known_for: "RuPaul's Drag Race Season 8 Winner, Madonna Celebration Tour, We're Here"
talent_category_id: 1 (Drag Queen)
profile_image_url: "[Upload to Supabase storage]"
```

**4. Jackie Cox**

```sql
name: "Jackie Cox"
bio: "Drag Race fan favorite known for theatrical performances and political activism."
known_for: "RuPaul's Drag Race Season 12, Nurse Jackie Show"
talent_category_id: 1 (Drag Queen)
profile_image_url: "[Upload to Supabase storage]"
```

**5. Mirage**

```sql
name: "Mirage"
bio: "Sensational queen and captivating showgirl, blending stripper heels and moves, earning the title of the 'Legs of Las Vegas.'"
known_for: "Las Vegas Showgirl, Performance Artist"
talent_category_id: 1 (Drag Queen)
profile_image_url: "[Upload to Supabase storage]"
```

**6. Plasma**

```sql
name: "Plasma"
bio: "After fabulously portraying Babs on RuPaul's Drag Race, Plasma discovered she's the greatest star. Broadway beltress performing Barbra Streisand tribute."
known_for: "RuPaul's Drag Race, Broadway, Barbra Streisand Tribute"
talent_category_id: 1 (Drag Queen)
profile_image_url: "[Upload to Supabase storage]"
```

**7. Sugar & Spice**

```sql
name: "Sugar & Spice"
bio: "Your favorite twin drag duo delivering fierce performances and interactive competitions."
known_for: "RuPaul's Drag Race, Twin Drag Duo, Live Podcast"
talent_category_id: 1 (Drag Queen)
profile_image_url: "[Upload to Supabase storage]"
```

**8. Symone**

```sql
name: "Symone"
bio: "Don't let the smooth taste fool ya baby! The 'Ebony Enchantress' with legs up to her waist and talent you can't replace!"
known_for: "RuPaul's Drag Race Season 13 Winner"
talent_category_id: 1 (Drag Queen)
profile_image_url: "[Upload to Supabase storage]"
```

**9. Trinity The Tuck**

```sql
name: "Trinity The Tuck"
bio: "The best tuck in the business! Legendary performer and All Stars winner."
known_for: "RuPaul's Drag Race, All Stars Winner"
talent_category_id: 1 (Drag Queen)
profile_image_url: "[Upload to Supabase storage]"
```

**10. House Of Avalon**

```sql
name: "House Of Avalon"
bio: "[Add bio if available]"
known_for: "Performance Group"
talent_category_id: 7 (Other/Group)
profile_image_url: "[Upload to Supabase storage]"
```

### Supporting Talent (DJs, Hosts)

- Trinity Monroe (Karaoke host)
- Lana Ja'Rae (Karaoke host)
- The Diva (Bingo host)

---

## 5. PARTY THEMES (party_themes table)

**✅ ALL THREE THEMES ALREADY EXIST IN DATABASE - USE EXISTING IDs:**

### Theme 1: Welcome Wig Party ✅ EXISTS

**Database ID: 17**

```sql
-- ALREADY EXISTS - NO NEED TO CREATE
-- Use party_theme_id: 17 when creating events

Current data:
name: "Welcome Wig Party"
short_description: "Channel the zany vibrant energy of Wigstock – the original drag festival for our first night together..."
```

### Theme 2: Halloween Preview ✅ EXISTS

**Database ID: 18**

```sql
-- ALREADY EXISTS - NO NEED TO CREATE
-- Use party_theme_id: 18 when creating events

Current data:
name: "Halloween Preview"
short_description: "It's a bit early for Halloween, but a good outfit should never go unseen. Our queens showcase the lat..."
```

### Theme 3: Scarlet Night ✅ EXISTS

**Database ID: 19**

```sql
-- ALREADY EXISTS - NO NEED TO CREATE
-- Use party_theme_id: 19 when creating events

Current data:
name: "Scarlet Night"
short_description: "Scarlet - the color of danger, love, mischief, and just plain fun. Pull out your brightest red outfi..."
```

**Action Required:**
When creating event records, use these party_theme_id values:

- Welcome Wig Party event → `party_theme_id: 17`
- Halloween Preview event → `party_theme_id: 18`
- Scarlet Night event → `party_theme_id: 19`

---

## 6. FAQS (faqs table)

### Travel & Documentation

```sql
Q: What travel documents do I need?
A: A valid passport is recommended (valid through April 15, 2026). However, US citizens and permanent residents can travel with a valid government-issued photo ID and copy of birth certificate or green card. It is your responsibility to have proper documentation – failure to provide it will result in denied boarding with no refund.
section_type: "trip-specific"

Q: How do I register with Virgin Voyages?
A: Download the Virgin Voyages App (Apple or Android) and register using your booking number from DragStars. Each room has one booking number. If you haven't received it, contact DragStars at +1 (323) 673-5700.
section_type: "trip-specific"
```

### Embarkation & Arrival

```sql
Q: What time is embarkation?
A: Embarkation starts at 1:30 PM and continues until 5:00 PM for the 6:00 PM departure. The pier is NOT open before 1:30 PM. You'll be assigned a check-in time when you register – please arrive during your assigned window. If you haven't registered, arrive after 3:30 PM.
section_type: "trip-specific"

Q: How do I get to the port?
A: Virgin Voyages Valiant Lady sails from Terminal V, 718 N Cruise Blvd, Miami, FL 33132. The port is about 20 minutes from the airport. Taxis and Uber are recommended. Parking is available for a daily fee.
section_type: "trip-specific"

Q: What do I need to check in?
A: Just your valid ID and a credit card. You'll be issued a wearable token that serves as your room key and ID for all onboard services. If you pre-registered through the app, check-in takes only a minute or two.
section_type: "trip-specific"
```

### Packing & Dress Code

```sql
Q: What's the dress code?
A: DragStars emphasizes casual, comfortable attire with NO specified dress code. Sportswear and casual resort wear are always appropriate. There are NO formal nights and no need for jacket and tie. At dinner, please avoid gym-like tank tops, gym shorts, and super-revealing outfits out of respect for other guests.
section_type: "trip-specific"

Q: What should I pack?
A: Plan for warm weather (highs around 85°F/27°C). Bring loose, comfortable cotton clothing, swimwear, flip-flops, sunblock, hat, and costumes for three themed parties (wigs, red outfit, Halloween preview). No need to pack irons, steamers, or alcohol.
section_type: "trip-specific"

Q: Can I bring alcohol onboard?
A: Guests may bring two (2) 750ml bottles of wine per cabin in carry-on bags (corkage fee applies). No beer or hard liquor. Any alcohol in checked baggage will be held until the end of the voyage.
section_type: "trip-specific"
```

### Dining

```sql
Q: Are meals included?
A: Yes! All meals at all restaurants are included. Exceptions are a few luxury specialty items. Drip coffee, tea, filtered water, soft drinks, and most juices are also included. Specialty coffees and alcoholic beverages are additional.
section_type: "trip-specific"

Q: Do I need reservations?
A: Restaurants before 7 PM can be reserved. After 7 PM, all restaurants are walk-in only for maximum flexibility. DragStars hosts will offer communal seating to help you meet other guests, but private dining is always available.
section_type: "trip-specific"

Q: What if I have dietary restrictions?
A: Communicate all dietary restrictions and allergies directly to Virgin Voyages in advance via the app. Also inform the Maitre D' at each restaurant. Vegetarian and vegan options are available everywhere (especially Razzle Dazzle) with no advance notice needed.
section_type: "trip-specific"
```

### Money & Tipping

```sql
Q: How does payment work onboard?
A: The ship operates on a cashless system using U.S. Dollars. Link your Virgin wearable to your Visa, MasterCard, Diner's Club, or American Express card. All purchases sign to your account. You'll receive an itemized statement by email at the end of the cruise.
section_type: "general"

Q: Is tipping required?
A: Virgin Voyages operates on a NO-TIPPING policy. No tipping is required or expected at any time. You may extend gratuities at your discretion for exceptional service, but it's not needed.
section_type: "general"
```

### Entertainment & Activities

```sql
Q: Where do I find the daily schedule?
A: All events and entertainment schedules are in the Virgin Voyages App and on video screens throughout the ship. A printed "Glance At The Day" schedule is available at Sailor Services (Deck 5), Chart Room (Deck 7), and Grounds Club (Deck 7). It's also delivered to your stateroom on embarkation day.
section_type: "trip-specific"

Q: Are the evening parties optional?
A: Yes! Dressing up for evening events is optional. All parties are on the Aquatic Club deck (subject to weather) and you're welcome to participate as much or as little as you like.
section_type: "trip-specific"
```

### Onboard Services

```sql
Q: Is there WiFi onboard?
A: Yes! Valiant Lady offers complimentary WiFi to all guests, with paid upgrades available for premium services, speed, and additional devices. Details in the app or at Sailor Services.
section_type: "general"

Q: Can I use my cell phone?
A: Yes, the ship is equipped for mobile phone service. Roaming charges apply and will be billed by your carrier. Rates vary but can be cheaper than satellite phones. Recommend setting devices to "Airplane Mode" to avoid excessive charges. This only works at sea – in port, land roaming charges apply.
section_type: "general"

Q: Is there laundry service?
A: Yes, laundry, dry cleaning, spot removal, and pressing services are available for an additional fee. Laundry bags and forms are in your room. No irons in staterooms (fire hazard) and no self-service laundry facilities.
section_type: "general"

Q: Can I smoke onboard?
A: All indoor areas are non-smoking. Smoking is permitted only in certain areas on open decks. Smoking is NOT allowed on stateroom balconies. See the Virgin Voyages App for designated smoking areas.
section_type: "general"
```

### Health & Safety

```sql
Q: What if I get sick onboard?
A: An infirmary staff is available 24/7. If you have a contagious disease or suspect one, it's compulsory to report to the infirmary for everyone's safety. The ship follows CDC guidelines on quarantine. Travel insurance is strongly recommended to cover any costs or missed vacation time due to illness (including COVID).
section_type: "general"

Q: What's prohibited onboard?
A: Do not bring: irons/steamers, alcoholic beverages, knives, firearms, power strips, or dangerous items. Luggage containing prohibited items will be held at security and not delivered to your stateroom. Full list: https://www.virginvoyages.com/safety-security/prohibited-items
section_type: "general"
```

### Disembarkation

```sql
Q: What time do we arrive back in Miami?
A: The ship arrives around 7:00 AM. Disembarkation is "hotel-style" from arrival until 10:30 AM. Breakfast is served as normal in all restaurants. Do NOT book flights before 11:00 AM from Miami.
section_type: "trip-specific"
```

---

## 7. TRIP INFO SECTIONS (trip_info_sections table)

### Section 1: Welcome Message

```sql
title: "Welcome to DragStars at Sea!"
content: "We're thrilled to welcome you onboard the incredible Valiant Lady. You're about to experience a revolution in fun on the high seas, and we can't wait to share it with you as we sail from Miami!

Sailing the spectacular Valiant Lady, you'll experience nonstop entertainment and fun in ways you never imagined. Virgin and Drag Stars's superb teams, hosts, entertainers, and crew are excited and ready to show you the time of your life.

Warm regards,
Rich, James, Jan, Ben and the entire Drag Stars team"
section_type: "trip_specific"
```

### Section 2: Important Check-In Information

```sql
title: "Embarkation & Check-In Details"
content: "**Getting to The Port of Miami**
Virgin Voyages Valiant Lady sails from Terminal V, 718 N Cruise Blvd, Miami, FL 33132. The port is about 20 minutes from the airport. Taxis and Uber are the best way to get to the port.

**Check-In Times**
Embarkation starts at 1:30 PM, and the pier is NOT open earlier. When you register with Virgin, you are assigned a designated arrival time. Please adhere to your assigned time. If you haven't registered yet, arrive after 3:30 PM. Check-in is open until 5:00 PM for our 6:00 PM departure.

**What You Need**
Just your valid ID to travel and a credit card to check-in. You'll receive a wearable token serving as your room key and ID card. If registered correctly through the app, this takes only a minute or two!"
section_type: "trip_specific"
```

### Section 3: Evening Party Themes

```sql
title: "Evening Party Themes"
content: "Dressing up for evening events is optional, but you're welcome to be part of the show! All parties are outdoors on the Aquatic Club deck (subject to weather).

**WELCOME WIG PARTY** (Wednesday)
Channel the zany vibrant energy of Wigstock – the original drag festival. Don your favorite wig – or not – for hours of musical madness.

**HALLOWEEN PREVIEW** (Thursday)
A good outfit should never go unseen. Our queens showcase ghoulish fashion and dazzling holiday looks. Bring your outfit for a trial run or let our queens inspire you!

**SCARLET NIGHT** (Friday)
Scarlet - the color of danger, love, mischief, and fun. Pull out your brightest red outfit in any style and dive into the craziness with our queens and special guests."
section_type: "trip_specific"
```

### Section 4: Dining Guide

```sql
title: "Dining on Valiant Lady"
content: "All restaurants onboard are included in your cruise fare! Reservations available for early seatings (before 7 PM). After 7 PM, all restaurants are walk-in only for maximum flexibility.

**Virgin's Fabulous Restaurants:**
- **Razzle Dazzle**: Vegetable-forward spot with brunch and dinner
- **The Wake**: Sexy grill specializing in seafood and steak
- **Pink Agave**: Modern Mexican with massive Mescal bar
- **Extra Virgin**: Classic rustic Italian with hand-made pastas
- **Test Kitchen**: Creative tasting menus, ultra-modern
- **Gumbae**: Korean BBQ - the only one at sea!
- **The Galley**: Food-truck-style stands, open almost 24/7

**What's Included:**
All meals, drip coffee, tea, filtered water, soft drinks, and most juices. Specialty coffees and alcoholic beverages are additional.

**Dining Times:**
Most restaurants: 6 PM – 10 PM dinner
The Galley: Breakfast 7 AM – 11:30 AM, Open late night 10 PM - 5 AM"
section_type: "trip_specific"
```

### Section 5: Itinerary Changes Policy

```sql
title: "Itinerary Changes"
content: "DragStars and Virgin have carefully planned this itinerary for maximum enjoyment of all ports and the ship. Although we do our best to adhere to published ports and times, unforeseen weather and/or sea conditions may force us to alter the itinerary.

In the unlikely event of an itinerary change while sailing, we will communicate our new plan through ship-wide announcements and updated app notices. Neither DragStars nor Virgin shall be held liable for any damages resulting from itinerary changes according to your Passenger Cruise Contract.

All arrival and departure times are approximate and may change without notice. Please note embarkation and departure times at all gangways."
section_type: "trip_specific"
```

### Section 6: DragStars Policies

```sql
title: "DragStars Policies"
content: "**No Solicitation Policy**
DragStars does not allow guests to solicit other guests for any service or business while onboard. Any guest distributing materials, voice mails, or sales communications will be subject to a $2,500 USD fine applied to their onboard account.

**Social Media Policy**
While we want everyone to have fun, please be respectful of all guests and cruise partners. Do not post anything explicit on social media in public forums or spaces. Any guest who posts explicit and publicly visible photos or videos will be asked to leave the ship with no refund.

**Team & Information Desk**
Our DragStars staff wears name badges and is available 24/7 to help. We have an information desk adjacent to Sailor Services on Deck 5. Hours vary and are posted."
section_type: "trip_specific"
```

---

## 8. SHIP INFORMATION

**Ship:** Virgin Voyages Valiant Lady
**Cruise Line:** Virgin Voyages
**Capacity:** [Lookup from Virgin Voyages - adult-only ship]
**Terminal:** Terminal V, Port of Miami

### Key Venues Referenced:

- **Aquatic Club** (Pool Deck) - Parties and outdoor events
- **Red Room** - Main theater/showroom
- **The Manor** - Secondary showroom/venue
- **Social Club** - Karaoke and activities
- **Razzle Dazzle** - Restaurant (Brunch venue)
- Multiple dining venues (listed in Trip Info section above)

---

## 9. KEY CONTACTS & INFORMATION

**DragStars Contact:**

- Phone: +1 (323) 673-5700
- Email: info@dragstars.com

**Team:**

- Rich Campbell – President
- Jan Basson – Producer
- James Xiao – Producer
- Brian Nash – Entertainment Coordinator
- Ben Cameron – Drag Director
- Abel Sanchez – Guest Relations
- Allan McGavin – Team Manager

**Supporting Crew:**

- Alistair, Tyler, Jake, Josh
- Bruno, Jesse
- Additional karaoke hosts: Trinity Monroe, Lana Ja'Rae

---

## 10. SUMMARY STATISTICS

- **Duration:** 5 days / 4 nights
- **Ports:** 2 (Key West, Bimini)
- **Headlining Talent:** 9 major performers
- **Themed Parties:** 3
- **Daily Shows/Events:** ~8-10 per day
- **Total Events:** ~45+ scheduled events
- **Venues:** 6+ performance venues

---

## NEXT STEPS FOR DATABASE POPULATION

1. **Upload Images to Supabase Storage**
   - Cover/hero image from guide
   - Talent profile photos (if available)
   - Party theme images
   - Port/location images

2. **Verify Lookups**
   - Check if Valiant Lady exists in `ships` table
   - Check if Miami, Key West, Bimini exist in `locations` table
   - Check if DragStars exists in `charter_companies` table
   - Check existing talent in `talent` table

3. **Create New Records**
   - Add Virgin Voyages Valiant Lady to `ships` if not exists
   - Add any missing talent to `talent` table
   - Add three party themes to `party_themes` table
   - Add ship venues to `ship_venues` table (Aquatic Club, Red Room, The Manor, Social Club)

4. **Insert Main Trip Data**
   - Create trip record in `trips` table
   - Insert 5 itinerary records
   - Insert ~45 event records
   - Link talent to trip via `trip_talent` table
   - Create FAQ records and link via `trip_faq_assignments`
   - Create trip info sections and link via `trip_section_assignments`

---

**Document Prepared:** 2025
**Ready for Database Population:** YES
**All Data Extracted:** YES
**Formatted for Insert:** YES
