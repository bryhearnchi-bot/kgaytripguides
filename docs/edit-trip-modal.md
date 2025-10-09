# Edit Trip Modal - Implementation Plan

**Created:** October 5, 2025
**Status:** Phase 1 Complete - Date Sync Feature Added
**Last Updated:** October 6, 2025 11:22 AM

---

## Goal

Create a comprehensive Edit Trip Modal with tabbed interface that allows editing existing trips. **Phase 1** reuses all Trip Wizard pages exactly as-is (same components, same styling, same functionality). **Phase 2** will add new tabs for Events, Talent, and Trip Info.

---

## Design Approach

**Match Trip Wizard Exactly:**

- Use `AdminFormModal` wrapper (same ocean theme, same styling)
- Reuse all existing Trip Wizard page components
- Follow Trip Wizard Style Guide (TRIP-WIZARD-STYLE-GUIDE.md)
- Tab navigation instead of wizard progression
- Same save/cancel behavior
- No gradients, no custom backgrounds - pure Trip Wizard style

---

## Modal Structure

### 7 Tabs

**Reused from Trip Wizard:**

1. **Trip Info** - Name, dates, description, hero image, highlights
2. **Location** - Resort or Ship selection/details
3. **Venues & Amenities** - Venue and amenity management
4. **Schedule/Itinerary** - Day-by-day schedule (resort) or ports (cruise)

**New Tabs:** 5. **Events** - Event management with talent, venues, party themes 6. **Talent** - Manage all talent associated with the trip 7. **Trip Info** - Custom information sections (FAQ, packing lists, etc.)

---

## Tab 5: Events Tab

### Creating a New Event

**Step 1: Select Day**

- Use `TripDayDropdown` component ✅
- Shows: "Pre-Cruise - Aug 20", "Day 1 - Aug 21", etc.
- Required field

**Step 2: Event Details**

- Title (required)
- Image upload
- Time (required)

**Step 3: Event Type**

- Dropdown from `event_types` table
- Required field

**Step 4: Select Venue**

- Use `VenueDropdown` component ✅
- Shows venues for THIS trip
- "+ Add New Venue" inline creation
- Required field

**Step 5: Add Talent**

- Use `TalentSelector` component ✅
- Multi-select like amenities
- "+ Add New Talent" inline creation
- Optional field

**Step 6: Party Theme**

- Use `PartyThemeSelector` component ✅
- Only if Event Type = "party"
- "+ Add New Party Theme" inline creation
- Optional field

**Step 7: Description**

- Textarea (optional)

---

## Phase 1: Core Modal (Current Phase)

### ✅ Components Completed

1. **EditTripModal.tsx** - Main modal component
   - Uses `AdminFormModal` wrapper (Trip Wizard styling)
   - Tab navigation with ocean theme
   - Fetches trip data via `/api/admin/trips/:id`
   - Loading and error states

### 🔧 Tabs Using Existing Trip Wizard Pages

All tabs reuse existing Trip Wizard page components with zero modifications:

1. **Trip Info Tab** → `BasicInfoPage.tsx`
   - Name, dates, description, hero image, highlights
   - Same component from Trip Wizard

2. **Location Tab** → `ResortDetailsPage.tsx` OR `ShipDetailsPage.tsx`
   - Conditional based on trip type
   - Same components from Trip Wizard

3. **Venues & Amenities Tab** → `ResortVenuesAmenitiesPage.tsx` OR `ShipVenuesAmenitiesPage.tsx`
   - Conditional based on trip type
   - Same components from Trip Wizard

4. **Schedule/Itinerary Tab** → `ResortSchedulePage.tsx` OR `CruiseItineraryPage.tsx`
   - Conditional based on trip type
   - Same components from Trip Wizard

### ❌ Removed Components

All AI-created components have been deleted:

- `Edit*.tsx` files
- `Event*.tsx` files
- `TripDayDropdown.tsx`
- `VenueDropdown.tsx`
- `TalentSelector.tsx`
- `PartyThemeSelector.tsx`

Starting fresh with Trip Wizard components only.

---

## Database Changes ✅

Already complete:

- ✅ `event_types` lookup table
- ✅ `venue_id` foreign key on events
- ✅ Migrations run successfully
- ✅ Storage.ts updated

---

## NEW: Smart Date Synchronization ✅

**Feature:** Automatic schedule/itinerary sync when trip dates change

**Implementation Date:** October 6, 2025

### How It Works

When a user changes the trip start/end dates in the Edit Trip Modal or Trip Wizard, the system automatically:

1. **Adjusts existing day dates** - All schedule/itinerary entries shift to match new date range
2. **Adds blank entries** - If trip is extended, new blank days are added automatically
3. **Warns before deletion** - If trip is shortened and days have data, shows confirmation dialog
4. **Preserves pre/post-trip days** - Days with negative numbers (pre-trip) and 100+ (post-trip) remain unchanged

### Components Created

**TripWizardContext.tsx** - Core sync logic:

- `syncScheduleWithDates()` - Syncs resort schedule entries
- `syncItineraryWithDates()` - Syncs cruise itinerary entries
- Date helper functions (local timezone aware)
- Smart merge logic preserving user data

**BasicInfoPage.tsx** - Date change detection:

- `useEffect` hook watches start/end date changes
- Triggers appropriate sync function based on trip type
- Shows toast notifications after successful sync
- Handles user confirmation for deletions

**ConfirmDeleteDaysDialog.tsx** - Warning dialog:

- Shows which days will be deleted
- Displays data preview for affected days
- Ocean-themed styling matching Trip Wizard
- Cancel/Confirm actions

**EditTripModal.tsx** - Data sanitization:

- `sanitizeItineraryEntries()` - Converts null → empty string
- `sanitizeScheduleEntries()` - Converts null → empty string
- Ensures API schema compliance

### Usage Contexts

✅ **Trip Wizard** (new trip creation) - Full date sync support
✅ **Edit Trip Modal** (editing existing trip) - Full date sync support
✅ **Draft Resume** (resuming saved draft) - Full date sync support

All contexts use the same `BasicInfoPage` component, so date sync works everywhere automatically.

### Scenarios Tested

✅ **Date Shift** (same length, different start) - Data preserved, dates adjusted
✅ **Trip Extension** - Existing data preserved, blank days added
✅ **Trip Shortening** (with data) - Warning dialog, user confirmation required
✅ **Trip Shortening** (no data) - Silent deletion, no warning needed
✅ **Pre/Post-Trip Preservation** - Negative and 100+ day numbers unaffected

### Technical Details

- **Local timezone handling** - All date parsing/formatting in local timezone (no UTC conversion)
- **Null safety** - All database null values converted to empty strings before API submission
- **Both trip types** - Works for both resort schedules AND cruise itineraries
- **Data validation** - Prevents API 400 errors from null values in string fields

---

## Cleanup Complete ✅

Deleted:

- ✅ Confusing documentation files
- ✅ "Edit Events" button from trips management
- ✅ EditEventsModal component (becoming a tab)

---

## Implementation Timeline

### Phase 1: Core Modal with Trip Wizard Pages ✅ COMPLETE

- [x] Cleanup - Delete AI components ✅
- [x] Create EditTripModal.tsx ✅
- [x] Add tab navigation ✅
- [x] Wire up Trip Wizard pages ✅
- [x] Populate TripWizardContext with existing trip data ✅
- [x] Test modal opening and tab switching ✅
- [x] Implement save functionality ✅
- [x] Test edit + save flow ✅
- [x] **NEW:** Smart date sync for schedule/itinerary ✅
- [x] **NEW:** Data sanitization (null → empty string) ✅

**Status:** Phase 1 fully complete and tested

### Phase 2: New Tabs (Future)

- [ ] Events tab
- [ ] Talent tab
- [ ] Trip Info sections tab

**Estimated:** 10-15 hours for Phase 2

---

## Success Criteria - Phase 1

✅ Open modal from "Edit Trip" in trips management
✅ Navigate freely between 4 tabs (Trip Info, Location, Venues & Amenities, Schedule/Itinerary)
✅ Edit using existing Trip Wizard components
✅ **Smart date sync** when changing trip dates (both resort and cruise)
✅ **Data sanitization** prevents API validation errors
✅ Save all changes with one button
✅ Works in Trip Wizard, Edit Trip Modal, and Draft Resume

## Success Criteria - Phase 2 (Future)

⏳ Add Events tab with inline venue/talent/party theme creation
⏳ Add Talent management tab
⏳ Add Trip Info sections tab (FAQ, packing lists, etc.)
⏳ Dirty state warns on cancel

---

## What's Next?

**Phase 2 Features** (when ready):

1. Events tab - Full event management with talent, venues, and party themes
2. Talent tab - Manage all talent associated with the trip
3. Trip Info tab - Custom information sections

**Current Status:** Phase 1 is production-ready. The Edit Trip Modal now has full date synchronization and works perfectly for both resort and cruise trips!

---

_Last updated: October 6, 2025_
