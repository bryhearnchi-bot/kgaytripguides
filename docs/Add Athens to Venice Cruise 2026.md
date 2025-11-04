# Athens to Venice Cruise (July 2026) - Import Plan

## Cruise Details

- **Name:** Greek Isles, Turkey, & Dalmatian Coast Cruise
- **Dates:** July 5-15, 2026 (11 days)
- **Ship:** Virgin Voyages Scarlet Lady
- **Embarkation:** Athens (Piraeus), Greece
- **Disembarkation:** Venice (Trieste), Italy
- **Source:** https://atlantisevents.com/vacation/athven2six/

## Itinerary

| Day | Date       | Port                     | Arrival | Departure | Type                   |
| --- | ---------- | ------------------------ | ------- | --------- | ---------------------- |
| 1   | 2026-07-05 | Athens (Piraeus), Greece | -       | 19:00     | Embark                 |
| 2   | 2026-07-06 | Mykonos, Greece          | 10:00   | 02:30     | Port                   |
| 3   | 2026-07-07 | Kuşadası, Turkey         | 09:00   | 15:30     | Port                   |
| 4   | 2026-07-08 | Istanbul, Turkey         | 13:00   | -         | Port (Overnight)       |
| 5   | 2026-07-09 | Istanbul, Turkey         | -       | 18:00     | Port (Overnight cont.) |
| 6   | 2026-07-10 | Day at Sea               | -       | -         | Sea Day                |
| 7   | 2026-07-11 | Santorini, Greece        | 09:00   | 22:00     | Port                   |
| 8   | 2026-07-12 | Day at Sea               | -       | -         | Sea Day                |
| 9   | 2026-07-13 | Dubrovnik, Croatia       | 08:00   | 18:00     | Port                   |
| 10  | 2026-07-14 | Zadar, Croatia           | 10:00   | 17:00     | Port                   |
| 11  | 2026-07-15 | Venice (Trieste), Italy  | 07:00   | -         | Disembark              |

## Ship: Virgin Voyages Scarlet Lady

**Status:** ✅ EXISTS IN DATABASE (ID: 16)

- Venues: 10 existing
- Amenities: 9 existing
- **NO RESEARCH NEEDED**

## Locations

### Existing Locations (Complete Data - NO RESEARCH NEEDED)

1. **Athens (Piraeus)** - ID: 1 ✅
   - 3 attractions, 3 LGBT venues

2. **Mykonos, Greece** - ID: 3 ✅
   - 3 attractions, 3 LGBT venues

3. **Kuşadası, Turkey** - ID: 5 ✅
   - 3 attractions, 3 LGBT venues

4. **Istanbul, Turkey** - ID: 4 ✅
   - 3 attractions, 3 LGBT venues

5. **Santorini, Greece** - ID: 2 ✅
   - 3 attractions, 3 LGBT venues

### New Locations (Research Completed)

#### 6. Dubrovnik, Croatia 🆕

**Description:**
Known as the "Pearl of the Adriatic," Dubrovnik features stunning medieval city walls and baroque architecture. The UNESCO-listed Old Town offers breathtaking views from its 2km fortifications.

**Top 3 Attractions:**

1. **City Walls** - 2km of 13th-17th century fortifications with 16 towers and bastions offering stunning Adriatic views
2. **Rector's Palace** - Gothic-Renaissance palace (15th century) housing city museum with medieval church art
3. **Old Town (Stradun)** - 300m limestone pedestrian street with baroque churches and historic Pile Gate

**Top 3 LGBT Venues:**

1. **MILK Bar** - Dubrovnik's first and only official gay bar, opened May 2022 in the Old Town
2. **The Troubadour** - Popular hangout for LGBT and straight locals, located next to the cathedral
3. **Culture Club Revelin** - Large nightclub built inside a Medieval fortress, attracts gay travelers

**Image:** (To be sourced from Unsplash/Pexels)

---

#### 7. Zadar, Croatia 🆕

**Description:**
Zadar blends ancient Roman ruins with innovative modern art installations. Famous for its unique Sea Organ and Greeting to the Sun, this coastal city offers a distinctive combination of history and contemporary creativity.

**Top 3 Attractions:**

1. **Sea Organ** - Unique architectural installation creating music from ocean waves through stone channels
2. **Greeting to the Sun** - 22m solar-powered light show representing the Solar System movements
3. **Church of St. Donatus** - 9th-century Pre-Romanesque building with excellent acoustics for concerts

**Top 3 LGBT Venues:**
⚠️ **Note:** Zadar has no dedicated LGBT venues. The city is described as LGBT-friendly and welcoming, but gay nightlife is concentrated in Zagreb (capital). Options:

1. **Kolovare Beach** - Popular LGBTQ-friendly beach with welcoming atmosphere, walking distance from center
2. **Old Town Cafes & Bars** - General venues throughout the historic center, city is accepting and inclusive
3. **Hotel Delfin & Gay-Friendly Hotels** - LGBT-welcoming accommodations and their bar areas

**Image:** (To be sourced from Unsplash/Pexels)

---

#### 8. Venice (Trieste), Italy 🆕

**Description:**
Trieste serves as the cruise port for Venice due to large ship restrictions. This elegant Habsburg port city features grand architecture, hilltop views, and a famous coffee culture, offering its own distinct charm on the Adriatic.

**Top 3 Attractions:**

1. **Miramare Castle** - Stunning white Habsburg palace (1855-60) on a cliff with 22-hectare park
2. **Piazza Unità d'Italia** - Europe's largest sea-facing square with grand Habsburg architecture
3. **Cathedral of San Giusto** - Romanesque-Byzantine cathedral atop hill with panoramic Adriatic views

**Top 3 LGBT Venues:**
⚠️ **Note:** Trieste/Venice area has a very small LGBT scene. Venice is "exceptionally gay-friendly" but minimal dedicated venues exist. Options:

1. **Venice City** - Entire historic city is gay-friendly and welcoming, no dedicated scene needed
2. **Trash & Chic (Venice Marghera)** - Gay-friendly disco venue on the mainland side of Venice
3. **Waterfront Cafes & Bars (Trieste)** - General welcoming venues along the beautiful waterfront

**Image:** (To be sourced from Unsplash/Pexels)

---

## Import Notes

### Critical Requirements:

- ✅ Use TIMESTAMP strings (no timezone conversions): "2026-07-05 00:00:00"
- ✅ Upload all images to Supabase Storage
- ✅ Ship exists (ID: 16) - link to existing ship
- ✅ 5 locations exist with complete data - NO research needed
- ✅ 3 new locations researched - CREATE in database

### Location Type IDs:

- 1 = Embark
- 2 = Disembark
- 3 = Port
- 4 = Sea Day

### Istanbul Overnight Handling:

Istanbul spans days 4-5 with overnight stay. Will create 2 itinerary entries:

- Day 4: Istanbul arrival 13:00, no departure
- Day 5: Istanbul departure 18:00, no arrival

### LGBT Venue Reality Check:

- ✅ Dubrovnik has dedicated venues
- ⚠️ Zadar has no dedicated LGBT venues (general LGBT-friendly city)
- ⚠️ Trieste/Venice minimal LGBT scene (but very welcoming)

This reflects the reality that smaller European cities may not have dedicated gay bars but are still welcoming to LGBT travelers.

---

## Next Steps

1. ✅ Research completed
2. 🔄 Get user approval on research findings
3. Create import script: `scripts/import-athens-to-venice-2026.ts`
4. Download and upload images to Supabase Storage
5. Execute import with user confirmation
6. Verify in browser
7. Deploy to production
