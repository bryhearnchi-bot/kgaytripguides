# Halloween Caribbean Cruise - Data Import Plan

**Trip**: Halloween Carribean Cruise
**Trip ID**: 74
**Ship**: Brilliant Lady (ID: 12)
**Dates**: October 25 - November 1, 2025
**PDF Source**: `pdf/HW25-Cruise-vacation-guide-FINAL.pdf`

---

## 📊 Database Operations Summary

**Total Operations**: ~190 database operations across 9 steps

### Current Status

- ✅ Party Themes: Already assigned to trip (skip)
- ❌ Ship Amenities: 0 (need 15)
- ❌ Ship Venues: 0 (need 14)
- ❌ Talent: 8 existing in DB, need 12 new (20 total to link)
- ❌ Events: 0 (need 48)
- ❌ Trip Info Sections: 0 (need 12)
- ❌ FAQs: 0 (need 33)

---

## 🎯 Execution Order

### **CRITICAL**: Execute in this exact order due to foreign key dependencies

1. ✅ **Ship Amenities** (15 records)
2. ✅ **Ship Venues** (14 records) - Required before events
3. ✅ **Talent** (12 new records) - Required before trip_talent
4. ✅ **Trip-Talent Links** (20 records) - Required before events
5. ✅ **Trip Info Sections** (12 records)
6. ✅ **Section Assignments** (12 records)
7. ✅ **FAQs** (33 records)
8. ✅ **FAQ Assignments** (33 records)
9. ✅ **Events** (48 records) - **LAST** - depends on venues and talent

---

## 🏊 STEP 1: Add Ship Amenities (15 amenities)

**Action**: Insert into `ship_amenities` table (junction table)

Link these existing amenities to Brilliant Lady (ship_id: 12):

| Amenity ID | Amenity Name   | Source                                     |
| ---------- | -------------- | ------------------------------------------ |
| 3          | Spa            | Page 22: "stunningly beautiful spa"        |
| 4          | Fitness Center | Page 22                                    |
| 1          | WiFi           | Page 23: "basic complimentary internet"    |
| 2          | Pool           | Multiple pools (Aquatic Club, Bimini Pool) |
| 36         | Hot Tubs       | Standard Virgin ships                      |
| 37         | Sun Deck       | Outdoor deck areas                         |
| 10         | Casino         | Standard Virgin ships                      |
| 31         | Salon          | Page 22: spa services "hair styling"       |
| 30         | Barbershop     | Spa services                               |
| 16         | Jogging Track  | Athletic amenities                         |
| 11         | Theater        | Red Room is main theater                   |
| 12         | Nightclub      | Entertainment venues                       |
| 41         | Whirlpools     | Hot tub areas                              |
| 40         | Teak Decks     | Premium outdoor decking                    |
| 8          | Gym            | Fitness facilities                         |

**SQL Pattern**:

```sql
INSERT INTO ship_amenities (ship_id, amenity_id)
VALUES (12, 3), (12, 4), (12, 1), ...
```

---

## 🏢 STEP 2: Add Ship Venues (14 venues)

**Action**: Insert into `ship_venues` table

### Entertainment Venues (venue_type_id: 2) - 6 venues

1. **Aquatic Club** - Outdoor deck party/pool area
2. **Red Room** - Main theater for shows
3. **The Manor** - Entertainment/performance venue
4. **On the Rocks** - Piano bar
5. **Chart Room** - Lounge/information area
6. **Bimini Pool** - Pool area for games/events

### Restaurants (venue_type_id: 1) - 6 venues

7. **Rojo by Razzle Dazzle** - Spanish dining
8. **The Wake** - Seafood & steak grill (page 17)
9. **Pink Agave** - Modern Mexican (page 17)
10. **Extra Virgin** - Italian (page 17)
11. **Test Kitchen** - Tasting menus (page 17)
12. **Gunbae** - Korean BBQ (page 17)

### Casual Dining (venue_type_id: 7) - 2 venues

13. **The Galley** - Food court (page 18)
14. **Grounds Club** - Coffee shop (page 11, 18)

**SQL Pattern**:

```sql
INSERT INTO ship_venues (ship_id, name, venue_type_id, description)
VALUES
  (12, 'Aquatic Club', 2, 'Outdoor deck party/pool area'),
  (12, 'Red Room', 2, 'Main theater for shows'),
  ...
```

---

## 🎭 STEP 3: Add New Talent (12 performers/shows)

**Action**: Insert into `talent` table

### Piano Bar / Cabaret (talent_category_id: 5) - 2 performers

**1. Ge Enrique** ⭐ NEW

```json
{
  "name": "Ge Enrique",
  "talent_category_id": 5,
  "bio": "Piano entertainer bringing Broadway tunes and piano pop medleys to make the piano bar the ultimate late-night escape",
  "known_for": "Piano bar entertainment",
  "profile_image_url": null
}
```

**2. Christina Bianco** ⭐ NEW

```json
{
  "name": "Christina Bianco",
  "talent_category_id": 5,
  "bio": "Acclaimed cabaret and Broadway star. Hilarious vocal impressionist whose versatile vocals and celebrity impressions have been the hit of the NY scene. No diva is safe!",
  "known_for": "Vocal impressions, cabaret performances",
  "profile_image_url": null
}
```

### Drag & Variety (talent_category_id: 3) - 3 performers

**3. Cacophony Daniels** ⭐ NEW

```json
{
  "name": "Cacophony Daniels",
  "talent_category_id": 3,
  "bio": "New York's Broadway and pop drag sensation. Direct from the Broadway stage to Atlantis, with a voice as high as her hair!",
  "known_for": "Broadway drag performances",
  "profile_image_url": null
}
```

**4. Sutton Lee Seymour** ⭐ NEW

```json
{
  "name": "Sutton Lee Seymour",
  "talent_category_id": 3,
  "bio": "Legendary Queen of the stage. Zany, fun, and a Broadway bombshell with an all-new spooky and hilarious Halloween spectacular",
  "known_for": "Drag comedy and performance",
  "profile_image_url": null
}
```

**5. Miss Richfield 1981** ⭐ NEW

```json
{
  "name": "Miss Richfield 1981",
  "talent_category_id": 3,
  "bio": "Professional beauty queen and on-trend fashion gal. Celebrates our wonderfully medicated world with her new show 'There's A Pill For That!'",
  "known_for": "Character comedy, beauty queen persona",
  "profile_image_url": null
}
```

### Vocalists (talent_category_id: 2) - 1 performer

**6. Solea Pfieffer** ⭐ NEW

```json
{
  "name": "Solea Pfieffer",
  "talent_category_id": 2,
  "bio": "Broadway's hottest new diva, direct from a star role in Moulin Rouge! From Hamilton to Hadestown, pop to R&B, she's here to thrill and dazzle",
  "known_for": "Broadway performances in Moulin Rouge, Hamilton, Hadestown",
  "profile_image_url": null
}
```

### Comedy (talent_category_id: 6) - 2 performers

**7. Erin Foley** ⭐ NEW

```json
{
  "name": "Erin Foley",
  "talent_category_id": 6,
  "bio": "Hilarious stand-up comedian and actor. One of the USA's most dynamic and talented lesbian comedians, an Atlantis legend ready with stories from her time surrounded by gay men around the world",
  "known_for": "Stand-up comedy",
  "profile_image_url": null
}
```

**8. Dylan Adler** ⭐ NEW

```json
{
  "name": "Dylan Adler",
  "talent_category_id": 6,
  "bio": "Comedian, musician, actor, acrobat…Dylan does it all! Presents a hilarious solo show injected with songs, personal anecdotes, even acrobatics, directly from the Edinburgh Fringe",
  "known_for": "Multi-talented comedy performances",
  "profile_image_url": null
}
```

### Shows (talent_category_id: 7) - 4 shows

**9. Duel Reality** ⭐ NEW

```json
{
  "name": "Duel Reality",
  "talent_category_id": 7,
  "bio": "A dazzling, modern, & sexy acrobatic retelling of Romeo and Juliet by 7 Fingers. Watch as two warring groups grapple through graceful and death-defying acts. Now on Brilliant Lady with new LED-integrated sets",
  "known_for": "Acrobatic Romeo & Juliet reimagining",
  "profile_image_url": null
}
```

_Source_: Virgin Voyages production, researched via web search

**10. Red Hot** ⭐ NEW

```json
{
  "name": "Red Hot",
  "talent_category_id": 7,
  "bio": "An all-new Virgin production show paying tribute to their musical roots through thrilling choreography, iconic performance and dazzling staging. Celebrates Virgin's 50-year music history featuring hits from Spice Girls, Janet Jackson, David Bowie, Queen, The Killers, and The Sex Pistols",
  "known_for": "Virgin Records 50-year rockumentary celebration",
  "profile_image_url": null
}
```

_Source_: Virgin Voyages production, researched via web search

**11. Up With a Twist** ⭐ NEW

```json
{
  "name": "Up With a Twist",
  "talent_category_id": 7,
  "bio": "New! An immersive Roaring '20s supper club experience with a touch of glamour and unpredictability. Dine in style while Virgin's sizzling performers put a modern spin on vintage tunes. Features live band, dancers, and world-class vocalists. By Holly-Anne Devlin and Kaleidoscope Immersive",
  "known_for": "Interactive 1920s dining show experience",
  "profile_image_url": null
}
```

_Source_: PDF page 14 + web search

**12. Murder in the Manor** ⭐ NEW

```json
{
  "name": "Murder in the Manor",
  "talent_category_id": 7,
  "bio": "An interactive mystery somewhere between Scooby-Doo and Haunted Mansion, with plenty of tongue-in-cheek humor, 80s-inspired costumes, synth pop soundtrack, and moody staging",
  "known_for": "Interactive mystery theater experience",
  "profile_image_url": null
}
```

_Source_: PDF page 15

---

## 🔗 STEP 4: Link Talent to Trip (20 total)

**Action**: Insert into `trip_talent` table

### Link to Trip 74:

**DJs (4 existing)**

- Abel (ID: 16)
- Dan Slater (ID: 17)
- DJ Suri (ID: 18)
- GSP (ID: 19)

**Piano Bar / Cabaret (3: 1 existing + 2 new)**

- Brian Nash (ID: 21) - existing
- Ge Enrique (NEW)
- Christina Bianco (NEW)

**Drag & Variety (5: 1 existing + 4 new)**

- The Diva (Bingo) (ID: 15) - existing
- Cacophony Daniels (NEW)
- Sutton Lee Seymour (NEW)
- Miss Richfield 1981 (NEW)

**Vocalists (1 new)**

- Solea Pfieffer (NEW)

**Comedy (3: 1 existing + 2 new)**

- Brad Loekle (ID: 9) - existing
- Erin Foley (NEW)
- Dylan Adler (NEW)

**Shows (5: 1 existing + 4 new)**

- AirOtic (ID: 12) - existing
- Duel Reality (NEW)
- Red Hot (NEW)
- Up With a Twist (NEW)
- Murder in the Manor (NEW)

**SQL Pattern**:

```sql
INSERT INTO trip_talent (trip_id, talent_id, notes)
VALUES
  (74, 16, NULL), -- Abel
  (74, 17, NULL), -- Dan Slater
  ...
```

---

## 📄 STEP 5: Add Trip Info Sections (12 sections)

**Action**: Insert into `trip_info_sections` table

### trip_specific sections (10) - Halloween cruise only

**1. Welcome Message**

```json
{
  "title": "Welcome to Atlantis!",
  "content": "We're thrilled to welcome you onboard the brand new Brilliant Lady for our first Halloween cruise on the East! You're about to experience a revolution in fun on the high seas, and we can't wait to share it with you as we sail from Miami!\n\nIn this booklet, we'll help get you organized for your vacation with information on how to pack, what to expect, and what you'll do when you arrive...\n\nWarm regards,\nRich, Jan, James, Ben, and the entire Atlantis Virgin team",
  "section_type": "trip_specific",
  "trip_id": null
}
```

_Source_: PDF page 3

**2. Entertainment Schedule**

```json
{
  "title": "Entertainment Preview",
  "content": "[Complete day-by-day entertainment schedule from PDF pages 13-15]",
  "section_type": "trip_specific",
  "trip_id": null
}
```

**3. Our DJs**

```json
{
  "title": "Our DJs",
  "content": "We're thrilled to have the world's top DJs onboard:\n\nAbel - Miami\nDan Slater - Dallas\nDJ Suri - Madrid\nGSP - Miami/Atlanta\n\nEach has their own unique style and has been selected for their particular sound.",
  "section_type": "trip_specific",
  "trip_id": null
}
```

_Source_: PDF page 16

**4. Cabaret Performers**

```json
{
  "title": "Cabaret Performers",
  "content": "Brian Nash & Ge Enrique - Our superstar team of incredible piano entertainers...\n\nChristina Bianco - Hilarious vocal impressionist. No diva is safe!",
  "section_type": "trip_specific",
  "trip_id": null
}
```

_Source_: PDF page 16

**5. Drag & Variety Stars**

```json
{
  "title": "Drag & Variety Stars",
  "content": "Cacophony Daniels - New York's Broadway and pop drag sensation...\n\nSutton Lee Seymour - Zany, fun, and a Broadway bombshell!...\n\nMiss Richfield 1981 - Professional beauty queen...",
  "section_type": "trip_specific",
  "trip_id": null
}
```

**6. Broadway & Vocal Stars**

```json
{
  "title": "Broadway & Vocal Stars",
  "content": "Solea Pfieffer - Broadway's hottest new diva, direct from a star role in Moulin Rouge!...",
  "section_type": "trip_specific",
  "trip_id": null
}
```

**7. Gay Comedy All-Stars**

```json
{
  "title": "Atlantis Gay Comedy All-Stars",
  "content": "Brad Loekle - He always gets the last laugh...\n\nErin Foley - Hilarious stand-up comedian and actor...\n\nDylan Adler - Comedian, musician, actor, acrobat…Dylan does it all!",
  "section_type": "trip_specific",
  "trip_id": null
}
```

_Source_: PDF page 16

**8. Team Atlantis**

```json
{
  "title": "Team Atlantis",
  "content": "Rich Campbell – President\nJan Basson – Producer\nJames Xiao – Producer\nBrian Nash – Musical Director\nBen Cameron – Cruise Director\nMarino Maranion – Guest Relations\nAllan McGavin – Team Manager",
  "section_type": "trip_specific",
  "trip_id": null
}
```

_Source_: PDF page 25

**9. Atlantis Events Program**

```json
{
  "title": "The Atlantis Experience",
  "content": "All events and entertainment schedules are available on the Virgin Voyages App...\n\nOur office and Team Atlantis staff will be on hand throughout your trip...\n\nWe also offer a general information desk on Deck 5, adjacent to Sailor Services.",
  "section_type": "trip_specific",
  "trip_id": null
}
```

_Source_: PDF page 11

**10. Meet Ups & Interest Groups**

```json
{
  "title": "Friendly & Social Meet Ups",
  "content": "Lure of Leather – For our guests who like or love leather...\nBears & Cubs – A social gathering for bears, friends, and admirers...\nAtlantis BIPOC – For our Black, Indigenous, and people of color guests & friends...\n[Full list from page 11]",
  "section_type": "trip_specific",
  "trip_id": null
}
```

_Source_: PDF page 11

### general sections (2) - reusable, assign to trip

**11. Virgin's Restaurants**

```json
{
  "title": "Dining Onboard Brilliant Lady",
  "content": "[Complete restaurant descriptions from pages 17-18:\nRojo by Razzle Dazzle, The Wake, Pink Agave, Extra Virgin, Test Kitchen, Gunbae, The Galley, etc.]",
  "section_type": "general",
  "trip_id": null
}
```

**12. Packing Advice**

```json
{
  "title": "What to Pack",
  "content": "Atlantis emphasizes a casual, comfortable atmosphere with no specified dress code...\n\nPlan for warm, even hot weather with slightly cooler breezes at night...\n\nDon't forget a hat!",
  "section_type": "general",
  "trip_id": null
}
```

_Source_: PDF page 7

---

## 🔗 STEP 6: Assign Sections to Trip (12 assignments)

**Action**: Insert into `trip_section_assignments` table

```sql
INSERT INTO trip_section_assignments (trip_id, section_id, order_index)
VALUES
  (74, [welcome_id], 1),
  (74, [entertainment_id], 2),
  (74, [djs_id], 3),
  (74, [cabaret_id], 4),
  (74, [drag_id], 5),
  (74, [broadway_id], 6),
  (74, [comedy_id], 7),
  (74, [team_id], 8),
  (74, [events_program_id], 9),
  (74, [meetups_id], 10),
  (74, [restaurants_id], 11),
  (74, [packing_id], 12);
```

---

## ❓ STEP 7: Add FAQs (33 questions)

**Action**: Insert into `faqs` table

### general - Reusable (30 FAQs)

#### Travel & Documentation (6 FAQs)

**FAQ 1**

```json
{
  "question": "What travel documents do I need to board?",
  "answer": "A valid passport is the best way to travel and should be valid at least through May 1, 2026. However, US citizens and permanent residents can travel with a valid government-issued photo ID and copy of your birth certificate or green card.",
  "section_type": "general"
}
```

_Source_: PDF page 5

**FAQ 2**

```json
{
  "question": "How do I register with Virgin Voyages?",
  "answer": "Download the Virgin Voyages App (available in Apple or Android app stores) and use your booking number received from Atlantis Events. Each room has only one Virgin Booking Number - roommates can use the same number.",
  "section_type": "general"
}
```

_Source_: PDF page 5

**FAQ 3**

```json
{
  "question": "What if I have issues registering with Virgin?",
  "answer": "Call Virgin directly at +1 954 488 2955. If they refuse to assist because 'This is a charter sailing,' get the agent's name and call Atlantis at +1 310-859-8800.",
  "section_type": "general"
}
```

_Source_: PDF page 5

**FAQ 4**

```json
{
  "question": "What time should I arrive at the port?",
  "answer": "Embarkation starts at 1:30 PM. Arrive during your assigned arrival time for the smoothest experience. If you haven't received a check-in time, arrive after 2:30 PM. The pier is NOT open earlier.",
  "section_type": "general"
}
```

_Source_: PDF page 9

**FAQ 5**

```json
{
  "question": "What time should I book my departure flight?",
  "answer": "Do not book flights before 11 AM on the final day. Disembarkation begins around 7:30 AM and continues until approximately 10:30 AM.",
  "section_type": "general"
}
```

_Source_: PDF page 6, 24

**FAQ 6**

```json
{
  "question": "Can I bring alcohol onboard?",
  "answer": "Guests can bring two (2) 750mL bottles of wine per cabin in carry-on bags. No beer or hard liquor may be brought onboard for consumption. Any alcohol in checked baggage will be held until the end of your voyage.",
  "section_type": "general"
}
```

_Source_: PDF page 9

#### Onboard Information (17 FAQs)

**FAQ 7**

```json
{
  "question": "Do I need to make dining reservations?",
  "answer": "No! On this sailing, no bookings are necessary and you can walk-in to any restaurant, allowing maximum flexibility.",
  "section_type": "general"
}
```

_Source_: PDF page 17

**FAQ 8**

```json
{
  "question": "Are meals and drinks included?",
  "answer": "All meals at all restaurants are included. Drip coffee, tea, filtered water, soft drinks, and most juices are also included. Specialty coffees and alcoholic beverages are available for an additional charge.",
  "section_type": "general"
}
```

_Source_: PDF page 18

**FAQ 9**

```json
{
  "question": "What about special dietary needs?",
  "answer": "Communicate all dietary restrictions and allergies directly to Virgin in advance via the Virgin Voyages App. Also inform the Maitre D at any restaurant entrance. Vegetarian and vegan options are available everywhere.",
  "section_type": "general"
}
```

_Source_: PDF page 19

**FAQ 10**

```json
{
  "question": "Is there room service?",
  "answer": "Yes, Virgin's Ship Eats (Room Service) is available 24 hours daily. See the menu on the app for a complete selection. There is a small service charge for some items.",
  "section_type": "general"
}
```

_Source_: PDF page 19

**FAQ 11**

```json
{
  "question": "Should I tip the crew?",
  "answer": "No, Virgin Voyages operates on a no-tipping policy, so there is no tipping required or expected at any time.",
  "section_type": "general"
}
```

_Source_: PDF page 21

**FAQ 12**

```json
{
  "question": "Where can I smoke or vape?",
  "answer": "All indoor areas are non-smoking except the smoking lounge on Deck 6, Forward. Smoking and vaping are permitted only in certain areas on open decks. Smoking or vaping is NOT allowed on stateroom balconies.",
  "section_type": "general"
}
```

_Source_: PDF page 21

**FAQ 13**

```json
{
  "question": "Is there WiFi onboard?",
  "answer": "Yes, Brilliant Lady offers basic complimentary internet to all guests. Premium (faster) internet upgrades are available for an extra charge.",
  "section_type": "general"
}
```

_Source_: PDF page 23

**FAQ 14**

```json
{
  "question": "Will my cell phone work onboard?",
  "answer": "Yes, the ship is equipped for mobile phones to work at sea, but roaming charges apply and will be billed by your home carrier. We recommend turning devices to 'Airplane Mode' to avoid excessive charges.",
  "section_type": "general"
}
```

_Source_: PDF page 23

**FAQ 15**

```json
{
  "question": "What currency is used onboard?",
  "answer": "The entire ship operates on U.S. Dollars. Virgin uses a cashless system - validate your wearable with your credit card at check-in.",
  "section_type": "general"
}
```

_Source_: PDF page 7, 20

**FAQ 16**

```json
{
  "question": "Are there laundry facilities?",
  "answer": "There are no self-service laundry facilities, but laundry, dry cleaning, and pressing services are available for a fee. There are no irons in staterooms due to fire safety.",
  "section_type": "general"
}
```

_Source_: PDF page 21

**FAQ 17**

```json
{
  "question": "What if I need medical attention?",
  "answer": "An infirmary staff is available 24 hours a day. A doctor can render services at a customary charge. The infirmary can treat minor matters and stabilize most emergencies.",
  "section_type": "general"
}
```

_Source_: PDF page 22

**FAQ 18**

```json
{
  "question": "What should I pack for the weather?",
  "answer": "Plan for warm, even hot weather with slightly cooler breezes at night. High temperatures are usually around 85°F / 27°C. Bring loose, comfortable cotton clothing, sunblock, and a hat.",
  "section_type": "general"
}
```

_Source_: PDF page 7

**FAQ 19**

```json
{
  "question": "What items are prohibited onboard?",
  "answer": "Do not bring irons (including travel steamers), alcoholic beverages, knives, firearms, power strips, extension cords, or other potentially dangerous items. Bags containing prohibited items will be held at security.",
  "section_type": "general"
}
```

_Source_: PDF page 7

**FAQ 20**

```json
{
  "question": "Are there any dress codes?",
  "answer": "No formal nights and no jacket/tie required. We request good taste at dinner - no gym tank tops, gym shorts, or super-revealing outfits. Casual resort attire is always appropriate.",
  "section_type": "general"
}
```

_Source_: PDF page 7

**FAQ 21**

```json
{
  "question": "Can I book shore excursions?",
  "answer": "Yes, book Shore Things via the Virgin Voyages App (Discover tab) or call Sailor Services once onboard. Atlantis has worked with Virgin to develop excursions for our group.",
  "section_type": "general"
}
```

_Source_: PDF page 6

**FAQ 22**

```json
{
  "question": "What about beverage packages?",
  "answer": "Virgin doesn't offer beverage packages, but you can purchase a pre-paid 'bar tab' before sailing via the app. Example: Buy a $300 Bar Tab, get $350 in credit! Not available onboard.",
  "section_type": "general"
}
```

_Source_: PDF page 19

**FAQ 23**

```json
{
  "question": "What do I need to check in?",
  "answer": "Just a valid passport and a credit card. You'll be issued a wearable token which serves as your room key and ID for all things onboard.",
  "section_type": "general"
}
```

_Source_: PDF page 9

#### Embarkation & Disembarkation (3 FAQs)

**FAQ 24**

```json
{
  "question": "What if my luggage is lost by the airline?",
  "answer": "Get a complete report from the airline with your bag receipt and tracking number. Upon arrival on the ship, go immediately to Sailor Services with your lost baggage report. The ship will attempt to track your luggage.",
  "section_type": "general"
}
```

_Source_: PDF page 10

**FAQ 25**

```json
{
  "question": "When should I put my luggage out for disembarkation?",
  "answer": "Place luggage outside your room no later than midnight on the last night if you want Virgin to bring it to the terminal. Otherwise, it's easy to carry it yourself.",
  "section_type": "general"
}
```

_Source_: PDF page 24

**FAQ 26**

```json
{
  "question": "How long does disembarkation take?",
  "answer": "We arrive around 7 AM and disembarkation begins around 7:30 AM. Virgin offers a relaxed process - you can sleep in, have breakfast, and depart by around 10:30 AM.",
  "section_type": "general"
}
```

_Source_: PDF page 24

#### Atlantis Program (4 FAQs)

**FAQ 27**

```json
{
  "question": "Where can I find the daily schedule?",
  "answer": "All events and schedules are in the Virgin Voyages App and on video screens throughout the ship. Printed 'Glance At The Day' schedules are available at Sailor Services (Deck 5), Chart Room (Deck 7), and Grounds Club (Deck 7).",
  "section_type": "general"
}
```

_Source_: PDF page 11

**FAQ 28**

```json
{
  "question": "Where is the Atlantis information desk?",
  "answer": "The Atlantis desk is on Deck 5, adjacent to Sailor Services. Hours vary and are posted at the desk and in the daily schedule. Atlantis staff can also be reached through Sailor Services any time.",
  "section_type": "general"
}
```

_Source_: PDF page 11

**FAQ 29**

```json
{
  "question": "Are the party themes mandatory?",
  "answer": "No, dressing up is always optional! Theme parties are legendary and dressing up is part of the show, but participation is entirely your choice.",
  "section_type": "general"
}
```

_Source_: PDF page 8

**FAQ 30**

```json
{
  "question": "What if I'm traveling solo?",
  "answer": "Atlantis hosts several special events for single guests, ranging from cocktail parties to special dinners. Our hosts will seat you with new friends at any restaurant.",
  "section_type": "general"
}
```

_Source_: PDF page 12

### trip-specific - Halloween Cruise Only (3 FAQs)

**FAQ 31**

```json
{
  "question": "What is the itinerary for this cruise?",
  "answer": "Oct 25: Miami (depart 5pm) → Oct 26: Key West (8am-5pm) → Oct 27: At Sea → Oct 28: Puerto Plata (9am-6pm) → Oct 29: Grand Turk (9am-6pm) → Oct 30: At Sea → Oct 31: Bimini (8am-6pm) → Nov 1: Miami (arrive 7am)",
  "section_type": "trip-specific"
}
```

_Source_: PDF page 4

**FAQ 32**

```json
{
  "question": "What if the itinerary changes?",
  "answer": "Unforeseen weather/sea conditions may force itinerary changes. We'll communicate via ship-wide announcements and app notices. Neither Atlantis nor Virgin is liable for itinerary changes.",
  "section_type": "trip-specific"
}
```

_Source_: PDF page 4

**FAQ 33**

```json
{
  "question": "Where does the ship depart from?",
  "answer": "Port Miami, Terminal V, 718 N Cruise Blvd, Miami, FL 33132. The port is about 20 minutes from the airport. Taxis and Uber are the best way to get there.",
  "section_type": "trip-specific"
}
```

_Source_: PDF page 9

---

## 🔗 STEP 8: Assign FAQs to Trip (33 assignments)

**Action**: Insert into `trip_faq_assignments` table

```sql
INSERT INTO trip_faq_assignments (trip_id, faq_id, order_index)
VALUES
  (74, [faq1_id], 1),
  (74, [faq2_id], 2),
  ...
  (74, [faq33_id], 33);
```

---

## 🎉 STEP 9: Add Events (48 events) - LAST!

**Action**: Insert into `events` table

**CRITICAL**: This must be done LAST because events reference:

- `ship_venue_id` from ship_venues (Step 2)
- `talent_ids` JSONB array from talent (Step 3)
- `event_type_id` from event_types (already exists)
- `party_theme_id` from party_themes (already assigned)

### Saturday October 25 - Miami (Embarkation) - 8 events

**Event 1**

```json
{
  "trip_id": 74,
  "date": "2025-10-25",
  "time": "17:00",
  "title": "Sail-Away Party",
  "ship_venue_id": [Aquatic Club venue_id],
  "event_type_id": 1,
  "party_theme_id": null,
  "talent_ids": [],
  "description": "We're off on a new adventure with fabulous friends and a welcome from the Virgin and Atlantis teams"
}
```

**Event 2**

```json
{
  "trip_id": 74,
  "date": "2025-10-25",
  "time": "19:00",
  "title": "First Time Cruisers Orientation",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 8,
  "party_theme_id": null,
  "talent_ids": [],
  "description": "If it's your first time, join Atlantis Host Ben for a quick and friendly overview of how to make the most of your vacation!"
}
```

**Event 3**

```json
{
  "trip_id": 74,
  "date": "2025-10-25",
  "time": "19:30",
  "title": "Sutton Lee Seymour",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Sutton Lee Seymour talent_id],
  "description": "Legendary Queen of the stage with an all-new spooky and hilarious Halloween spectacular. The perfect start for an all-gay cruise!"
}
```

**Event 4**

```json
{
  "trip_id": 74,
  "date": "2025-10-25",
  "time": "22:00",
  "title": "Sutton Lee Seymour",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Sutton Lee Seymour talent_id],
  "description": "Legendary Queen of the stage with an all-new spooky and hilarious Halloween spectacular"
}
```

**Event 5**

```json
{
  "trip_id": 74,
  "date": "2025-10-25",
  "time": "21:00",
  "title": "Cacophony Daniels",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Cacophony Daniels talent_id],
  "description": "Direct from the Broadway stage to Atlantis, a drag sensation with a voice as high as her hair!"
}
```

**Event 6**

```json
{
  "trip_id": 74,
  "date": "2025-10-25",
  "time": "23:00",
  "title": "Gay Comedy All-Stars",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Brad Loekle talent_id, Erin Foley talent_id, Dylan Adler talent_id],
  "description": "Atlantis' all-star comics, Brad Loekle, Erin Foley and Dylan Adler take the stage for a night of laughs"
}
```

**Event 7**

```json
{
  "trip_id": 74,
  "date": "2025-10-25",
  "time": "23:00",
  "title": "Piano Bar with Brian Nash",
  "ship_venue_id": [On the Rocks venue_id],
  "event_type_id": 4,
  "party_theme_id": null,
  "talent_ids": [Brian Nash talent_id],
  "description": "Our welcoming and rowdy piano bar, filled with musical surprises. Show tunes, pop hits, requests, and so much more"
}
```

**Event 8**

```json
{
  "trip_id": 74,
  "date": "2025-10-25",
  "time": "23:00",
  "title": "Atlantis Welcome Party",
  "ship_venue_id": [Aquatic Club venue_id],
  "event_type_id": 1,
  "party_theme_id": null,
  "talent_ids": [],
  "description": "Fire up the dance floor with a massive musical start"
}
```

### Sunday October 26 - Key West - 7 events

**Event 9**

```json
{
  "trip_id": 74,
  "date": "2025-10-26",
  "time": "17:00",
  "title": "Dog Tag T-Dance",
  "ship_venue_id": [Aquatic Club venue_id],
  "event_type_id": 1,
  "party_theme_id": [Dog Tag T-Dance party_theme_id],
  "talent_ids": [],
  "description": "Atlantis' most infamous afternoon party. A little green, red, or yellow can go a long way. Dog tags for everyone!"
}
```

**Event 10**

```json
{
  "trip_id": 74,
  "date": "2025-10-26",
  "time": "19:30",
  "title": "Duel Reality",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Duel Reality talent_id],
  "description": "A dazzling, modern, & sexy acrobatic retelling of Romeo and Juliet. Watch as two warring groups grapple through graceful and death-defying acts"
}
```

**Event 11**

```json
{
  "trip_id": 74,
  "date": "2025-10-26",
  "time": "22:00",
  "title": "Duel Reality",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Duel Reality talent_id],
  "description": "A dazzling, modern, & sexy acrobatic retelling of Romeo and Juliet"
}
```

**Event 12**

```json
{
  "trip_id": 74,
  "date": "2025-10-26",
  "time": "21:00",
  "title": "The Diva Goes West",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [The Diva talent_id],
  "description": "Virgin's super-talented Diva takes the stage to drag you out West with twisted tales and soaring vocals!"
}
```

**Event 13**

```json
{
  "trip_id": 74,
  "date": "2025-10-26",
  "time": "23:00",
  "title": "Christina Bianco",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Christina Bianco talent_id],
  "description": "Acclaimed cabaret and Broadway star whose versatile vocals and celebrity impressions have been the hit of the NY scene. She'll bring legends like Barbra, Celine, and Britney to life!"
}
```

**Event 14**

```json
{
  "trip_id": 74,
  "date": "2025-10-26",
  "time": "23:00",
  "title": "Piano Bar with Ge Enrique",
  "ship_venue_id": [On the Rocks venue_id],
  "event_type_id": 4,
  "party_theme_id": null,
  "talent_ids": [Ge Enrique talent_id],
  "description": "Piano bar entertainment with show tunes and pop medleys"
}
```

**Event 15**

```json
{
  "trip_id": 74,
  "date": "2025-10-26",
  "time": "23:00",
  "title": "Washed Up",
  "ship_venue_id": [Aquatic Club venue_id],
  "event_type_id": 1,
  "party_theme_id": [Washed Up party_theme_id],
  "talent_ids": [],
  "description": "As we head deep into the Caribbean, creatures above and below the water line wash up on shore for a night of nautical silliness. Colorful sea creatures meet marauding pirates alongside a few mythical characters"
}
```

### Monday October 27 - At Sea - 8 events

**Event 16**

```json
{
  "trip_id": 74,
  "date": "2025-10-27",
  "time": "14:00",
  "title": "Bingo with Miss Richfield & The Diva",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 5,
  "party_theme_id": null,
  "talent_ids": [Miss Richfield 1981 talent_id, The Diva talent_id],
  "description": "Pure silliness and camp craziness when our own Miss Richfield joins The Diva for a hilarious bingo session unlike any other"
}
```

**Event 17**

```json
{
  "trip_id": 74,
  "date": "2025-10-27",
  "time": "16:30",
  "title": "Twisted Pink T-Dance",
  "ship_venue_id": [Aquatic Club venue_id],
  "event_type_id": 1,
  "party_theme_id": [Twisted Pink T-Dance party_theme_id],
  "talent_ids": [],
  "description": "Let your imagination run wild and play out your favorite pink look for a hot afternoon of frivolous dolled up fun"
}
```

**Event 18**

```json
{
  "trip_id": 74,
  "date": "2025-10-27",
  "time": "19:30",
  "title": "Miss Richfield 1981",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Miss Richfield 1981 talent_id],
  "description": "Professional beauty queen and on-trend fashion gal Miss Richfield 1981 celebrates our wonderfully medicated world with her new show 'There's A Pill For That!'"
}
```

**Event 19**

```json
{
  "trip_id": 74,
  "date": "2025-10-27",
  "time": "22:00",
  "title": "Miss Richfield 1981",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Miss Richfield 1981 talent_id],
  "description": "Professional beauty queen - There's A Pill For That!"
}
```

**Event 20**

```json
{
  "trip_id": 74,
  "date": "2025-10-27",
  "time": "21:00",
  "title": "Sutton Lee Seymour",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Sutton Lee Seymour talent_id],
  "description": "She's back with a sizzling cabaret show for a more intimate set of hilarious songs and dynamic banter"
}
```

**Event 21**

```json
{
  "trip_id": 74,
  "date": "2025-10-27",
  "time": "23:00",
  "title": "Gay Comedy Stars",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Erin Foley talent_id, Dylan Adler talent_id],
  "description": "Tonight starring Erin Foley and Dylan Adler!"
}
```

**Event 22**

```json
{
  "trip_id": 74,
  "date": "2025-10-27",
  "time": "23:00",
  "title": "Piano Bar with Brian Nash",
  "ship_venue_id": [On the Rocks venue_id],
  "event_type_id": 4,
  "party_theme_id": null,
  "talent_ids": [Brian Nash talent_id],
  "description": "Piano bar with Brian Nash"
}
```

**Event 23**

```json
{
  "trip_id": 74,
  "date": "2025-10-27",
  "time": "23:00",
  "title": "Atlantis Classics",
  "ship_venue_id": [Aquatic Club venue_id],
  "event_type_id": 1,
  "party_theme_id": null,
  "talent_ids": [],
  "description": "Celebrate three decades of Atlantis dance music with the big anthems, diva voices and classic sounds that sound amazing today!"
}
```

### Tuesday October 28 - Puerto Plata - 7 events

**Event 24**

```json
{
  "trip_id": 74,
  "date": "2025-10-28",
  "time": "17:30",
  "title": "Up with Twist",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 3,
  "party_theme_id": null,
  "talent_ids": [Up With a Twist talent_id],
  "description": "New! An immersive experience with a touch of glamour and unpredictability. Dine in style while Virgin's sizzling performers put a modern spin on vintage tunes. Extra charge for incredible dining and seriously playful drinks!"
}
```

**Event 25**

```json
{
  "trip_id": 74,
  "date": "2025-10-28",
  "time": "19:30",
  "title": "Solea Pfieffer",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Solea Pfieffer talent_id],
  "description": "New! Broadway's hottest new diva, direct from a star role in Moulin Rouge! From Hamilton to Hadestown, pop to R&B, she's here to thrill and dazzle!"
}
```

**Event 26**

```json
{
  "trip_id": 74,
  "date": "2025-10-28",
  "time": "22:00",
  "title": "Solea Pfieffer",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Solea Pfieffer talent_id],
  "description": "Broadway's hottest new diva - Solea Pfieffer"
}
```

**Event 27**

```json
{
  "trip_id": 74,
  "date": "2025-10-28",
  "time": "21:00",
  "title": "Cacophony Daniels",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Cacophony Daniels talent_id],
  "description": "Broadway and pop drag sensation"
}
```

**Event 28**

```json
{
  "trip_id": 74,
  "date": "2025-10-28",
  "time": "23:00",
  "title": "Comedian Erin Foley",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Erin Foley talent_id],
  "description": "A hilarious solo set from one of the USA's most dynamic and talented lesbian comedians. She's an Atlantis legend ready with stories from her time surrounded by gay men around the world!"
}
```

**Event 29**

```json
{
  "trip_id": 74,
  "date": "2025-10-28",
  "time": "23:00",
  "title": "Piano Bar with Ge Enrique",
  "ship_venue_id": [On the Rocks venue_id],
  "event_type_id": 4,
  "party_theme_id": null,
  "talent_ids": [Ge Enrique talent_id],
  "description": "Piano bar entertainment"
}
```

**Event 30**

```json
{
  "trip_id": 74,
  "date": "2025-10-29",
  "time": "00:00",
  "title": "Neon Playground",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 1,
  "party_theme_id": [Neon Playground party_theme_id],
  "talent_ids": [],
  "description": "Fast, flashy, bright, and silly! We're turning the Red Room into a musical playground bathed in laser light and filled with bouncy sounds to make you smile"
}
```

### Wednesday October 29 - Grand Turk - 6 events

**Event 31**

```json
{
  "trip_id": 74,
  "date": "2025-10-29",
  "time": "19:30",
  "title": "Red Hot",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Red Hot talent_id],
  "description": "An all-new Virgin production show paying tribute to their musical roots through thrilling choreography, iconic performance and dazzling staging!"
}
```

**Event 32**

```json
{
  "trip_id": 74,
  "date": "2025-10-29",
  "time": "22:00",
  "title": "Red Hot",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Red Hot talent_id],
  "description": "Virgin production show - Red Hot"
}
```

**Event 33**

```json
{
  "trip_id": 74,
  "date": "2025-10-29",
  "time": "19:00",
  "title": "Christina Bianco",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Christina Bianco talent_id],
  "description": "Acclaimed cabaret and Broadway star"
}
```

**Event 34**

```json
{
  "trip_id": 74,
  "date": "2025-10-29",
  "time": "21:00",
  "title": "Haus of Dylan",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Dylan Adler talent_id],
  "description": "Comedian Dylan Adler presents a hilarious solo show, injected with songs, personal anecdotes, even acrobatics, directly from the Edinburgh Fringe"
}
```

**Event 35**

```json
{
  "trip_id": 74,
  "date": "2025-10-29",
  "time": "23:00",
  "title": "Piano Bar with Brian Nash",
  "ship_venue_id": [On the Rocks venue_id],
  "event_type_id": 4,
  "party_theme_id": null,
  "talent_ids": [Brian Nash talent_id],
  "description": "Piano bar with Brian Nash"
}
```

**Event 36**

```json
{
  "trip_id": 74,
  "date": "2025-10-29",
  "time": "23:00",
  "title": "Ghostly White Party",
  "ship_venue_id": [Aquatic Club venue_id],
  "event_type_id": 1,
  "party_theme_id": [Ghostly White party_theme_id],
  "talent_ids": [],
  "description": "Step out of the shadows in dazzling white for a night of haunting fun at sea. Glow under the lights, dance with spirits, and bring your most spectral, spooky-chic looks"
}
```

### Thursday October 30 - At Sea - 5 events

**Event 37**

```json
{
  "trip_id": 74,
  "date": "2025-10-30",
  "time": "18:30",
  "title": "Murder in the Manor",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 5,
  "party_theme_id": null,
  "talent_ids": [Murder in the Manor talent_id],
  "description": "An interactive mystery somewhere between Scooby-Doo and Haunted Mansion, with plenty of tongue-in-cheek humor, 80s-inspired costumes, synth pop soundtrack, and moody staging"
}
```

**Event 38**

```json
{
  "trip_id": 74,
  "date": "2025-10-30",
  "time": "19:30",
  "title": "AirOtic",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [AirOtic talent_id],
  "description": "The sexiest, gayest, and most outrageous acrobatic show you've ever seen, designed and produced by Les Farfadais exclusively for Atlantis!"
}
```

**Event 39**

```json
{
  "trip_id": 74,
  "date": "2025-10-30",
  "time": "22:00",
  "title": "AirOtic",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [AirOtic talent_id],
  "description": "The sexiest, gayest acrobatic show - AirOtic"
}
```

**Event 40**

```json
{
  "trip_id": 74,
  "date": "2025-10-30",
  "time": "21:30",
  "title": "Christina Bianco",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Christina Bianco talent_id],
  "description": "Vocal impressionist Christina Bianco"
}
```

**Event 41**

```json
{
  "trip_id": 74,
  "date": "2025-10-30",
  "time": "23:00",
  "title": "Hallow-weird",
  "ship_venue_id": null,
  "event_type_id": 1,
  "party_theme_id": [Hallow-weird party_theme_id],
  "talent_ids": [],
  "description": "As the clock heads towards Halloween, our ship suddenly is filled with creatures from beyond our world. Tour our haunted hull at your own risk. Be back on deck for a spirited costume parade and gathering of the LGBT (Lost, Ghostly, Bizarre, and Terrifying) community"
}
```

_Note: Ship-wide event, no specific venue_

### Friday October 31 - Bimini (Halloween) - 8 events

**Event 42**

```json
{
  "trip_id": 74,
  "date": "2025-10-31",
  "time": "12:30",
  "title": "Halloween Pool Games",
  "ship_venue_id": [Bimini Pool venue_id],
  "event_type_id": 5,
  "party_theme_id": null,
  "talent_ids": [],
  "description": "Ben takes you back to zany Halloween silliness of your youth with some spooky prizes and fun for all"
}
```

**Event 43**

```json
{
  "trip_id": 74,
  "date": "2025-10-31",
  "time": "16:30",
  "title": "Thriller T-Dance",
  "ship_venue_id": [Aquatic Club venue_id],
  "event_type_id": 1,
  "party_theme_id": [Thriller T-Dance party_theme_id],
  "talent_ids": [],
  "description": "It's gonna be one thriller of an afternoon filled with the demons of the dance floor that never stopped moving as we celebrate the music that never dies from the heyday of the Disco era"
}
```

**Event 44**

```json
{
  "trip_id": 74,
  "date": "2025-10-31",
  "time": "19:30",
  "title": "Murder in the Manor",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 5,
  "party_theme_id": null,
  "talent_ids": [Murder in the Manor talent_id],
  "description": "Interactive mystery show"
}
```

**Event 45**

```json
{
  "trip_id": 74,
  "date": "2025-10-31",
  "time": "20:00",
  "title": "Brad's Last Laugh",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Brad Loekle talent_id],
  "description": "Legendary gay comic Brad Loekle has been watching you all week and will make sure you're ready to head back to the 'real' world with a huge smile"
}
```

**Event 46**

```json
{
  "trip_id": 74,
  "date": "2025-10-31",
  "time": "22:00",
  "title": "Brad's Last Laugh",
  "ship_venue_id": [Red Room venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Brad Loekle talent_id],
  "description": "Brad Loekle - Last Laugh"
}
```

**Event 47**

```json
{
  "trip_id": 74,
  "date": "2025-10-31",
  "time": "23:00",
  "title": "Cacophony Daniels",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 2,
  "party_theme_id": null,
  "talent_ids": [Cacophony Daniels talent_id],
  "description": "Drag sensation Cacophony Daniels"
}
```

**Event 48**

```json
{
  "trip_id": 74,
  "date": "2025-10-31",
  "time": "23:00",
  "title": "Piano Bar with Brian Nash",
  "ship_venue_id": [On the Rocks venue_id],
  "event_type_id": 4,
  "party_theme_id": null,
  "talent_ids": [Brian Nash talent_id],
  "description": "Final piano bar session"
}
```

**Event 49**

```json
{
  "trip_id": 74,
  "date": "2025-11-01",
  "time": "00:00",
  "title": "Last Dance",
  "ship_venue_id": [The Manor venue_id],
  "event_type_id": 7,
  "party_theme_id": null,
  "talent_ids": [],
  "description": "A few moments to dance it out as we sail into Miami"
}
```

---

## 📝 Implementation Notes

### Date & Time Handling

- **CRITICAL**: All dates/times are in LOCAL timezone (destination timezone)
- **NO timezone conversions** per CLAUDE.md Rule #1
- Store dates as: `YYYY-MM-DD` (e.g., "2025-10-25")
- Store times as: `HH:MM` in 24-hour format (e.g., "17:00" for 5 PM)

### Foreign Key Dependencies

- Events MUST reference valid `ship_venue_id` from Step 2
- Events MUST reference valid `talent_ids` from Step 3
- Events MUST reference valid `event_type_id` (already exists in DB)
- Events MAY reference `party_theme_id` (already assigned to trip)

### Talent IDs in Events

- Store as JSONB array: `[talent_id1, talent_id2, ...]`
- Empty array `[]` for events without specific talent (parties, orientation, etc.)
- Single talent: `[talent_id]`
- Multiple talent: `[talent_id1, talent_id2, talent_id3]`

### Image Storage

- Per CLAUDE.md Rule #5: ALL images must be in Supabase storage
- No external image URLs allowed
- If adding images later, download and upload to Supabase first

### Validation Checklist

Before executing:

- [ ] Verify ship_id 12 exists for Brilliant Lady
- [ ] Verify all venue_type_ids exist (1=Restaurant, 2=Entertainment, 7=Casual Dining)
- [ ] Verify all talent_category_ids exist (2=Vocalists, 3=Drag, 5=Cabaret, 6=Comedy, 7=Shows)
- [ ] Verify all event_type_ids exist (1=party, 2=show, 3=dining, 4=lounge, 5=fun, 7=after, 8=social)
- [ ] Get party_theme_ids for: Dog Tag T-Dance, Washed Up, Twisted Pink, Neon Playground, Ghostly White, Thriller, Hallow-weird

---

## 🎯 Success Criteria

After execution, verify:

1. ✅ Brilliant Lady has 15 amenities linked
2. ✅ Brilliant Lady has 14 venues created
3. ✅ 12 new talent records exist
4. ✅ 20 talent linked to trip 74
5. ✅ 12 trip info sections created
6. ✅ 12 sections assigned to trip 74
7. ✅ 33 FAQs created
8. ✅ 33 FAQs assigned to trip 74
9. ✅ 48 events created for trip 74
10. ✅ All events have valid venue references
11. ✅ All events have proper talent_ids arrays
12. ✅ Party-themed events have party_theme_id set

---

**Document Created**: 2025-10-20
**Source PDF**: `pdf/HW25-Cruise-vacation-guide-FINAL.pdf`
**Database**: Supabase (bxiiodeyqvqqcgzzqzvt)
**Ready for Execution**: Yes (after final review)
