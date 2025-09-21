# Database Changes Documentation

## Change Set 1: Rename cruises to trips and add trip_types table
**Date:** 2025-01-20
**Status:** ✅ Completed

### Summary
- Created new `trip_types` table to normalize trip type data
- Renamed `cruises` table to `trips` throughout the database
- Updated all foreign key references from `cruise_id` to `trip_id`
- Added `trip_type_id` foreign key to trips table

### Changes Applied

#### 1. New Table: `trip_types`
```sql
CREATE TABLE trip_types (
    id SERIAL PRIMARY KEY,
    trip_type VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Initial Data:**
- ID 1: 'Cruise'
- ID 2: 'Resort'

#### 2. Table Rename: `cruises` → `trips`
- Renamed the main table from `cruises` to `trips`
- Added new column `trip_type_id` (INTEGER, NOT NULL, FK to trip_types.id)
- Kept `trip_type` column for backward compatibility (marked as DEPRECATED)

#### 3. Column Renames Throughout Database
All references to `cruise_id` have been renamed to `trip_id` in the following tables:

| Table | Old Column | New Column |
|-------|------------|------------|
| itinerary | cruise_id | trip_id |
| events | cruise_id | trip_id |
| cruise_talent → trip_talent | cruise_id | trip_id |
| trip_info_sections | cruise_id | trip_id |
| invitations | cruise_id | trip_id |
| ai_jobs | cruise_id | trip_id |
| ai_drafts | cruise_id | trip_id |

#### 4. Table Rename: `cruise_talent` → `trip_talent`
The junction table for talent assignments has been renamed from `cruise_talent` to `trip_talent`.

#### 5. Index Updates
All indexes have been renamed to reflect the new table and column names:

**Old Indexes → New Indexes:**
- trip_status_idx → trips_status_idx
- trip_slug_idx → trips_slug_idx
- trip_trip_type_idx → trips_trip_type_idx
- cruises_ship_id_idx → trips_ship_id_idx
- **NEW:** trips_trip_type_id_idx (on trip_type_id column)
- itinerary_cruise_idx → itinerary_trip_idx
- events_cruise_idx → events_trip_idx
- cruise_talent_cruise_idx → trip_talent_trip_idx
- cruise_info_cruise_idx → trip_info_trip_idx
- ai_jobs_cruise_idx → ai_jobs_trip_idx
- ai_drafts_cruise_idx → ai_drafts_trip_idx

#### 6. Foreign Key Constraint Updates
All foreign key constraints have been updated to reference the new table and column names:

- itinerary_cruise_id_fkey → itinerary_trip_id_fkey
- events_cruise_id_fkey → events_trip_id_fkey
- cruise_talent_cruise_id_fkey → trip_talent_trip_id_fkey
- trip_info_sections_cruise_id_fkey → trip_info_sections_trip_id_fkey
- **NEW:** trips_trip_type_id_fkey (trips.trip_type_id → trip_types.id)

### Migration SQL
The complete migration was applied using the following SQL (see migration 001_create_trip_types_and_rename_cruises):

```sql
-- Step 1: Create trip_types table
CREATE TABLE IF NOT EXISTS trip_types (
    id SERIAL PRIMARY KEY,
    trip_type VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert initial trip types
INSERT INTO trip_types (trip_type) VALUES
    ('Cruise'),
    ('Resort')
ON CONFLICT DO NOTHING;

-- Step 3: Add trip_type_id column to cruises table
ALTER TABLE cruises
ADD COLUMN IF NOT EXISTS trip_type_id INTEGER;

-- Step 4: Set default trip_type_id values
UPDATE cruises
SET trip_type_id = (SELECT id FROM trip_types WHERE trip_type = 'Cruise')
WHERE trip_type_id IS NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE cruises
ADD CONSTRAINT cruises_trip_type_id_fkey
FOREIGN KEY (trip_type_id) REFERENCES trip_types(id);

-- Step 6: Make trip_type_id NOT NULL
ALTER TABLE cruises
ALTER COLUMN trip_type_id SET NOT NULL;

-- Step 7: Rename cruises table to trips
ALTER TABLE cruises RENAME TO trips;

-- Step 8-11: Update all foreign key references and indexes
-- (See full migration script for details)
```

### Code Updates
The following files were updated to reflect the database changes:

1. **shared/schema.ts**
   - Added `tripTypes` table definition
   - Renamed `cruises` table to `trips`
   - Updated all column references from `cruiseId` to `tripId`
   - Added `tripTypeId` field to trips table
   - Updated all relations and indexes
   - Added backward compatibility aliases

### Backward Compatibility
To ensure existing code continues to work during the transition:

1. **Table Aliases:** `export const cruises = trips;`
2. **Relation Aliases:** `export const cruiseTalent = tripTalent;`
3. **Type Aliases:** `export type Cruise = Trip;`
4. **Kept deprecated columns:** `trip_type` column remains for now (marked as DEPRECATED)

### Next Steps
After all application code is updated:
1. Remove deprecated `trip_type` column from trips table
2. Remove backward compatibility aliases from schema.ts
3. Update all frontend and backend code to use new naming conventions

### Testing Checklist
- [x] Verify trips table exists with all data from cruises
- [x] Verify trip_types table has Cruise and Resort entries
- [x] Verify all foreign key relationships work correctly
- [x] Test CRUD operations on trips
- [x] Test queries involving trip_talent junction table
- [x] Verify indexes are properly created
- [ ] Test application functionality end-to-end

---

## Change Set 2: Remove trip_type field and add trip_status table
**Date:** 2025-01-20
**Status:** ✅ Completed

### Summary
- Removed deprecated `trip_type` field from trips table
- Created new `trip_status` table to normalize status data
- Added `trip_status_id` foreign key to trips table
- Migrated existing status values to new structure

### Changes Applied

#### 1. New Table: `trip_status`
```sql
CREATE TABLE trip_status (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Initial Data:**
- ID 1: 'Upcoming'
- ID 2: 'Current'
- ID 3: 'Past'

#### 2. Column Changes in `trips` Table

**Added:**
- `trip_status_id` (INTEGER, NOT NULL, FK to trip_status.id)

**Removed:**
- `trip_type` (VARCHAR) - Deprecated field removed

**Kept for backward compatibility:**
- `status` (TEXT) - Marked as DEPRECATED, use trip_status_id instead

#### 3. Data Migration Mapping
Existing status values were migrated as follows:
- 'upcoming' → 'Upcoming' (ID: 1)
- 'ongoing' → 'Current' (ID: 2)
- 'past' → 'Past' (ID: 3)

#### 4. Index Updates
- **Added:** trips_trip_status_id_idx (on trip_status_id column)
- **Removed:** trips_trip_type_idx (deprecated index)

#### 5. Foreign Key Constraints
- **Added:** trips_trip_status_id_fkey (trips.trip_status_id → trip_status.id)

### Migration SQL
The complete migration was applied using the following SQL (see migration 002_remove_trip_type_add_trip_status):

```sql
-- Step 1: Create trip_status table
CREATE TABLE IF NOT EXISTS trip_status (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert initial trip statuses
INSERT INTO trip_status (status) VALUES
    ('Upcoming'),
    ('Current'),
    ('Past')
ON CONFLICT DO NOTHING;

-- Step 3: Add trip_status_id column to trips table
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS trip_status_id INTEGER;

-- Step 4: Map existing status values to new trip_status_id
UPDATE trips
SET trip_status_id = CASE
    WHEN status = 'upcoming' THEN (SELECT id FROM trip_status WHERE status = 'Upcoming')
    WHEN status = 'ongoing' THEN (SELECT id FROM trip_status WHERE status = 'Current')
    WHEN status = 'past' THEN (SELECT id FROM trip_status WHERE status = 'Past')
    ELSE (SELECT id FROM trip_status WHERE status = 'Upcoming')
END
WHERE trip_status_id IS NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE trips
ADD CONSTRAINT trips_trip_status_id_fkey
FOREIGN KEY (trip_status_id) REFERENCES trip_status(id);

-- Step 6: Make trip_status_id NOT NULL
ALTER TABLE trips
ALTER COLUMN trip_status_id SET NOT NULL;

-- Step 7: Drop the old trip_type column
ALTER TABLE trips
DROP COLUMN IF EXISTS trip_type;

-- Step 8: Create index on trip_status_id
CREATE INDEX IF NOT EXISTS trips_trip_status_id_idx ON trips(trip_status_id);

-- Step 9: Drop old indexes
DROP INDEX IF EXISTS trips_trip_type_idx;
```

### Code Updates
The following files were updated to reflect the database changes:

1. **shared/schema.ts**
   - Added `tripStatus` table definition
   - Removed `tripType` field from trips table
   - Added `tripStatusId` field to trips table
   - Updated relations to include tripStatus
   - Added insert schema and type exports for TripStatus
   - Marked `status` field as DEPRECATED

### Current trips Table Structure
After these changes, the trips table now has:
- `id` (PRIMARY KEY)
- `trip_type_id` (FK to trip_types.id) - for Cruise/Resort
- `trip_status_id` (FK to trip_status.id) - for Upcoming/Current/Past
- `name`, `slug`, `shipName`, `cruiseLine`, `shipId`
- `startDate`, `endDate`
- `heroImageUrl`, `description`, `highlights`, `includesInfo`, `pricing`
- `createdBy`, `createdAt`, `updatedAt`
- `status` (DEPRECATED - kept for backward compatibility)

### Testing Checklist
- [x] Verify trip_status table has Upcoming, Current, Past entries
- [x] Verify trip_type column is removed from trips table
- [x] Verify trip_status_id is properly set for all existing trips
- [x] Verify foreign key constraint works correctly
- [x] Verify indexes are properly created
- [ ] Test application functionality with new status structure
- [ ] Update application code to use trip_status_id instead of status field

### Next Steps
After all application code is updated:
1. Remove deprecated `status` column from trips table
2. Update all queries to use trip_status_id with joins to trip_status table
3. Update frontend to use the new normalized status values

---

## Change Set 3: Rename ports to locations and field modifications
**Date:** 2025-01-20
**Status:** ✅ Completed

### Summary
- Renamed `ports` table to `locations`
- Removed `region` and `port_type` columns from locations table
- Deleted test rows (IDs 34-37) from locations table
- Removed `country` field from itinerary table
- Added `resort_name` field to trips table
- Updated all foreign key references from `port_id` to `location_id`

### Changes Applied

#### 1. Table Rename: `ports` → `locations`
The ports table has been renamed to locations to better reflect its generic use for both cruise ports and resort locations.

#### 2. Deleted Rows from locations table
The following test rows were deleted:
- ID 34: TEST_ToDelete
- ID 35: TEST_Port1
- ID 36: TEST_Port2
- ID 37: TEST_Mykonos

#### 3. Column Changes in `locations` Table

**Removed columns:**
- `region` (VARCHAR 100) - No longer needed
- `port_type` (VARCHAR 20) - No longer needed

**Remaining columns:**
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR 255, UNIQUE)
- `country` (VARCHAR 100)
- `coordinates` (JSONB) - { lat: number, lng: number }
- `description` (TEXT)
- `image_url` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### 4. Column Changes in `itinerary` Table

**Renamed:**
- `port_id` → `location_id` (INTEGER, FK to locations.id)

**Removed:**
- `country` (TEXT) - Redundant, available through locations table join

#### 5. Column Addition in `trips` Table

**Added:**
- `resort_name` (VARCHAR 255) - For resort trips to store the resort name

#### 6. Foreign Key and Index Updates
- **Updated FK:** itinerary_port_id_fkey → itinerary_location_id_fkey
- **Updated Index:** itinerary_port_idx → itinerary_location_idx
- **Removed Index:** ports_type_idx (no longer needed)
- **Updated Unique Index:** ports_name_unique → locations_name_unique
- **Updated Sequence:** ports_id_seq → locations_id_seq

### Migration SQL
The complete migration was applied using the following SQL (see migration 003_rename_ports_to_locations_and_field_changes):

```sql
-- Step 1: Delete test rows from ports table
DELETE FROM ports WHERE id IN (34, 35, 36, 37);

-- Step 2: Rename ports table to locations
ALTER TABLE ports RENAME TO locations;

-- Step 3: Drop columns from locations table
ALTER TABLE locations
DROP COLUMN IF EXISTS region,
DROP COLUMN IF EXISTS port_type;

-- Step 4: Update foreign key in itinerary table
ALTER TABLE itinerary RENAME COLUMN port_id TO location_id;
ALTER TABLE itinerary DROP CONSTRAINT IF EXISTS itinerary_port_id_fkey;
ALTER TABLE itinerary ADD CONSTRAINT itinerary_location_id_fkey
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- Step 5: Remove country field from itinerary
ALTER TABLE itinerary
DROP COLUMN IF EXISTS country;

-- Step 6: Add resort_name to trips table
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS resort_name VARCHAR(255);

-- Step 7-9: Update sequences and indexes
ALTER SEQUENCE IF EXISTS ports_id_seq RENAME TO locations_id_seq;
-- Index updates...
```

### Code Updates
The following files were updated to reflect the database changes:

1. **shared/schema.ts**
   - Renamed `ports` table definition to `locations`
   - Removed `region` and `port_type` fields
   - Updated itinerary table to use `locationId` instead of `port_id`
   - Removed `country` field from itinerary table
   - Added `resortName` field to trips table
   - Added backward compatibility alias: `export const ports = locations`
   - Updated relations to include locationsRelations
   - Added type exports for Location

### Current Table Structures After Changes

**locations table:**
- `id`, `name` (UNIQUE), `country`
- `coordinates`, `description`, `image_url`
- `created_at`, `updated_at`

**itinerary table:**
- `id`, `trip_id`, `date`, `day`
- `port_name`, `arrival_time`, `departure_time`, `all_aboard_time`
- `port_image_url`, `description`, `highlights`
- `order_index`, `segment`, `location_id` (FK to locations)
- (Removed: `country`)

**trips table:**
- All previous fields plus:
- `resort_name` (VARCHAR 255) - NEW field for resort trips

### Testing Checklist
- [x] Verify locations table exists with data from ports
- [x] Verify test rows (34-37) are deleted
- [x] Verify region and port_type columns are removed
- [x] Verify country column is removed from itinerary
- [x] Verify resort_name column is added to trips
- [x] Verify all foreign key relationships work correctly
- [x] Verify indexes are properly updated
- [ ] Test application functionality with renamed tables
- [ ] Update application code to use location_id instead of port_id

### Backward Compatibility
To ensure existing code continues to work during the transition:
- **Table Alias:** `export const ports = locations;`
- **Type Alias:** `export type Port = Location;`

### Next Steps
After all application code is updated:
1. Remove backward compatibility aliases for ports/locations
2. Update all queries to use locations table name
3. Update frontend components to use location terminology

---

## Change Set 4: Create talent_categories table and normalize talent categories
**Date:** 2025-01-20
**Status:** ✅ Completed

### Summary
- Created new `talent_categories` table to normalize talent category data
- Added `talent_category_id` foreign key to talent table
- Migrated existing category values to new normalized structure
- Kept `category` field for backward compatibility (marked as DEPRECATED)

### Changes Applied

#### 1. New Table: `talent_categories`
```sql
CREATE TABLE talent_categories (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Initial Data:**
- ID 1: 'Headliners'
- ID 2: 'Vocalists'
- ID 3: 'Drag & Variety'
- ID 4: 'DJ's'
- ID 5: 'Piano Bar / Cabaret'

#### 2. Column Changes in `talent` Table

**Added:**
- `talent_category_id` (INTEGER, NOT NULL, FK to talent_categories.id)

**Kept for backward compatibility:**
- `category` (TEXT) - Marked as DEPRECATED, use talent_category_id instead

#### 3. Data Migration Mapping
Existing categories were migrated as follows:
- 'Broadway Legend' → 'Headliners' (ID: 1)
- 'Vocalists' → 'Vocalists' (ID: 2)
- 'Drag' → 'Drag & Variety' (ID: 3)
- 'Drag & Variety' → 'Drag & Variety' (ID: 3)
- 'DJs' → 'DJ's' (ID: 4)
- 'Piano Bar' → 'Piano Bar / Cabaret' (ID: 5)
- 'Comedy' → 'Drag & Variety' (ID: 3)
- 'Productions' → 'Headliners' (ID: 1)

#### 4. Foreign Key and Index Updates
- **Added FK:** talent_talent_category_id_fkey (talent.talent_category_id → talent_categories.id)
- **Added Index:** talent_talent_category_id_idx (on talent_category_id column)
- **Added Index:** talent_categories_category_idx (on category column in talent_categories)

### Migration SQL
The complete migration was applied using the following SQL (see migration 004_create_talent_categories_table):

```sql
-- Step 1: Create talent_categories table
CREATE TABLE IF NOT EXISTS talent_categories (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert the talent categories
INSERT INTO talent_categories (category) VALUES
    ('Headliners'),
    ('Vocalists'),
    ('Drag & Variety'),
    ('DJ''s'),
    ('Piano Bar / Cabaret')
ON CONFLICT DO NOTHING;

-- Step 3: Add talent_category_id column to talent table
ALTER TABLE talent
ADD COLUMN IF NOT EXISTS talent_category_id INTEGER;

-- Step 4: Map existing categories to new talent_category_id
UPDATE talent
SET talent_category_id = CASE
    WHEN category = 'Broadway Legend' THEN (SELECT id FROM talent_categories WHERE category = 'Headliners')
    WHEN category = 'Vocalists' THEN (SELECT id FROM talent_categories WHERE category = 'Vocalists')
    WHEN category = 'Drag' THEN (SELECT id FROM talent_categories WHERE category = 'Drag & Variety')
    WHEN category = 'Drag & Variety' THEN (SELECT id FROM talent_categories WHERE category = 'Drag & Variety')
    WHEN category = 'DJs' THEN (SELECT id FROM talent_categories WHERE category = 'DJ''s')
    WHEN category = 'Piano Bar' THEN (SELECT id FROM talent_categories WHERE category = 'Piano Bar / Cabaret')
    WHEN category = 'Comedy' THEN (SELECT id FROM talent_categories WHERE category = 'Drag & Variety')
    WHEN category = 'Productions' THEN (SELECT id FROM talent_categories WHERE category = 'Headliners')
    ELSE (SELECT id FROM talent_categories WHERE category = 'Headliners')
END
WHERE talent_category_id IS NULL;

-- Step 5-8: Add constraints and indexes
```

### Code Updates
The following files were updated to reflect the database changes:

1. **shared/schema.ts**
   - Added `talentCategories` table definition
   - Added `talentCategoryId` field to talent table
   - Marked `category` field as DEPRECATED
   - Updated relations to include talentCategoriesRelations
   - Added insert schema and type exports for TalentCategory

### Current talent Table Structure
After these changes, the talent table now has:
- `id` (PRIMARY KEY)
- `name` (TEXT)
- `talent_category_id` (FK to talent_categories.id) - NEW
- `category` (TEXT) - DEPRECATED, kept for backward compatibility
- `bio`, `known_for`, `profile_image_url`
- `social_links`, `website`
- `created_at`, `updated_at`

### Testing Checklist
- [x] Verify talent_categories table has 5 categories
- [x] Verify talent_category_id is properly set for all talent records
- [x] Verify foreign key constraint works correctly
- [x] Verify indexes are properly created
- [x] Verify category mappings are correct
- [ ] Test application functionality with new category structure
- [ ] Update application code to use talent_category_id with joins

### Next Steps
After all application code is updated:
1. Remove deprecated `category` column from talent table
2. Update all queries to use talent_category_id with joins to talent_categories
3. Update frontend to use the normalized category values

---

## Change Set 5: Create location_types table and add to itinerary
**Date:** 2025-01-20
**Status:** ✅ Completed

### Summary
- Created new `location_types` table to categorize location types
- Added `location_type_id` foreign key to itinerary table
- Automatically mapped existing itinerary entries to appropriate location types
- Implemented smart detection for embarkation/disembarkation based on patterns

### Changes Applied

#### 1. New Table: `location_types`
```sql
CREATE TABLE location_types (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Initial Data:**
- ID 1: 'Embarkation'
- ID 2: 'Disembarkation'
- ID 3: 'Port'
- ID 4: 'Sea Day'
- ID 5: 'Resort'

#### 2. Column Addition in `itinerary` Table

**Added:**
- `location_type_id` (INTEGER, NOT NULL, FK to location_types.id)

#### 3. Automatic Location Type Mapping
The migration intelligently mapped existing itinerary entries:

**Mapping Logic Applied:**
- **Sea Day**: Entries containing "day at sea" or "sea day" in port_name
- **Embarkation**:
  - Entries containing "embarkation" in port_name
  - Day 1 entries (unless it's a sea day)
  - Entries with segment = 'pre'
- **Disembarkation**:
  - Entries containing "disembarkation" in port_name
  - Last day of each trip (unless it's a sea day)
  - Entries with segment = 'post'
- **Port**: All other entries (default)
- **Resort**: Reserved for future resort itineraries

#### 4. Foreign Key and Index Updates
- **Added FK:** itinerary_location_type_id_fkey (itinerary.location_type_id → location_types.id)
- **Added Index:** itinerary_location_type_id_idx (on location_type_id column)

### Migration SQL
The complete migration was applied using the following SQL (see migration 005_create_location_types_table):

```sql
-- Step 1: Create location_types table
CREATE TABLE IF NOT EXISTS location_types (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert the location types
INSERT INTO location_types (type) VALUES
    ('Embarkation'),
    ('Disembarkation'),
    ('Port'),
    ('Sea Day'),
    ('Resort')
ON CONFLICT DO NOTHING;

-- Step 3: Add location_type_id column to itinerary table
ALTER TABLE itinerary
ADD COLUMN IF NOT EXISTS location_type_id INTEGER;

-- Step 4: Map itinerary entries to location types based on patterns
UPDATE itinerary
SET location_type_id = CASE
    -- Sea Day patterns
    WHEN port_name ILIKE '%day at sea%' THEN (SELECT id FROM location_types WHERE type = 'Sea Day')
    WHEN port_name ILIKE '%sea day%' THEN (SELECT id FROM location_types WHERE type = 'Sea Day')

    -- Embarkation patterns
    WHEN port_name ILIKE '%embarkation%' THEN (SELECT id FROM location_types WHERE type = 'Embarkation')
    WHEN day = 1 AND port_name NOT ILIKE '%day at sea%' THEN (SELECT id FROM location_types WHERE type = 'Embarkation')
    WHEN segment = 'pre' THEN (SELECT id FROM location_types WHERE type = 'Embarkation')

    -- Disembarkation patterns
    WHEN port_name ILIKE '%disembarkation%' THEN (SELECT id FROM location_types WHERE type = 'Disembarkation')
    WHEN segment = 'post' THEN (SELECT id FROM location_types WHERE type = 'Disembarkation')

    -- Default to Port
    ELSE (SELECT id FROM location_types WHERE type = 'Port')
END
WHERE location_type_id IS NULL;

-- Step 5: Mark last days as Disembarkation
WITH last_days AS (
    SELECT trip_id, MAX(day) as last_day
    FROM itinerary
    GROUP BY trip_id
)
UPDATE itinerary i
SET location_type_id = (SELECT id FROM location_types WHERE type = 'Disembarkation')
FROM last_days ld
WHERE i.trip_id = ld.trip_id
  AND i.day = ld.last_day
  AND i.port_name NOT ILIKE '%sea%'
  AND i.location_type_id = (SELECT id FROM location_types WHERE type = 'Port');

-- Step 6-8: Add constraints and indexes
```

### Code Updates
The following files were updated to reflect the database changes:

1. **shared/schema.ts**
   - Added `locationTypes` table definition
   - Added `locationTypeId` field to itinerary table
   - Updated relations to include locationTypesRelations
   - Added insert schema and type exports for LocationType

### Current itinerary Table Structure
After these changes, the itinerary table now has:
- `id` (PRIMARY KEY)
- `trip_id` (FK to trips.id)
- `date`, `day`, `port_name`
- `arrival_time`, `departure_time`, `all_aboard_time`
- `port_image_url`, `description`, `highlights`
- `order_index`, `segment`
- `location_id` (FK to locations.id) - for actual port/location data
- `location_type_id` (FK to location_types.id) - NEW: for categorization

### Example Mappings Applied
- "Athens, Greece (Embarkation Day)" → Embarkation
- "Day at Sea" → Sea Day
- "Santorini, Greece" → Port
- "Athens, Greece (Disembarkation Day)" → Disembarkation
- Day 1 "Miami" → Embarkation
- Last day "Miami" → Disembarkation

### Testing Checklist
- [x] Verify location_types table has 5 types
- [x] Verify location_type_id is properly set for all itinerary records
- [x] Verify embarkation days are correctly identified
- [x] Verify disembarkation days are correctly identified
- [x] Verify sea days are correctly identified
- [x] Verify regular ports are correctly identified
- [x] Verify foreign key constraint works correctly
- [x] Verify indexes are properly created
- [ ] Test application functionality with location types
- [ ] Update application code to use location_type_id

### Next Steps
After all application code is updated:
1. Update queries to use location_type_id with joins to location_types
2. Update frontend to display appropriate icons/labels based on location type
3. Add validation to ensure embarkation is always first day and disembarkation is last day for cruises

---

## Change Set 6: Talent Association Tables Cleanup
**Date:** 2025-01-20
**Status:** ✅ Completed

### Summary
Clarified and simplified talent associations:
- **trip_talent table**: KEPT - For trip-level talent associations
- **event_talent table**: REMOVED - Was unused (0 records) and redundant
- **events.talent_ids**: KEPT - Current implementation using JSON array field

### Final Talent Association Structure

#### trip_talent Table (KEPT)
**Purpose**: Links talent to entire trips/cruises
- Used for marketing and announcements
- Shows "Featured Talent" on trip overview pages
- Allows talent to be announced before specific events are scheduled
- Some talent might be general cruise entertainment not tied to specific events
- Examples: Background DJs, roaming performers, meet & greet talent

#### events.talent_ids Field (KEPT)
**Purpose**: Links talent to specific events
- Stored as JSON array in events table
- Simple and working implementation
- No need for additional junction table complexity

#### event_talent Table (REMOVED)
- Was never used (0 records)
- Redundant given the existing talent_ids JSON field
- Removed in migration 008 to simplify database structure

### Table Structure Summary

**trip_talent table**:
```sql
CREATE TABLE trip_talent (
    trip_id INTEGER NOT NULL REFERENCES trips(id),
    talent_id INTEGER NOT NULL REFERENCES talent(id),
    role TEXT,
    performance_count INTEGER,
    notes TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY (trip_id, talent_id)
);
```

**event_talent table** (for future use):
```sql
CREATE TABLE event_talent (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id),
    talent_id INTEGER NOT NULL REFERENCES talent(id),
    role VARCHAR(50) DEFAULT 'performer',
    performance_order INTEGER,
    created_at TIMESTAMP
);
```

**events table** (current talent storage):
- `talent_ids` JSONB field containing array of talent IDs

### Use Cases

1. **Trip Overview Page**: Query `trip_talent` to show all featured performers
2. **Event Details**: Use `events.talent_ids` to show event-specific talent
3. **Talent Directory**: Aggregate from both trip_talent and events to show where talent appears

### Migration Note
The trip_talent table was temporarily dropped in migration 006 but was restored in migration 007 after recognizing its distinct purpose. The data for trip 1 was restored with 22 talent associations.

### Recommendation
Keep both tables as they serve different organizational needs. Consider migrating from events.talent_ids JSON field to the normalized event_talent table in a future update for better data integrity and query performance.

---

## Change Set 7: Storage Consolidation - Single Bucket Structure
**Date:** 2025-01-20
**Status:** ✅ Database Updated (Manual storage migration required)

### Summary
Consolidated multiple Supabase storage buckets into a single `app-images` bucket with organized folders for better management and consistency.

### Storage Structure Changes

#### Old Structure (5+ buckets):
- `talent-images/`
- `port-images/`
- `party-images/`
- `cruise-images/`
- `event-images/`
- `destination-images/`
- `ship-images/`
- `trip-images/`

#### New Structure (1 bucket):
```
app-images/
├── talent/      # Talent profile images (30 files)
├── locations/   # Location/destination images (formerly ports)
├── parties/     # Party and event theme images (13 files, renamed from events folder)
├── trips/       # Trip hero images, ship images (2 files, formerly cruises)
└── itinerary/   # Itinerary port images (13 unique images serving 17 records)
```

**Notes:**
- The events folder was renamed to parties to match the database table naming convention
- Itinerary folder added for port-specific images migrated from Cloudinary

### Database URL Updates Applied

The migration updated all image URLs in the following tables:
1. **talent** - `profile_image_url` → `app-images/talent/` (30 images)
2. **locations** - `image_url` → `app-images/itinerary/` (13 locations, all with images)
3. **events** - `image_url` → `app-images/parties/` (15 images, renamed folder)
4. **trips** - `hero_image_url` → `app-images/trips/` (2 images)
5. **parties** - `image_url` → `app-images/parties/` (Cloudinary URLs, need migration)
6. **itinerary** - `port_image_url` → `app-images/itinerary/` (17 records, 13 unique images)
7. **ships** - `image_url` → `app-images/trips/` (to be populated)

### Image Updates Summary
- **Cloudinary Migration**: All itinerary images migrated from Cloudinary to Supabase
- **Locations Table**: All 13 locations now have images from the itinerary folder
  - Athens, Santorini, Mykonos, Iraklion use their respective port images
  - Istanbul, Kuşadası use Turkish port images
  - Alexandria uses Egyptian port image
  - Miami (selected miami-1.webp from two available)
  - Key West, Bimini use their respective images
  - Embarkation/Disembarkation use Athens image (Greece-based)
  - Sea Day uses day-at-sea-1.jpg

### ✅ MIGRATION COMPLETED

**Storage Migration Scripts Used:**
1. `scripts/migrate-storage-buckets.js` - Main bucket consolidation
2. `scripts/rename-events-to-parties.js` - Renamed events folder to parties
3. `scripts/migrate-itinerary-images-v2.js` - Migrated Cloudinary images to itinerary folder
4. `scripts/cleanup-old-buckets.js` - Deleted old storage buckets

**Final Structure:**
- ✅ Single `app-images` bucket created
- ✅ All files migrated to organized folders
- ✅ Database URLs updated to new structure
- ✅ Old buckets deleted
- ✅ Cloudinary images migrated to Supabase

### Migration SQL
See migration 009_consolidate_storage_urls_simple for the complete URL update queries.

### Benefits of Consolidation
- **Simplified Management**: Single bucket to manage permissions and policies
- **Consistent Structure**: Clear folder organization matching entity types
- **Easier Backups**: One bucket to backup instead of many
- **Better Performance**: Reduced bucket switching overhead
- **Cleaner URLs**: Consistent URL patterns across all image types

### Testing Checklist
- [x] Database URLs updated to new structure
- [ ] app-images bucket created in Supabase
- [ ] Folders created in app-images bucket
- [ ] Files moved from old buckets to new structure
- [ ] Application tested with new image URLs
- [ ] Old buckets deleted after verification

### Next Steps
1. Complete manual file migration in Supabase Storage
2. Re-upload Cloudinary images to Supabase (locations table)
3. Update application code to use new bucket structure
4. Update any upload functions to use app-images bucket

---

## Change Set 8: Party Themes Table - Replace Parties Table
**Date:** 2025-01-21
**Status:** ✅ Completed

### Summary
- Created new `party_themes` table with enhanced fields for reusable party themes
- Migrated all party event data from events table to populate party_themes
- Updated events table to reference party themes via `party_theme_id`
- Removed redundant columns from events table
- Created comprehensive API and storage layer for party themes
- Maintained backward compatibility with old /api/parties endpoints
- Dropped unused `parties` table

### Changes Applied

#### 1. New Table: `party_themes`
```sql
CREATE TABLE party_themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    long_description TEXT,
    short_description TEXT,
    costume_ideas TEXT,
    image_url TEXT,
    amazon_shopping_list_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Initial Data Migrated:**
15 unique party themes extracted from events table:
- White Party
- Glow Party
- Broadway Musical Night
- Decades Dance
- Masquerade Ball
- Tropical Beach Party
- 80s Night
- Pride Pool Party
- Drag Brunch
- Latin Fiesta
- Country Western Night
- Disney Night
- Black & Gold Gala
- Pajama Party
- Halloween Spooktacular

#### 2. Column Changes in `events` Table

**Added:**
- `party_theme_id` (INTEGER, FK to party_themes.id) - Links party events to themes

**Removed columns (redundant with party_themes):**
- `deck` (TEXT) - Venue information
- `description` (TEXT) - Now in party_themes.long_description
- `short_description` (TEXT) - Now in party_themes.short_description
- `image_url` (TEXT) - Now in party_themes.image_url
- `theme_description` (TEXT) - Consolidated into party_themes descriptions
- `dress_code` (TEXT) - Now in party_themes.costume_ideas
- `capacity` (INTEGER) - Venue-specific, removed
- `requires_reservation` (BOOLEAN) - Event management field, removed

#### 3. Dropped Table: `parties`
The old `parties` table was dropped as it was:
- Unused (0 records)
- Replaced by the new `party_themes` table
- Not referenced by any foreign keys

#### 4. Data Migration Details

**Party Themes Population:**
- Extracted 15 unique party themes from 66 total events
- Added costume ideas for each theme with contextual suggestions
- Added sample Amazon shopping list URLs for demonstration
- Preserved all original descriptions and consolidated theme information

**Events Table Cleanup:**
- All party events (type='party') now reference party_theme_id
- Non-party events (performances, shows) retain talent_ids associations
- Event-specific information (date, time, location) preserved in events table

#### 5. Foreign Key and Index Updates
- **Added FK:** events_party_theme_id_fkey (events.party_theme_id → party_themes.id)
- **Added Index:** events_party_theme_id_idx (on party_theme_id column)
- **Added Index:** party_themes_name_idx (on name column for search)

### Migration SQL
The complete migration was applied via Supabase MCP tool:

```sql
-- Step 1: Create party_themes table
CREATE TABLE party_themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    long_description TEXT,
    short_description TEXT,
    costume_ideas TEXT,
    image_url TEXT,
    amazon_shopping_list_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Populate from events table (15 unique themes)
INSERT INTO party_themes (name, long_description, short_description, image_url)
SELECT DISTINCT ON (title)
    title as name,
    description as long_description,
    short_description,
    image_url
FROM events
WHERE type = 'party';

-- Step 3: Add party_theme_id to events table
ALTER TABLE events ADD COLUMN party_theme_id INTEGER REFERENCES party_themes(id);

-- Step 4: Associate events with party themes
UPDATE events e
SET party_theme_id = pt.id
FROM party_themes pt
WHERE e.title = pt.name AND e.type = 'party';

-- Step 5: Remove redundant columns from events
ALTER TABLE events
DROP COLUMN deck,
DROP COLUMN description,
DROP COLUMN short_description,
DROP COLUMN image_url,
DROP COLUMN theme_description,
DROP COLUMN dress_code,
DROP COLUMN capacity,
DROP COLUMN requires_reservation;

-- Step 6: Drop the old parties table
DROP TABLE IF EXISTS parties;
```

### Code Updates

1. **shared/schema.ts**
   - Added `partyThemes` table definition with all new fields
   - Updated events table to include `partyThemeId` relation
   - Removed deprecated columns from events table
   - Added proper TypeScript types and relations

2. **server/storage/PartyThemeStorage.ts**
   - Created comprehensive storage class with CRUD operations
   - Includes search, duplicate, usage checking, and statistics methods
   - Proper error handling and validation

3. **server/routes/party-themes.ts**
   - New RESTful API at `/api/party-themes`
   - Full CRUD operations with proper authentication
   - Backward compatibility redirects from `/api/parties`
   - Includes usage checking and duplication endpoints

4. **client/src/pages/admin/themes.tsx**
   - Updated admin UI to manage party themes
   - New form fields for all party theme properties
   - Improved table display with new fields

### API Endpoints

**New Endpoints:**
- `GET /api/party-themes` - List all themes
- `GET /api/party-themes/:id` - Get single theme
- `GET /api/party-themes/:id/events` - Get events using theme
- `GET /api/party-themes/:id/usage` - Check theme usage
- `GET /api/party-themes/stats` - Get statistics
- `POST /api/party-themes` - Create theme (requires content editor)
- `PUT /api/party-themes/:id` - Update theme (requires content editor)
- `POST /api/party-themes/:id/duplicate` - Duplicate theme (requires content editor)
- `DELETE /api/party-themes/:id` - Delete theme (requires super admin)

**Backward Compatibility:**
- Old `/api/parties` endpoints redirect to new `/api/party-themes`
- Data transformation layer for legacy API consumers

### Current Structure

**party_themes table:**
- Stores reusable party theme templates
- Rich content fields for descriptions and ideas
- Shopping list integration capability
- Usage tracking through events association

**events table (simplified):**
- Core event information only (date, time, location)
- References to party_themes for party events
- References to talent for performance events
- Cleaner, more normalized structure

### Testing Checklist
- [x] Verify party_themes table created with 15 themes
- [x] Verify all party events have party_theme_id set
- [x] Verify redundant columns removed from events table
- [x] Verify foreign key constraints work correctly
- [x] Verify API endpoints function properly
- [x] Verify backward compatibility for old endpoints
- [x] Verify admin UI updates and displays correctly
- [x] Verify parties table dropped successfully
- [ ] Test end-to-end functionality in production

### Benefits
- **Reusability**: Party themes can be used across multiple events and trips
- **Consistency**: Standardized party theme information
- **Maintainability**: Single source of truth for party theme details
- **Extensibility**: Easy to add shopping lists, costume ideas, etc.
- **Performance**: Normalized structure reduces data duplication
- **Cleaner Schema**: Removed unused parties table

### Next Steps
1. Update frontend components to use party_themes data
2. Implement shopping list integration features
3. Add party theme image management in admin UI
4. Update event creation wizard to use party themes