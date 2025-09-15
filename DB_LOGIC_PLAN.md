# Database Logic Restructuring Plan

## Current Problem
The current database structure has redundant data and doesn't properly separate reusable entities from trip-specific ones. This leads to:
- Duplicate port/location data across trips
- Party information mixed with events (parties are reusable, events are trip-specific)
- No way to reuse locations/parties across multiple trips
- Inefficient data management

---

## Proposed New Structure

### Core Entities (Reusable)
1. **Ports/Locations** - Reusable across trips
2. **Talent** - Already implemented correctly
3. **Parties** - Reusable party templates/themes
4. **Party Templates** - Base party configurations

### Trip-Specific Entities
1. **Trips/Cruises** - Specific voyage
2. **Itinerary** - Trip-specific schedule, references ports
3. **Events** - Trip-specific events, composed of talent + parties
4. **Trip Info Sections** - Trip-specific information

---

## Phase 1: Create New Tables & Relationships

### 1.1 Ports/Locations Table
```sql
CREATE TABLE ports (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  region TEXT,
  coordinates JSONB, -- {lat, lng}
  timezone TEXT,
  description TEXT,
  port_image_url TEXT,
  port_type TEXT, -- 'port', 'sea_day', 'embark', 'disembark'
  popular_attractions TEXT[],
  port_info JSONB, -- Additional port details
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(name, country)
);

-- Add indexes
CREATE INDEX idx_ports_name ON ports(name);
CREATE INDEX idx_ports_country ON ports(country);
CREATE INDEX idx_ports_type ON ports(port_type);
```

### 1.2 Parties Table (Extracted from Events)
```sql
CREATE TABLE parties (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  theme TEXT,
  description TEXT,
  party_image_url TEXT,
  dress_code TEXT,
  music_genre TEXT[],
  venue_type TEXT, -- 'pool', 'club', 'deck', 'theater'
  duration_hours INTEGER,
  capacity INTEGER,
  age_restriction TEXT,
  party_metadata JSONB, -- Additional party details
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_parties_theme ON parties(theme);
CREATE INDEX idx_parties_venue ON parties(venue_type);
CREATE INDEX idx_parties_active ON parties(is_active);
```

### 1.3 Updated Itinerary Table (References Ports)
```sql
-- Update existing itinerary table
ALTER TABLE itinerary ADD COLUMN port_id INTEGER REFERENCES ports(id);
ALTER TABLE itinerary ADD COLUMN arrival_time TIME;
ALTER TABLE itinerary ADD COLUMN departure_time TIME;
ALTER TABLE itinerary ADD COLUMN is_sea_day BOOLEAN DEFAULT false;

-- Remove redundant columns after migration
-- ALTER TABLE itinerary DROP COLUMN location; -- After data migration
-- ALTER TABLE itinerary DROP COLUMN port_image_url; -- After data migration
```

### 1.4 Updated Events Table (References Talent + Parties)
```sql
-- Update existing events table
ALTER TABLE events ADD COLUMN party_id INTEGER REFERENCES parties(id);
ALTER TABLE events ADD COLUMN primary_talent_id INTEGER REFERENCES talent(id);
ALTER TABLE events ADD COLUMN venue TEXT;
ALTER TABLE events ADD COLUMN capacity INTEGER;
ALTER TABLE events ADD COLUMN ticket_required BOOLEAN DEFAULT false;

-- Junction table for multiple talents per event
CREATE TABLE event_talent (
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  talent_id INTEGER REFERENCES talent(id) ON DELETE CASCADE,
  role TEXT, -- 'headliner', 'support', 'host', 'special_guest'
  performance_order INTEGER,
  PRIMARY KEY (event_id, talent_id)
);
```

---

## Phase 2: Data Migration Strategy

### 2.1 Extract Ports from Existing Itinerary
```sql
-- Step 1: Create ports from unique locations in itinerary
INSERT INTO ports (name, country, description, port_image_url, port_type)
SELECT DISTINCT
  location as name,
  CASE
    WHEN location ILIKE '%greece%' THEN 'Greece'
    WHEN location ILIKE '%turkey%' THEN 'Turkey'
    WHEN location ILIKE '%egypt%' THEN 'Egypt'
    -- Add more country mappings
    ELSE 'Unknown'
  END as country,
  description,
  port_image_url,
  CASE
    WHEN location ILIKE '%sea day%' OR location ILIKE '%at sea%' THEN 'sea_day'
    ELSE 'port'
  END as port_type
FROM itinerary
WHERE location IS NOT NULL;

-- Step 2: Update itinerary to reference ports
UPDATE itinerary
SET port_id = ports.id
FROM ports
WHERE itinerary.location = ports.name;
```

### 2.2 Extract Parties from Existing Events
```sql
-- Step 1: Create parties from unique party themes in events
INSERT INTO parties (name, theme, description, party_image_url, venue_type)
SELECT DISTINCT
  title as name,
  COALESCE(theme, 'General') as theme,
  description,
  image_url as party_image_url,
  CASE
    WHEN title ILIKE '%pool%' THEN 'pool'
    WHEN title ILIKE '%deck%' THEN 'deck'
    WHEN title ILIKE '%club%' THEN 'club'
    WHEN title ILIKE '%theater%' OR title ILIKE '%show%' THEN 'theater'
    ELSE 'general'
  END as venue_type
FROM events
WHERE type = 'party' OR title ILIKE '%party%';

-- Step 2: Update events to reference parties
UPDATE events
SET party_id = parties.id
FROM parties
WHERE events.title = parties.name AND events.type = 'party';
```

### 2.3 Link Existing Talent to Events
```sql
-- Insert existing talent relationships
INSERT INTO event_talent (event_id, talent_id, role)
SELECT DISTINCT
  events.id as event_id,
  talent.id as talent_id,
  'headliner' as role
FROM events
JOIN talent ON talent.name = events.performer -- Assuming performer field exists
WHERE events.performer IS NOT NULL;
```

---

## Phase 3: Update Application Logic

### 3.1 New Storage Classes
```typescript
// PortStorage class
export interface IPortStorage {
  getAllPorts(): Promise<Port[]>;
  getPortById(id: number): Promise<Port | undefined>;
  getPortsByCountry(country: string): Promise<Port[]>;
  searchPorts(search: string): Promise<Port[]>;
  createPort(port: Omit<Port, 'id' | 'createdAt' | 'updatedAt'>): Promise<Port>;
  updatePort(id: number, port: Partial<Port>): Promise<Port | undefined>;
  deletePort(id: number): Promise<void>;
}

// PartyStorage class
export interface IPartyStorage {
  getAllParties(): Promise<Party[]>;
  getPartyById(id: number): Promise<Party | undefined>;
  getPartiesByTheme(theme: string): Promise<Party[]>;
  getActiveParties(): Promise<Party[]>;
  createParty(party: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>): Promise<Party>;
  updateParty(id: number, party: Partial<Party>): Promise<Party | undefined>;
  deleteParty(id: number): Promise<void>;
}
```

### 3.2 Updated Itinerary Logic
```typescript
// Updated ItineraryStorage
async getItineraryWithPorts(cruiseId: number): Promise<ItineraryWithPort[]> {
  return await db.select({
    id: itinerary.id,
    cruiseId: itinerary.cruiseId,
    date: itinerary.date,
    arrivalTime: itinerary.arrivalTime,
    departureTime: itinerary.departureTime,
    isSeaDay: itinerary.isSeaDay,
    orderIndex: itinerary.orderIndex,
    port: {
      id: ports.id,
      name: ports.name,
      country: ports.country,
      description: ports.description,
      portImageUrl: ports.portImageUrl,
      portType: ports.portType
    }
  })
  .from(itinerary)
  .leftJoin(ports, eq(itinerary.portId, ports.id))
  .where(eq(itinerary.cruiseId, cruiseId))
  .orderBy(asc(itinerary.orderIndex));
}
```

### 3.3 Updated Events Logic
```typescript
// Updated EventStorage
async getEventsWithDetails(cruiseId: number): Promise<EventWithDetails[]> {
  return await db.select({
    id: events.id,
    title: events.title,
    date: events.date,
    time: events.time,
    venue: events.venue,
    capacity: events.capacity,
    party: {
      id: parties.id,
      name: parties.name,
      theme: parties.theme,
      description: parties.description,
      partyImageUrl: parties.partyImageUrl
    },
    talents: [] // Populated separately via junction table
  })
  .from(events)
  .leftJoin(parties, eq(events.partyId, parties.id))
  .where(eq(events.cruiseId, cruiseId));
}
```

---

## Phase 4: Admin Interface Updates

### 4.1 Port Management Interface with AI Research
```typescript
// New PortManager component with AI research
- Port library with search/filter
- Port details editor with AI research integration
- "Research This Port" button - Uses Perplexity MCP to gather:
  * Port information, attractions, history
  * Weather patterns and best visiting times
  * Local customs and cultural information
  * Transportation and logistics
  * Recent news and updates
  * Popular restaurants and shopping
- Port image management with AI suggestions
- Country/region organization
- Reusable port selection for itinerary
- Auto-fill from research data
- Research history and caching
```

### 4.2 Party Management Interface with AI Research
```typescript
// New PartyManager component with AI
- Party theme library
- Party template editor with AI enhancement
- "Research This Theme" button - Uses Perplexity MCP for:
  * Similar party themes and variations
  * Music recommendations and playlists
  * Decoration and venue ideas
  * Trending party concepts
- Reusable party selection for events
- Party image and details management with AI suggestions
- Theme categorization
- Auto-fill from AI research
```

### 4.3 Updated Itinerary Tab
```typescript
// Enhanced ItineraryTab
- Port selection dropdown (from port library)
- Create new port option
- Auto-complete for existing ports
- Port information display
- Bulk port operations
```

### 4.4 Updated Events Tab
```typescript
// Enhanced EventsTab
- Party selection from library
- Talent selection (multiple)
- Event composition (party + talents)
- Event scheduling and conflict detection
- Venue management
```

---

## Phase 5: Data Relationships Summary

### Before (Current Structure)
```
trips → itinerary (location text, redundant data)
trips → events (mixed party/event data)
trips → talent (via cruise_talent junction - ✓ correct)
```

### After (New Structure)
```
trips → itinerary → ports (normalized, reusable)
trips → events → parties (reusable party templates)
trips → events → talents (via event_talent junction)
ports (independent, reusable)
parties (independent, reusable)
talents (independent, reusable) ✓ already correct
```

---

## Benefits of New Structure

### 1. Data Normalization
- No duplicate port information
- Reusable party templates
- Consistent talent management
- Cleaner separation of concerns

### 2. Administrative Efficiency
- Create port once, use everywhere
- Party templates for quick event creation
- Bulk operations on reusable entities
- Better data consistency

### 3. AI Integration Benefits
- AI can suggest existing ports when extracting itineraries
- Party templates make event creation faster
- Better data for training and suggestions
- Reduced duplicate AI processing

### 4. Future Scalability
- Easy to add new trips without data duplication
- Port information can be enhanced globally
- Party library grows over time
- Better analytics and reporting

---

## Implementation Priority

### Week 1: Database Changes
1. **Day 1-2**: Create new tables (ports, parties, updated relationships)
2. **Day 3-4**: Write and test migration scripts
3. **Day 5**: Execute migration with backups

### Week 2: Application Updates
1. **Day 1-2**: Update storage classes and interfaces
2. **Day 3-4**: Update admin components
3. **Day 5**: Testing and validation

### Impact on Main Migration Plan
- **Storage Migration**: Same process, but with normalized structure
- **AI Implementation**: Enhanced with reusable entity recognition
- **Admin Interface**: More sophisticated with entity management
- **Data Quality**: Better due to normalization

---

## Success Metrics

### Data Quality
- [ ] 0 duplicate ports across trips
- [ ] All parties properly categorized
- [ ] All events properly linked to parties and talents
- [ ] No orphaned data

### Performance
- [ ] Faster itinerary loading (JOIN vs text search)
- [ ] Efficient party/port selection
- [ ] Optimized database queries
- [ ] Reduced storage size

### User Experience
- [ ] Port selection autocomplete works
- [ ] Party library is intuitive
- [ ] Event creation is streamlined
- [ ] Bulk operations function correctly

---

## Notes
- Execute this BEFORE the main migration to Supabase
- Keep backups of current structure
- Test thoroughly with existing data
- Update AI prompts to work with new structure
- Document new relationships clearly

*This restructuring creates a solid foundation for the AI-powered features and makes the admin interface much more efficient.*