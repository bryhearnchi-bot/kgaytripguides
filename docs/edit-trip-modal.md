# Edit Trip Modal - Implementation Plan

**Created:** October 5, 2025
**Status:** Phase 1 Complete - Building Core Modal
**Last Updated:** October 5, 2025 1:50 PM

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

## Cleanup Complete ✅

Deleted:

- ✅ Confusing documentation files
- ✅ "Edit Events" button from trips management
- ✅ EditEventsModal component (becoming a tab)

---

## Implementation Timeline

### Phase 1: Core Modal with Trip Wizard Pages (Current)

- [x] Cleanup - Delete AI components ✅
- [x] Create EditTripModal.tsx ✅
- [x] Add tab navigation ✅
- [x] Wire up Trip Wizard pages ✅
- [ ] **NEXT:** Populate TripWizardContext with existing trip data
- [ ] **NEXT:** Test modal opening and tab switching
- [ ] **NEXT:** Implement save functionality
- [ ] **NEXT:** Test edit + save flow

**Estimated:** 3-4 hours remaining for Phase 1

### Phase 2: New Tabs (Future)

- [ ] Events tab
- [ ] Talent tab
- [ ] Trip Info sections tab

**Estimated:** 10-15 hours for Phase 2

---

## Success Criteria

✅ Open modal from "Edit Trip" in trips management
✅ See 7 tabs
✅ Navigate freely between tabs
✅ Edit using existing Trip Wizard components
✅ Add/edit/delete events with inline creation
✅ Manage trip talent
✅ Manage trip info sections
✅ Save all changes with one button
✅ Dirty state warns on cancel

---

_Last updated: October 5, 2025_
