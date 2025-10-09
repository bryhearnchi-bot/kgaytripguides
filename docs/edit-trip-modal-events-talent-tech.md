# Events Tab & Talent Tab - Detailed Technical Plan

**Created:** October 6, 2025
**Status:** Phase 2A & 2B Complete ✅
**Related:** edit-trip-modal.md, TRIP-WIZARD-STYLE-GUIDE.md

---

## Overview

This document provides the detailed technical implementation plan for Phase 2 of the Edit Trip Modal:

- **Events Tab** - Manage trip events with talent, venues, and party themes
- **Talent Tab** - Manage talent pool assigned to the trip

---

## 1. EVENTS TAB - Technical Implementation

### 1.1 Database Schema Analysis

**`events` table structure:**

```sql
- id (integer, PK)
- trip_id (integer, FK → trips.id, NOT NULL)
- date (timestamp, NOT NULL)
- time (text, NOT NULL) -- 24-hour format "HH:MM"
- title (text, NOT NULL)
- venue (text, nullable) -- DEPRECATED: Legacy column
- venue_id (integer, FK → venues.id, nullable)
- talent_ids (jsonb, nullable) -- Array of talent IDs: [1, 2, 3]
- party_theme_id (integer, FK → party_themes.id, nullable)
- event_type_id (integer, FK → event_types.id, NOT NULL)
- created_at (timestamp)
- updated_at (timestamp)
```

**`event_types` lookup table (8 types):**

```typescript
1. party - #ec4899 (pink) - PartyPopper icon
2. show - #8b5cf6 (purple) - Theater icon
3. dining - #f59e0b (amber) - UtensilsCrossed icon
4. lounge - #06b6d4 (cyan) - Wine icon
5. fun - #10b981 (green) - Sparkles icon
6. club - #6366f1 (indigo) - Music icon
7. after - #a855f7 (purple) - MoonStar icon
8. social - #14b8a6 (teal) - Users icon
```

---

### 1.2 Component Architecture

#### **1.2.1 Main Component: `EventsTabPage.tsx`**

**Location:** `/client/src/components/admin/TripWizard/EventsTabPage.tsx`

**Structure:**

```typescript
interface Event {
  id?: number;
  tripId: number;
  date: string; // ISO date from trip day
  time: string; // "HH:MM" format
  title: string;
  venueId: number | null;
  talentIds: number[]; // Array of talent IDs
  partyThemeId: number | null;
  eventTypeId: number;
  imageUrl?: string;
  description?: string;
}
```

**Layout Pattern:**

- Single column layout
- Event list with add/edit/delete actions
- Card-based display with event type color coding
- Ocean theme styling (cyan-400 accents, white/[0.04] backgrounds)

**Features:**

1. **Event List Display**
   - Sorted by date/time
   - Color-coded by event type (using event_types.color)
   - Icon indicator (using event_types.icon)
   - Quick actions: Edit, Delete

2. **Add Event Button**
   - Ocean-themed button at top
   - Opens EventFormModal

3. **Empty State**
   - When no events: "No events added yet" with helpful tip

---

#### **1.2.2 Event Form Modal: `EventFormModal.tsx`**

**Location:** `/client/src/components/admin/TripWizard/EventFormModal.tsx`

**Props:**

```typescript
interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  tripId: number;
  tripStartDate: string;
  tripEndDate: string;
  scheduleEntries: ScheduleEntry[]; // For resort trips
  itineraryEntries: ItineraryEntry[]; // For cruise trips
  tripType: 'resort' | 'cruise';
  editingEvent?: Event; // For edit mode
}
```

**Form Fields (in order):**

1. **Day Selector** (NEW component: `TripDayDropdown`)
   - Required field
   - Dropdown showing trip days with dates
   - Options: "Pre-Trip - Aug 20", "Day 1 - Aug 21", "Day 2 - Aug 22", etc.
   - Includes pre-trip and post-trip days
   - On select: Auto-populate date field

2. **Event Title**
   - OceanInput component
   - Required, max 200 chars
   - Placeholder: "e.g., White Party, Drag Show, Welcome Reception"

3. **Event Type** (SingleDropDownNew)
   - Required field
   - Fetches from `event_types` table
   - Display: Icon + Name + Color badge
   - Shows all 8 types

4. **Time** (TimePicker component)
   - Required field
   - 24-hour format with 12-hour hint
   - Placeholder: "Select event time"

5. **Venue Selector** (NEW component: `VenueDropdown`)
   - Required field
   - Single-select dropdown (NOT multi-select)
   - Fetches venues for current trip
   - "Add New Venue" option at top (opens VenueCreateModal)
   - Display: Venue name + venue type

6. **Talent Selector** (NEW component: `TalentSelector`)
   - Optional field
   - Multi-select (adapts AmenitySelector pattern)
   - **Fetches ONLY talent already on this trip** (from `trip_talent`)
   - "Add New Talent" option (opens TalentCreateModal + adds to `trip_talent`)
   - Display: Name + talent category + profile image

7. **Party Theme Selector** (NEW component: `PartyThemeSelector`)
   - Optional field
   - Only visible when eventTypeId === 1 (party)
   - Single-select dropdown
   - Fetches from `party_themes` table
   - "Add New Party Theme" option (opens PartyThemeCreateModal)
   - Display: Theme name + short description

8. **Image Upload** (ImageUploadField)
   - Optional field
   - Supabase storage bucket: `event-images`
   - Helper text: "Event flyer or promotional image"

9. **Description** (OceanTextarea)
   - Optional field
   - Rows: 4
   - Placeholder: "Event description, special instructions, dress code..."

**Validation:**

```typescript
const eventSchema = z.object({
  tripId: z.number(),
  date: z.string().min(1, 'Day is required'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  title: z.string().min(1, 'Title is required').max(200),
  eventTypeId: z.number().min(1, 'Event type is required'),
  venueId: z.number().nullable(),
  talentIds: z.array(z.number()).default([]),
  partyThemeId: z.number().nullable(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
});
```

---

### 1.3 New Components to Create

#### **1.3.1 TripDayDropdown.tsx**

**Pattern:** SingleDropDownNew adapter
**Purpose:** Select trip day from schedule/itinerary

```typescript
interface TripDayDropdownProps {
  tripType: 'resort' | 'cruise';
  scheduleEntries?: ScheduleEntry[];
  itineraryEntries?: ItineraryEntry[];
  value: string; // ISO date
  onChange: (date: string) => void;
  required?: boolean;
}

interface DayOption {
  date: string; // ISO format
  label: string; // "Day 1 - Aug 21, 2025"
  dayNumber: number;
}
```

**Display Logic:**

- Resort: Use `scheduleEntries`
- Cruise: Use `itineraryEntries`
- Format: `"Day ${dayNum} - ${formattedDate}"`
- Pre-trip: `"Pre-Trip - ${formattedDate}"`
- Post-trip: `"Post-Trip - ${formattedDate}"`

---

#### **1.3.2 VenueDropdown.tsx**

**Pattern:** SingleDropDownNew wrapper
**Purpose:** Single-select venue picker

```typescript
interface VenueDropdownProps {
  tripId: number;
  value: number | null;
  onChange: (venueId: number) => void;
  required?: boolean;
}
```

**Features:**

- Fetches venues for trip: `GET /api/admin/trips/${tripId}/venues`
- "Add New Venue" option always at top
- Opens `VenueCreateModal` (reuse from VenueSelector)
- Display: `"${venue.name} • ${venue.venueTypeName}"`

---

#### **1.3.3 TalentSelector.tsx**

**Pattern:** MultiSelectWithCreate adapter (like AmenitySelector)
**Purpose:** Multi-select talent picker

```typescript
interface TalentSelectorProps {
  tripId: number; // NEW: Required to fetch trip-specific talent
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  menuVariant?: MultiSelectMenuVariant;
  wizardMode?: boolean;
}
```

**Features:**

- **Fetches ONLY talent on this trip:** `GET /api/admin/trips/${tripId}/talent`
- Multi-select with checkboxes
- "Add New Talent" option at top
- Opens `TalentCreateModal` (creates talent + adds to `trip_talent`)
- Display: `"${talent.name} • ${talent.talentCategoryName}"`
- Profile image thumbnail if available

**TalentCreateModal fields:**

- Name (required)
- Talent Category (dropdown, required)
- Bio (textarea, optional)
- Known For (text, optional)
- Profile Image (upload, optional)
- Social Links (Instagram, Twitter/X, Facebook - optional)
- Website (URL, optional)

---

#### **1.3.4 PartyThemeSelector.tsx**

**Pattern:** SingleDropDownNew wrapper
**Purpose:** Single-select party theme picker

```typescript
interface PartyThemeSelectorProps {
  value: number | null;
  onChange: (themeId: number) => void;
  required?: boolean;
}
```

**Features:**

- Fetches from `GET /api/admin/party-themes`
- "Add New Party Theme" option at top
- Opens `PartyThemeCreateModal`
- Display: `"${theme.name}"`
- Subtitle: `theme.shortDescription`

**PartyThemeCreateModal fields:**

- Name (required, max 100 chars)
- Short Description (text, optional, max 200 chars)
- Long Description (textarea, optional)
- Costume Ideas (textarea, optional)
- Image (upload, optional)
- Amazon Shopping List URL (URL, optional)

---

### 1.4 Backend API Endpoints

#### **Events CRUD:**

```typescript
// Get all events for a trip
GET /api/admin/trips/:tripId/events
Response: Event[]

// Create event
POST /api/admin/trips/:tripId/events
Body: EventCreateSchema
Validation: talent_ids must exist in trip_talent for this trip
Response: Event

// Update event
PUT /api/admin/events/:id
Body: EventUpdateSchema
Validation: talent_ids must exist in trip_talent for this trip
Response: Event

// Delete event
DELETE /api/admin/events/:id
Response: 204 No Content
```

#### **Event Types (Read-only):**

```typescript
GET /api/admin/event-types
Response: EventType[]
```

#### **Talent CRUD:**

```typescript
// Get all talent (global pool)
GET /api/admin/talent
Response: Talent[]

// Create talent
POST /api/admin/talent
Body: TalentCreateSchema
Response: Talent

// Update talent
PUT /api/admin/talent/:id
Body: TalentUpdateSchema
Response: Talent

// Delete talent
DELETE /api/admin/talent/:id
Response: 204 No Content
```

#### **Party Themes CRUD:**

```typescript
GET /api/admin/party-themes
POST /api/admin/party-themes
PUT /api/admin/party-themes/:id
DELETE /api/admin/party-themes/:id
```

---

### 1.5 Context Integration

**TripWizardContext updates:**

```typescript
interface TripWizardContextValue {
  // ... existing fields ...

  // Events
  events: Event[];
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: number, event: Event) => void;
  deleteEvent: (id: number) => void;

  // Trip talent (separate from event talent)
  tripTalent: Talent[];
  setTripTalent: (talent: Talent[]) => void;
  addTalentToTrip: (talentIds: number[]) => void;
  removeTalentFromTrip: (talentId: number) => void;
}
```

**Edit Trip Modal integration:**

- Fetch events on modal open: `GET /api/admin/trips/:tripId/events`
- Fetch trip talent: `GET /api/admin/trips/:tripId/talent`
- Populate `events` and `tripTalent` in context
- Save on "Save All Changes" button

---

### 1.6 Styling Requirements (Ocean Theme)

**Following TRIP-WIZARD-STYLE-GUIDE.md:**

- **Spacing:** space-y-2.5 (major sections), gap-3 (grids)
- **Input height:** h-10 (40px)
- **Backgrounds:** bg-white/[0.04]
- **Borders:** border-[1.5px] border-white/8
- **Focus states:** focus:border-cyan-400/60, shadow ring
- **Typography:** text-xs labels, text-sm inputs
- **Event type badges:** Use event_types.color for background tint
- **Icons:** Lucide icons from event_types.icon field

**Event Card Design:**

```typescript
<div className="p-4 rounded-[10px] bg-white/[0.02] border-2 border-white/10 hover:bg-white/[0.04] hover:border-cyan-400/40 transition-all">
  {/* Event type badge with color */}
  {/* Event title */}
  {/* Date, time, venue info */}
  {/* Talent chips */}
  {/* Party theme badge (if applicable) */}
  {/* Edit/Delete actions */}
</div>
```

---

## 2. TALENT TAB - Technical Implementation

### 2.1 Database Schema

**`trip_talent` junction table (EXISTING - needs cleanup):**

**Current Structure:**

```sql
trip_talent (
  trip_id (PK, FK → trips.id)
  talent_id (PK, FK → talent.id)
  role (text, nullable) ❌ REMOVE - not needed
  performance_count (integer, nullable) ❌ REMOVE - not needed
  notes (text, nullable) ✅ KEEP - optional trip-specific notes
  created_at (timestamp)
)
```

**Migration Needed:**

```sql
-- Remove unnecessary columns from trip_talent
ALTER TABLE trip_talent DROP COLUMN role;
ALTER TABLE trip_talent DROP COLUMN performance_count;

-- Add id column for better relationship management
ALTER TABLE trip_talent ADD COLUMN id SERIAL;

-- Make (trip_id, talent_id) unique instead of composite PK
ALTER TABLE trip_talent DROP CONSTRAINT trip_talent_pkey;
ALTER TABLE trip_talent ADD PRIMARY KEY (id);
ALTER TABLE trip_talent ADD CONSTRAINT trip_talent_trip_talent_unique
  UNIQUE(trip_id, talent_id);
```

**Final Clean Structure:**

```sql
trip_talent (
  id SERIAL PRIMARY KEY
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE
  talent_id INTEGER NOT NULL REFERENCES talent(id) ON DELETE CASCADE
  notes TEXT -- Trip-specific notes about this talent (optional)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  UNIQUE(trip_id, talent_id)
)
```

**Key Points:**

- ✅ Talent pool is reusable across multiple trips
- ✅ `trip_talent` = simple junction (trip + talent)
- ✅ Talent categories come from `talent.talent_category_id`
- ✅ NO role tracking in junction table

---

### 2.2 Component: `TalentTabPage.tsx`

**Location:** `/client/src/components/admin/TripWizard/TalentTabPage.tsx`

**Purpose:** Manage all talent associated with the trip

**Data Source:**

```typescript
// Fetch from trip_talent junction table
GET /api/admin/trips/:tripId/talent
Response: Talent[] // All talent on this trip
```

---

### 2.3 Layout & Features

**Layout:**

- Single column
- Card-based talent list
- "Add Talent" button at top

**Three Sources of Talent on a Trip:**

1. **Talent assigned to events** (via `events.talent_ids`)
2. **Talent added to trip but not yet assigned** (via `trip_talent` only)
3. **Both** (talent in `trip_talent` AND in event talent_ids)

**Display Logic:**

```typescript
interface TripTalent extends Talent {
  assignedEvents: Event[]; // Events where this talent performs
  isUnassigned: boolean; // In trip_talent but not in any event
}
```

**Each Talent Card Shows:**

- Profile image (if available)
- Name + talent category badge
- Known For (truncated)
- **Assignment status badge:**
  - If `assignedEvents.length > 0`: Green badge "Assigned to ${count} events"
  - If `isUnassigned`: Orange badge "Not assigned to events yet"
- Events list (if assigned)
- Quick actions: Edit, Remove from Trip, Assign to Event (if unassigned)

---

### 2.4 Add Talent Flow

**When adding talent to trip:**

1. Opens TalentSelector (multi-select)
2. Shows existing talent from global pool (`GET /api/admin/talent`)
3. Or create new talent inline
4. On save: **Insert into `trip_talent` table** (NOT into events yet)
5. Talent appears in Talent Tab as "Not assigned to events yet"

**Later assignment happens in Events Tab:**

- When creating/editing event, TalentSelector shows ALL talent from `trip_talent` for this trip
- Selecting talent adds their ID to `events.talent_ids`

---

### 2.5 Remove from Trip Flow

**Warning logic:**

```typescript
if (talent.assignedEvents.length > 0) {
  // Warning: "This will remove [Name] from X events on this trip"
  // Lists events: "White Party (Day 1), Drag Show (Day 2)"
  // Confirmation required
} else {
  // Simple confirmation: "Remove [Name] from this trip?"
}
```

**On confirm:**

1. Remove from ALL events (`events.talent_ids` arrays)
2. Delete from `trip_talent` table
3. Refresh talent list

---

### 2.6 Talent-Event Relationship Display

**"Performing At" section in each card:**

```typescript
<div className="mt-2 space-y-1">
  <p className="text-[10px] font-semibold text-white/70">Performing At:</p>
  {eventsWithThisTalent.map(event => (
    <div key={event.id} className="text-[10px] text-white/60">
      • {event.title} - Day {event.dayNumber}
    </div>
  ))}
</div>
```

**Unassigned state:**

```typescript
<div className="mt-2">
  <span className="px-2 py-1 text-[10px] bg-orange-500/20 text-orange-400 border border-orange-400/30 rounded">
    Not assigned to events yet
  </span>
</div>
```

---

### 2.7 Backend API Endpoints

```typescript
// Get all talent for a trip (from trip_talent junction)
GET /api/admin/trips/:tripId/talent
Response: Talent[] // Includes assignment status

// Add talent to trip
POST /api/admin/trips/:tripId/talent
Body: { talentIds: number[] }
Response: 201 Created

// Remove talent from trip (and all events)
DELETE /api/admin/trips/:tripId/talent/:talentId
Response: 204 No Content
```

---

## 3. Implementation Checklist

### Phase 2A: Events Tab ✅ COMPLETE

- [x] Create `TripDayDropdown.tsx` component
- [x] Create `VenueDropdown.tsx` component
- [x] Create `TalentSelector.tsx` component (trip-scoped) - **Implemented as TalentDropdown.tsx**
- [x] Create `PartyThemeSelector.tsx` component
- [x] Create `TalentCreateModal.tsx` component - **Integrated into TalentDropdown**
- [x] Create `PartyThemeCreateModal.tsx` component - **Integrated into PartyThemeSelector**
- [x] Create `EventFormModal.tsx` component
- [x] Create `EventsTabPage.tsx` main component
- [x] Add backend routes: Events CRUD
- [x] Add backend routes: Event Types (read-only)
- [x] Add backend routes: Party Themes CRUD
- [x] Add backend routes: Venues CRUD
- [x] Update TripWizardContext with events state
- [x] Wire up Events tab in EditTripModal
- [x] Test event creation, editing, deletion
- [x] Test inline venue/talent/theme creation
- [x] Validate talent_ids exist in trip_talent

### Phase 2B: Talent Tab ✅ COMPLETE

- [x] Database migration: Clean up `trip_talent` table (remove role, performance_count)
- [x] Backend: GET/POST/DELETE `/api/admin/trips/:tripId/talent`
- [x] Create `TalentTabPage.tsx` component
- [x] Implement talent-event relationship logic
- [x] Show assignment status badges (assigned vs unassigned)
- [x] Add "Add Talent to Trip" functionality (from global pool)
- [x] Add "Edit Talent" functionality
- [x] Add "Remove from Trip" functionality (with event cleanup)
- [x] Add "Assign to Event" quick action for unassigned talent
- [x] Update TripWizardContext with tripTalent state
- [x] Wire up Talent tab in EditTripModal
- [x] Test talent management flows

**Key Implementation Note:**

- TalentDropdown component created using same pattern as VenueDropdown
- Both use Radix UI Popover with Command/CommandInput for searchable dropdowns
- DialogContent requires `overflow-visible` class to allow popovers to extend outside modal boundaries

### Phase 2C: Trip Info Tab (2-3 hours)

- [ ] Design custom info sections schema
- [ ] Create `TripInfoTabPage.tsx` component
- [ ] Implement section add/edit/delete
- [ ] Add backend routes for trip info sections
- [ ] Wire up Trip Info tab in EditTripModal

---

## 4. Database Migrations Summary

### Events Tab - No Migrations Needed ✅

- `event_types` table ✓
- `venue_id` foreign key ✓
- `talent_ids` JSONB ✓
- `party_theme_id` foreign key ✓

### Talent Tab - Cleanup Migration Required

```sql
-- File: supabase/migrations/YYYYMMDDHHMMSS_cleanup_trip_talent_table.sql

-- Remove unnecessary columns from trip_talent
ALTER TABLE trip_talent DROP COLUMN IF EXISTS role;
ALTER TABLE trip_talent DROP COLUMN IF EXISTS performance_count;

-- Add id column for better relationship management
ALTER TABLE trip_talent ADD COLUMN IF NOT EXISTS id SERIAL;

-- Recreate primary key and unique constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trip_talent_pkey'
  ) THEN
    ALTER TABLE trip_talent DROP CONSTRAINT trip_talent_pkey;
  END IF;
END $$;

ALTER TABLE trip_talent ADD PRIMARY KEY (id);
ALTER TABLE trip_talent ADD CONSTRAINT trip_talent_trip_talent_unique
  UNIQUE(trip_id, talent_id);

-- Add comment
COMMENT ON TABLE trip_talent IS 'Junction table linking trips to talent. Talent can be reused across multiple trips.';
COMMENT ON COLUMN trip_talent.notes IS 'Optional trip-specific notes about this talent';
```

### Optional Enhancement - Add Image and Description to Events

```sql
-- Optional: Add missing columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN events.image_url IS 'Event flyer or promotional image URL';
COMMENT ON COLUMN events.description IS 'Event description, special instructions, dress code';
```

---

## 5. Estimated Effort

| Task                                     | Hours        |
| ---------------------------------------- | ------------ |
| TripDayDropdown                          | 0.5          |
| VenueDropdown                            | 0.5          |
| TalentSelector + CreateModal             | 2.0          |
| PartyThemeSelector + CreateModal         | 1.5          |
| EventFormModal                           | 2.0          |
| EventsTabPage                            | 1.5          |
| Backend routes (Events, Party Themes)    | 1.5          |
| Context integration (events)             | 0.5          |
| Testing & bug fixes                      | 1.0          |
| **Events Tab Total**                     | **11 hours** |
|                                          |              |
| Database migration (trip_talent cleanup) | 0.5          |
| Backend routes (trip talent endpoints)   | 1.0          |
| TalentTabPage                            | 2.0          |
| Talent management logic                  | 1.5          |
| Context integration (trip talent)        | 0.5          |
| Testing                                  | 0.5          |
| **Talent Tab Total**                     | **6 hours**  |

**Total Phase 2A + 2B Effort: ~17 hours**

---

## 6. Key Technical Decisions

### 6.1 Talent Scoping Strategy

**Problem:** How to scope talent selection in Events Tab?

**Decision:** Two-tier approach

1. **Talent Tab:** Add talent to trip from global pool → inserts into `trip_talent`
2. **Events Tab:** Assign talent to events from trip-scoped pool → reads from `trip_talent`

**Benefits:**

- Clear separation of concerns
- Prevents event form from being cluttered with global talent search
- Encourages users to curate trip talent list first
- Reusable talent pool across multiple trips

---

### 6.2 Event-Talent Relationship

**Storage:** `events.talent_ids` (JSONB array)

**Validation:** Backend validates all talent_ids exist in `trip_talent` for this trip

**Rationale:**

- Simple M2M relationship without extra junction table
- JSONB allows flexible array operations
- Easy to query and update

---

### 6.3 Party Theme Visibility

**Logic:** Only show Party Theme selector when `eventTypeId === 1` (party)

**Rationale:**

- Party themes are specific to party events
- Conditional rendering keeps form clean
- Reduces cognitive load for non-party events

---

## 7. Success Criteria

### Events Tab

- ✅ Create/edit/delete events for a trip
- ✅ Select day from trip schedule/itinerary
- ✅ Assign event type with color coding
- ✅ Assign venue (from trip venues)
- ✅ Assign talent (from trip talent pool only)
- ✅ Assign party theme (for party events)
- ✅ Upload event images to Supabase storage
- ✅ Inline creation of venues, talent, and party themes
- ✅ Validation prevents assigning talent not on trip

### Talent Tab

- ✅ View all talent on trip with assignment status
- ✅ Add talent from global pool to trip
- ✅ Create new talent and add to trip
- ✅ Edit talent details
- ✅ Remove talent from trip (with event cleanup warning)
- ✅ View which events each talent is assigned to
- ✅ Quick assign unassigned talent to events

---

_Last updated: October 7, 2025_
_Phase 2A & 2B Complete - Events Tab and Talent Tab fully implemented_
_Next: Phase 2C - Trip Info Tab (optional enhancement)_
