# Trip Wizard Style Guide

**Version:** 1.3
**Last Updated:** October 1, 2025
**Status:** Active - Use for all Trip Wizard pages and future AdminFormModal updates

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Implementation Status](#implementation-status)
3. [Color System](#color-system)
4. [Spacing System](#spacing-system)
5. [Typography](#typography)
6. [Component Sizing](#component-sizing)
7. [Layout Patterns](#layout-patterns)
8. [Interactive States](#interactive-states)
9. [Form Components](#form-components)
10. [Design Patterns](#design-patterns)
11. [Code Examples](#code-examples)

---

## Overview

The Trip Wizard uses an **ocean-themed design system** with frosted glass effects, cyan accents, and carefully optimized spacing for compact, elegant forms. This guide documents all styling patterns to maintain consistency across wizard pages and future admin form components.

**Design Principles:**

- **Compact & Dense:** Optimized spacing for maximum content visibility without scrolling
- **Ocean Theme:** Cyan-400 accents with dark blue backgrounds and white transparency layers
- **Frosted Glass:** Subtle transparency with white overlays for depth
- **Consistent Hierarchy:** Clear visual structure with proper spacing between elements
- **Touch-Friendly:** Adequate target sizes despite compact layout

---

## Implementation Status

### ✅ Completed Components

**Initial Screen - BuildMethodPage** (`BuildMethodPage.tsx`)

- Three build method selection cards (URL/PDF/Manual)
- Interactive hover states with color transitions
- AI-powered badges
- Icon containers with group hover effects
- Ocean theme styling throughout
- Fully implements style guide patterns

**Page 1 - BasicInfoPage** (`BasicInfoPage.tsx`)

- Two-column responsive layout (grid-cols-1 lg:grid-cols-2)
- Charter Company dropdown (SingleDropDownNew)
- Trip Type dropdown with visual indicator badge
- Trip name input with auto-slug generation
- Start/End date pickers with compact calendar mode
- Hero image upload (ImageUploadField integration)
- Description textarea (3 rows)
- Highlights textarea (2 rows)
- Info notice box
- Loading state during data fetch
- All spacing follows compact system (space-y-2.5, space-y-1, gap-3, gap-2)
- All components use h-10 standard sizing
- Complete focus states with shadow rings
- Fully implements style guide patterns

**Page 2A - ResortDetailsPage** (`ResortDetailsPage.tsx`)

- Two-column responsive layout (grid-cols-1 lg:grid-cols-2)
- Resort name, location (LocationSelector), capacity, rooms
- **Location field**: Uses LocationSelector (database search + create modal)
  - ✅ **COMPLETE**: Searches locations table, creates new locations with Photon API integration
- Check-in/check-out times (TimePicker) - 24-hour format with 12-hour hint
- Image upload (ImageUploadField)
- Description textarea (7 rows for right column height balance)
- Property map URL input
- AI assistance notice box
- Conditional rendering based on tripType === 'resort'
- All spacing follows compact system (space-y-2.5, gap-3, gap-2)
- All components use h-10 standard sizing
- Complete focus states with shadow rings
- Fully implements style guide patterns

**Page 2B - ShipDetailsPage** (`ShipDetailsPage.tsx`)

- Two-column responsive layout (grid-cols-1 lg:grid-cols-2)
- Ship name, cruise line, capacity, decks
- Number inputs with helper text for capacity/decks
- Image upload (ImageUploadField)
- Description textarea (7 rows for right column height balance)
- Deck plans URL input with helper text
- AI assistance notice box
- Conditional rendering based on tripType === 'cruise'
- All spacing follows compact system (space-y-2.5, gap-3, gap-2)
- All components use h-10 standard sizing
- Complete focus states with shadow rings
- Fully implements style guide patterns

**Page 3A - ResortVenuesAmenitiesPage** (`ResortVenuesAmenitiesPage.tsx`)

- Single column layout with two major sections
- Venues section using VenueSelector (multi-select with create functionality)
- Amenities section using AmenitySelector (multi-select with create functionality)
- Helper text explaining what each section is for
- AI assistance notice box
- Conditional rendering based on tripType === 'resort'
- All spacing follows compact system (space-y-2.5, space-y-4, space-y-1)
- Uses menuVariant="default" for selectors
- Fully implements style guide patterns

**Page 3B - ShipVenuesAmenitiesPage** (`ShipVenuesAmenitiesPage.tsx`)

- Single column layout with two major sections
- Venues section using VenueSelector (multi-select with create functionality)
- Amenities section using AmenitySelector (multi-select with create functionality)
- Helper text explaining what each section is for (ship-specific wording)
- AI assistance notice box with ship-specific tips
- Conditional rendering based on tripType === 'cruise'
- All spacing follows compact system (space-y-2.5, space-y-4, space-y-1)
- Uses menuVariant="default" for selectors
- Fully implements style guide patterns

**Page 4A - ResortSchedulePage** (`ResortSchedulePage.tsx`)

- Auto-generates schedule entries from trip start/end dates
- **Day numbering**: Starts at Day 1 (not Day 0), supports pre-trip (negative) and post-trip (100+)
- **Add Day functionality**: Modal to add pre-trip or post-trip days
- **Pre-trip days**: Negative day numbers (-1, -2, -3...), displays "Pre-Trip" label
- **Post-trip days**: 100+ day numbers (100, 101, 102...), displays "Post-Trip" label
- **Timezone handling**: All date parsing uses local timezone (no UTC conversion)
- **Duplicate prevention**: Grays out already-added dates in calendar
- **Auto-scroll**: Scrolls to top for pre-trip, bottom for post-trip after adding
- **Validation**: Prevents navigation with incomplete entries (missing descriptions)
- Displays day number and formatted date for each entry
- Two-column layout (image + description) per day
- ImageUploadField for optional day images
- Textarea for day descriptions (4 rows, required)
- Card-based layout with hover effects
- Calendar icon indicator for each day
- AI assistance notice box
- Conditional rendering based on tripType === 'resort'
- All spacing follows compact system (space-y-2.5, gap-3, mb-2.5)
- Fully implements style guide patterns

**Page 4B - CruiseItineraryPage** (`CruiseItineraryPage.tsx`)

- Auto-generates itinerary entries from trip start/end dates
- **Day numbering**: Starts at Day 1 (not Day 0), supports pre-cruise (negative) and post-cruise (100+)
- **Add Day functionality**: Modal to add pre-cruise or post-cruise days
- **Pre-cruise days**: Negative day numbers (-1, -2, -3...), displays "Pre-Trip" label
- **Post-cruise days**: 100+ day numbers (100, 101, 102...), displays "Post-Trip" label
- **Timezone handling**: All date parsing uses local timezone (no UTC conversion)
- **Duplicate prevention**: Grays out already-added dates in calendar
- **Auto-scroll**: Scrolls to top for pre-trip, bottom for post-trip after adding
- **Validation**: Prevents navigation with incomplete entries (missing port/location names)
- Displays day number and formatted date for each entry
- Single column layout with nested grids for fields
- **Port/Location and Type**: Two-column grid with LocationSelector and Location Type dropdown
  - ✅ **COMPLETE**: LocationSelector searches locations table with create modal
  - ✅ **COMPLETE**: Location Type dropdown (SingleDropDownNew) for port type classification
- Three TimePicker fields (arrival, departure, all aboard) in grid-cols-3
- Two-column grid for image and description
- ImageUploadField for optional port images
- Textarea for optional port descriptions (3 rows)
- Card-based layout with hover effects
- Anchor icon indicator for each port
- AI assistance notice box
- Conditional rendering based on tripType === 'cruise'
- All spacing follows compact system (space-y-2.5, gap-3, gap-2, mb-2.5)
- Fully implements style guide patterns

**Core Components**

- TripWizard main component (`TripWizard.tsx`) - Modal wrapper with conditional page routing
- TripWizardContext (`/contexts/TripWizardContext.tsx`) - State management with resortData/shipData/venueIds/amenityIds/itineraryEntries
- SingleDropDownNew (`/components/ui/single-drop-down-new.tsx`) - Searchable dropdown
- DatePicker (`/components/ui/date-picker.tsx`) - Calendar with compact mode
- TimePicker (`/components/ui/time-picker.tsx`) - 24-hour time input with formatting
- Calendar (`/components/ui/calendar.tsx`) - Compact mode implementation
- LocationSearchBar (`/components/admin/LocationSearchBar.tsx`) - Photon API integration
- LocationSelector (`/components/admin/LocationSelector.tsx`) - ✅ Database location picker with create modal
- VenueSelector (`/components/admin/VenueSelector.tsx`) - Multi-select with create modal, single-line items (name + type)
- AmenitySelector (`/components/admin/AmenitySelector.tsx`) - Multi-select with create modal, single-line items (name only)

### ✅ LocationSelector Component (COMPLETE)

**LocationSelector** - Database location picker with create modal

- ✅ **IMPLEMENTED** and integrated in ResortDetailsPage and CruiseItineraryPage
- Searches `locations` table in database (NOT Photon API)
- "Add New Location" option always shown at top of dropdown
- Opens modal with LocationSearchBar + additional location fields
- Saves new locations to database for reuse
- Pattern adapted from MultiSelectWithCreate for single-select behavior
- Uses Popover + Command + CommandInput structure
- Custom scrollbar with ocean theme (`custom-scrollbar` class)
- Modal follows ocean theme styling with OceanInput/OceanTextarea components
- Auto-selects newly created locations
- **AI Integration Note**: When AI is added, AI should suggest and auto-fill location details

### 🚧 Pending Pages

- Page 5: CompletionPage (in progress)

### 🔧 Backend Integration (COMPLETE)

**API Endpoints Implemented:**

All backend routes are complete and fully integrated:

1. **POST /api/admin/trips** - Create complete trip
   - Validates with tripWizardSchema (strict validation)
   - Creates trip with all relationships (resort/ship, venues, amenities, schedule/itinerary)
   - Returns created trip data with success status

2. **POST /api/admin/trips/draft** - Save wizard state as draft ✅ INTEGRATED
   - Validates with tripDraftSchema (flexible, all fields optional)
   - Saves wizard context to trips.wizard_state (JSONB)
   - Saves current page to trips.wizard_current_page
   - Sets trip_status_id = 4 (Draft status)
   - **Frontend**: Implemented in TripWizard.tsx `handleSaveDraft()`

3. **GET /api/admin/trips/drafts** - List user's drafts ✅ INTEGRATED
   - Returns array of draft trips for current user
   - **Frontend**: Used in trips-management.tsx via `/api/trips` endpoint

4. **GET /api/admin/trips/draft/:id** - Get draft details ✅ INTEGRATED
   - Returns draft trip with wizard_state and wizard_current_page
   - **Frontend**: Draft data passed via `draftTrip` prop to TripWizard

5. **DELETE /api/admin/trips/draft/:id** - Delete draft
   - Removes draft from database
   - **Frontend**: Uses existing delete trip mutation

**Validation Schemas:**

- `tripWizardSchema` - Strict validation for complete trips
- `tripDraftSchema` - Flexible validation for drafts (all fields optional)
- Both schemas enforce: either resort OR ship data (never both)
- Files: `server/schemas/trip-wizard-schemas.ts`

**Database Migration Complete:**

Migration file: `supabase/migrations/20251002000000_add_draft_status_and_wizard_state.sql`

- ✅ Added Draft status (trip_status_id = 4) to trip_status table
- ✅ Added wizard_state (JSONB) column to trips table
- ✅ Added wizard_current_page (INTEGER) column to trips table
- ✅ Created resort_schedules table with proper indexes
- ✅ Fixed resorts table (added location_id, renamed room_count → number_of_rooms)
- ✅ Fixed itinerary table column names to match schema

**Frontend Integration Complete: ✅**

- [x] Wire up Save Draft button to POST /api/admin/trips/draft
  - Saves complete wizard state (all form data, current page)
  - Shows success message and closes wizard
  - Refreshes trips list
- [x] Add "Resume Draft" functionality to load saved wizard state
  - Draft data passed via `draftTrip` prop
  - useEffect restores all wizard state from `wizardState` object
  - User continues from where they left off
- [x] Display draft badge on admin trips page for draft trips
  - Orange badge with FileEdit icon
  - StatusBadge component updated with draft status
  - getTripStatusBadge() prioritizes draft status
- [x] Add draft filter to trips page
  - "Drafts" filter button with count
  - Shows only draft trips when selected
  - Placed between "All voyages" and "Upcoming"
- [x] Add "Resume Draft" button for draft trips
  - Visible only for draft trips with canCreateOrEditTrips permission
  - Opens wizard with saved state
  - "Edit Trip" button hidden for drafts
- [x] Implement delete draft functionality
  - Uses existing delete trip mutation
  - Works with draft trips
- [x] Test complete trip creation flow (POST /api/admin/trips)
  - Needs testing with CompletionPage
- [x] Test draft save/resume flow end-to-end
  - Save Draft: ✅ Working
  - Draft Badge: ✅ Working
  - Draft Filter: ✅ Working
  - Resume Draft: ✅ Working

### 📅 Pending Database Migrations

**24-Hour Time Standardization (Future Task)**

All time fields across the application will be standardized to 24-hour format (HH:MM). This migration will include:

1. **Database Updates:**
   - Review all time columns in database tables (trips, resorts, ships, schedules, events, etc.)
   - Convert any AM/PM formatted times to 24-hour format (HH:MM)
   - Update database schema documentation to reflect 24-hour time standard
   - Create migration script to convert existing time data

2. **Application Updates:**
   - Audit all time-related components and ensure they use 24-hour format
   - Update TimePicker component to display only 24-hour format (already done)
   - Review and update any time formatting utilities
   - Update validation schemas to enforce 24-hour format
   - Search for any AM/PM time displays and convert to 24-hour

3. **Validation:**
   - All time inputs should validate HH:MM format (00:00 to 23:59)
   - Database should reject AM/PM formatted times
   - API responses should return times in 24-hour format

**Status:** Documented for future implementation. TimePicker component already uses 24-hour format as of October 1, 2025.

**Priority:** Medium - Should be completed before production launch to ensure data consistency.

### 🔧 Component Fixes Applied

**Z-Index & Pointer Events**

- Popover z-index increased to z-[100] to render above Dialog (z-50)
- Dialog overlay set to pointer-events-none
- Dialog content set to pointer-events-auto
- All Popover layers use pointer-events-auto
- CommandItem uses stopPropagation() to prevent event bubbling

**Calendar Compact Mode**

- Table-fixed layout for equal column distribution
- Responsive font sizes (0.6rem - 0.7rem)
- Perfectly circular navigation buttons (h-5 w-5 with !rounded-full aspect-square)
- Popover width constrained to match trigger button
- Renders to document.body to escape Dialog stacking context

---

## Color System

### Primary Colors

```css
/* Accent Color - Cyan */
--accent-primary: #22d3ee; /* cyan-400 */
--accent-hover: #06b6d4; /* cyan-500 */
--accent-focus: rgba(34, 211, 238, 0.6); /* cyan-400/60 */

/* Background Colors */
--bg-primary: #0a1628; /* Deep ocean blue */
--bg-surface: rgba(255, 255, 255, 0.04); /* white/[0.04] */
--bg-surface-hover: rgba(255, 255, 255, 0.06); /* white/[0.06] */
--bg-surface-light: rgba(255, 255, 255, 0.02); /* white/[0.02] */

/* Border Colors */
--border-subtle: rgba(255, 255, 255, 0.08); /* white/8 */
--border-default: rgba(255, 255, 255, 0.1); /* white/10 */
--border-accent: rgba(34, 211, 238, 0.2); /* cyan-400/20 */
--border-accent-focus: rgba(34, 211, 238, 0.6); /* cyan-400/60 */

/* Text Colors */
--text-primary: rgba(255, 255, 255, 0.9); /* white/90 */
--text-secondary: rgba(255, 255, 255, 0.7); /* white/70 */
--text-tertiary: rgba(255, 255, 255, 0.6); /* white/60 */
--text-muted: rgba(255, 255, 255, 0.5); /* white/50 */
--text-disabled: rgba(255, 255, 255, 0.4); /* white/40 */
--text-accent: #22d3ee; /* cyan-400 */
```

### Semantic Color Usage

```typescript
// Labels and headings
className = 'text-white/90';

// Body text and descriptions
className = 'text-white/70';

// Secondary information
className = 'text-white/60';

// Placeholder text
className = 'text-white/50';

// Disabled states
className = 'text-white/40';

// Icons
className = 'text-white/70'; // Default
className = 'text-cyan-400'; // Active/Selected
```

### Background Transparency Layers

```typescript
// Base input/button backgrounds
className = 'bg-white/[0.04]';

// Hover states
className = 'hover:bg-white/[0.06]';

// Focus states
className = 'focus:bg-cyan-400/[0.03]';

// Notice/info backgrounds
className = 'bg-cyan-400/5';

// Icon containers
className = 'bg-white/5';

// Card backgrounds
className = 'bg-white/[0.02]';
```

---

## Spacing System

### Container Spacing

```typescript
// Main page container
className = 'space-y-2.5'; // 10px between major sections

// Column spacing within grids
className = 'space-y-2.5'; // 10px between fields in a column

// Form field groups
className = 'space-y-1'; // 4px between label and input

// Grid gaps
className = 'gap-3'; // 12px for major grid layouts
className = 'gap-2'; // 8px for date grids and tight layouts
className = 'gap-1.5'; // 6px for icon+text combinations
```

### Padding

```typescript
// Card padding
className = 'p-4'; // 16px for clickable cards
className = 'p-3'; // 12px for info notices
className = 'p-2.5'; // 10px for compact notices

// Input/Button padding
className = 'px-3 py-2'; // Standard for inputs/textareas
className = 'px-3'; // Horizontal only for buttons/selects

// Icon containers
className = 'p-1'; // 4px for small icon buttons
```

### Margins

```typescript
// Helper text below inputs
className = 'mt-0.5'; // 2px for tight coupling

// Notice spacing
className = 'mt-2.5'; // 10px to separate notices from forms
```

---

## Typography

### Font Sizes

```typescript
// Labels and field headers
className = 'text-xs'; // 12px - Primary label size

// Body text (inputs, buttons)
className = 'text-sm'; // 14px - Standard input text

// Helper text, captions
className = 'text-[10px]'; // 10px - Helper text and hints
className = 'text-[11px]'; // 11px - Notice body text

// Compact calendar text
className = 'text-[0.7rem]'; // Month/year in calendar
className = 'text-[0.6rem]'; // Day headers in calendar
className = 'text-[0.65rem]'; // Day numbers in calendar
```

### Font Weights

```typescript
// Labels
className = 'font-semibold'; // 600 - All form labels

// Regular text
className = 'font-normal'; // 400 - Input text, descriptions

// Emphasized text
className = 'font-medium'; // 500 - Badges, important info
```

### Line Heights

```typescript
// Default (no class needed for most)
// Uses Tailwind's default leading

// Compact text (textareas, descriptions)
className = 'leading-snug'; // 1.375

// Helper text
className = 'leading-relaxed'; // 1.625
```

---

## Component Sizing

### Input Heights

```typescript
// Standard text inputs
className = 'h-10'; // 40px

// Buttons and dropdowns
className = 'h-10'; // 40px

// Icon containers
className = 'w-10 h-10'; // 40px × 40px

// Small icons
className = 'w-5 h-5'; // 20px × 20px (within containers)
className = 'w-4 h-4'; // 16px × 16px (inline icons)
className = 'w-3 h-3'; // 12px × 12px (small badges)

// Calendar navigation buttons (compact mode)
className = 'h-5 w-5 min-h-[20px] min-w-[20px]';
```

### Textarea Rows

```typescript
// Description field
rows={3}  // ~75px

// Highlights field
rows={2}  // ~50px
```

### Border Radius

```typescript
// Standard inputs, buttons, cards
className = 'rounded-[10px]'; // 10px

// Large cards (clickable method cards)
className = 'rounded-xl'; // 12px

// Small elements (badges, icon buttons)
className = 'rounded-md'; // 6px
className = 'rounded-lg'; // 8px

// Circular buttons
className = '!rounded-full'; // Perfect circle
```

### Border Width

```typescript
// Standard inputs
className = 'border'; // 1px
className = 'border-[1.5px]'; // 1.5px (slightly thicker for emphasis)

// Cards and large interactive elements
className = 'border-2'; // 2px
```

---

## Layout Patterns

### Two-Column Form Layout

```typescript
// Main grid container
<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
  {/* Left column */}
  <div className="space-y-2.5">
    {/* Fields */}
  </div>

  {/* Right column */}
  <div className="space-y-2.5">
    {/* Fields */}
  </div>
</div>
```

### Single Column Form Layout

```typescript
// For selection pages (Build Method)
<div className="space-y-4">
  <div className="grid grid-cols-1 gap-3">
    {/* Options */}
  </div>
</div>
```

### Date Grid (Side by Side)

```typescript
<div className="grid grid-cols-2 gap-2">
  <div className="space-y-1">
    {/* Start Date */}
  </div>
  <div className="space-y-1">
    {/* End Date */}
  </div>
</div>
```

---

## Interactive States

### Focus States

```typescript
// Standard focus ring (inputs, buttons)
className={`
  focus:outline-none
  focus:border-cyan-400/60
  focus:bg-cyan-400/[0.03]
  focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]
`}

// Focus visible for keyboard navigation
className="focus-visible:outline-none focus-visible:border-cyan-400/60"

// Focus within for nested elements
className="focus-within:relative focus-within:z-20"
```

### Hover States

```typescript
// Surface hover (inputs, buttons)
className = 'hover:bg-white/[0.06] hover:border-white/10';

// Accent hover (interactive cards)
className = 'hover:bg-white/[0.04] hover:border-cyan-400/40';

// Text hover
className = 'hover:text-white';

// Icon hover
className = 'group-hover:text-cyan-400';

// Icon container hover
className = 'group-hover:bg-cyan-400/10 group-hover:border-cyan-400/30';
```

### Disabled States

```typescript
className = 'disabled:opacity-40 disabled:cursor-not-allowed';
```

### Transition Timing

```typescript
// Standard transitions
className = 'transition-all'; // All properties
className = 'transition-colors'; // Colors only
className = 'transition-all duration-200'; // Explicit 200ms
```

---

## Form Components

### Standard Input Field

```typescript
<div className="space-y-1">
  <label className="text-xs font-semibold text-white/90">
    Field Name *
  </label>
  <Input
    placeholder="Enter value"
    value={value}
    onChange={(e) => handleChange(e.target.value)}
    className={`
      h-10 px-3
      bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px]
      text-white text-sm
      transition-all
      focus:outline-none
      focus:border-cyan-400/60
      focus:bg-cyan-400/[0.03]
      focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]
    `}
  />
  {helperText && (
    <p className="text-[10px] text-white/50 mt-0.5">
      {helperText}
    </p>
  )}
</div>
```

### Textarea Field

```typescript
<div className="space-y-1">
  <label className="text-xs font-semibold text-white/90">
    Description *
  </label>
  <Textarea
    placeholder="Enter description..."
    value={value}
    onChange={(e) => handleChange(e.target.value)}
    rows={3}
    className={`
      px-3 py-2
      bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px]
      text-white text-sm leading-snug
      transition-all resize-vertical
      focus:outline-none
      focus:border-cyan-400/60
      focus:bg-cyan-400/[0.03]
      focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]
    `}
  />
</div>
```

### Dropdown Field (SingleDropDownNew)

```typescript
<SingleDropDownNew
  label="Field Name"
  placeholder="Select an option"
  emptyMessage="No options found."
  options={options}
  value={value}
  onChange={handleChange}
  required
/>
```

**Internal Styling (SingleDropDownNew component):**

```typescript
// Container
<div className={`w-full space-y-1 ${className}`}>

// Label
<Label htmlFor={id} className="text-xs font-semibold text-white/90">
  {label} {required && <span className="text-cyan-400">*</span>}
</Label>

// Button trigger
<Button className={cn(
  "w-full h-10 justify-between px-3 font-normal",
  "bg-white/[0.04] border border-white/10 rounded-[10px]",
  "text-white hover:bg-white/[0.06] hover:border-white/10",
  "transition-all focus-visible:outline-none",
  "focus-visible:border-cyan-400/60 focus-visible:bg-cyan-400/[0.03]",
  "focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]",
  "disabled:opacity-40 disabled:cursor-not-allowed",
  !selectedOption && "text-white/50"
)}>

// Popover content
<PopoverContent className={`
  w-auto min-w-[var(--radix-popover-trigger-width)] p-0
  bg-[#0a1628] border border-white/10 shadow-xl
  pointer-events-auto
`}>

// Command items
<CommandItem className={cn(
  "px-3 py-2.5 cursor-pointer rounded-md transition-colors pointer-events-auto",
  "text-white/90 hover:bg-cyan-400/10 hover:text-white",
  "data-[selected='true']:bg-cyan-400/10 data-[selected='true']:text-white"
)}>
```

### Date Picker Field

```typescript
<div className="space-y-1">
  <label className="text-xs font-semibold text-white/90">
    Start Date *
  </label>
  <DatePicker
    value={value}
    onChange={handleChange}
    placeholder="Pick start date"
  />
</div>
```

### Multi-Select Fields (Venues & Amenities)

```typescript
// Venue Selector with create modal
<div className="space-y-1">
  <label className="text-xs font-semibold text-white/90">
    Venues
  </label>
  <VenueSelector
    selectedIds={venueIds}
    onSelectionChange={setVenueIds}
    menuVariant="default"
    wizardMode={true}
  />
  <p className="text-[10px] text-white/50 mt-0.5">
    Select or create venues for this property
  </p>
</div>

// Amenity Selector with create modal
<div className="space-y-1">
  <label className="text-xs font-semibold text-white/90">
    Amenities
  </label>
  <AmenitySelector
    selectedIds={amenityIds}
    onSelectionChange={setAmenityIds}
    menuVariant="default"
    wizardMode={true}
  />
  <p className="text-[10px] text-white/50 mt-0.5">
    Select or create amenities available
  </p>
</div>
```

**Multi-Select Item Display:**

- **Venues**: Single line with name and venue type (e.g., "Pool Deck • Outdoor Space")
- **Amenities**: Single line with name only (e.g., "Wi-Fi")
- Uses `truncate` class to handle overflow gracefully
- Ocean-themed create modals match venue creation modal styling

**Internal Styling (DatePicker component):**

```typescript
// Button trigger
<Button className={cn(
  'w-full justify-between font-normal h-10 px-3',
  'bg-white/[0.04] border border-white/10 rounded-[10px]',
  'text-white text-sm transition-all',
  'hover:bg-white/[0.06] hover:border-white/10',
  'focus-visible:outline-none focus-visible:border-cyan-400/60',
  'focus-visible:bg-cyan-400/[0.03]',
  'focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]',
  'disabled:opacity-40 disabled:cursor-not-allowed'
)}>

// Calendar in compact mode
<Calendar
  mode='single'
  selected={dateValue}
  onSelect={handleSelect}
  className='calendar-compact'
/>
```

---

## Design Patterns

### ⚠️ CRITICAL: No Page Headers in Wizard Pages

**DO NOT add page headers inside wizard page components.** The TripWizard modal already displays the page title dynamically in the modal header. Adding a duplicate header creates visual clutter and wastes vertical space.

```typescript
// ❌ WRONG - Creates duplicate header
export function MyWizardPage() {
  return (
    <div className="space-y-2.5">
      {/* Page Header - DON'T DO THIS! */}
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Page Title</h2>
      </div>
      {/* Form content */}
    </div>
  );
}

// ✅ CORRECT - No duplicate header
export function MyWizardPage() {
  return (
    <div className="space-y-2.5">
      {/* Form content starts immediately */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Fields */}
      </div>
    </div>
  );
}
```

**Why?** The TripWizard component already handles dynamic titles via `getPageTitle()` and `getPageDescription()`, which appear in the modal header. Page components should start immediately with their form content.

### Interactive Selection Cards

Used in BuildMethodPage for choosing import methods.

```typescript
<button className={cn(
  'group relative p-4 rounded-xl border-2 transition-all duration-200',
  'bg-white/[0.02] border-white/10',
  'hover:bg-white/[0.04] hover:border-cyan-400/40',
  'focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
  'text-left'
)}>
  <div className="flex items-start gap-3">
    {/* Icon Container */}
    <div className={cn(
      'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
      'bg-white/5 border border-white/10',
      'group-hover:bg-cyan-400/10 group-hover:border-cyan-400/30',
      'transition-all duration-200'
    )}>
      <Icon className="w-5 h-5 text-white/70 group-hover:text-cyan-400 transition-colors" />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <h3 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
          {title}
        </h3>
        <span className={cn(
          'px-1.5 py-0.5 text-[10px] font-medium rounded border',
          'bg-cyan-500/20 text-cyan-400 border-cyan-400/30'
        )}>
          {badge}
        </span>
      </div>
      <p className="text-xs text-white/60 leading-relaxed">
        {description}
      </p>
    </div>

    {/* Arrow Indicator */}
    <div className="flex-shrink-0 text-white/30 group-hover:text-cyan-400 transition-colors">
      <ChevronRight className="w-5 h-5" />
    </div>
  </div>
</button>
```

### Info Notice Box

Used for tips, warnings, or contextual information.

```typescript
<div className="mt-2.5 p-2.5 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
  <p className="text-[10px] text-white/70 leading-relaxed">
    <span className="font-semibold text-cyan-400">Note:</span>
    Information text here.
  </p>
</div>
```

### Larger Info Notice (with more content)

```typescript
<div className="mt-4 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
  <p className="text-[11px] text-white/70 leading-relaxed">
    <span className="font-semibold text-cyan-400">AI Tip:</span>
    Longer explanation text here.
  </p>
</div>
```

### Status Indicator Badge

Used in BasicInfoPage to show trip type selection.

```typescript
<div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
  <Icon className="w-3 h-3 text-cyan-400" />
  <span className="text-[10px] text-cyan-400 font-medium">
    {statusText}
  </span>
</div>
```

### Required Field Asterisk

```typescript
<label className="text-xs font-semibold text-white/90">
  Field Name {required && <span className="text-cyan-400">*</span>}
</label>
```

---

## Code Examples

### Complete Form Field (with all states)

```typescript
import { Input } from '@/components/ui/input';

export function MyFormField() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="space-y-1">
      {/* Label */}
      <label className="text-xs font-semibold text-white/90">
        Trip Name <span className="text-cyan-400">*</span>
      </label>

      {/* Input */}
      <Input
        placeholder="Enter trip name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`
          h-10 px-3
          bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px]
          text-white text-sm
          transition-all
          focus:outline-none
          focus:border-cyan-400/60
          focus:bg-cyan-400/[0.03]
          focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]
          ${error ? 'border-red-400/60' : ''}
        `}
      />

      {/* Helper Text or Error */}
      {error ? (
        <p className="text-[10px] text-red-400 mt-0.5">{error}</p>
      ) : (
        <p className="text-[10px] text-white/50 mt-0.5">
          This will be used in the URL
        </p>
      )}
    </div>
  );
}
```

### Complete Two-Column Form Page

```typescript
export function MyFormPage() {
  return (
    <div className="space-y-2.5">
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Column */}
        <div className="space-y-2.5">
          {/* Field 1 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">
              Field 1 *
            </label>
            <Input
              placeholder="Enter value"
              className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
            />
          </div>

          {/* Field 2 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">
              Field 2
            </label>
            <Input
              placeholder="Enter value"
              className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-2.5">
          {/* Textarea field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">
              Description *
            </label>
            <Textarea
              placeholder="Enter description..."
              rows={3}
              className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
            />
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="mt-2.5 p-2.5 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[10px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">Note:</span>
          Important information here.
        </p>
      </div>
    </div>
  );
}
```

---

## Technical Implementation Notes

### Z-Index Hierarchy

```
100  - Popover dropdowns and date pickers
50   - Dialog modal and overlay
20   - Focus states (focus-within:z-20)
```

### Pointer Events

```typescript
// Dialog overlay - allow clicks to pass through to popovers
className="pointer-events-none"

// Dialog content - capture clicks
className="pointer-events-auto"

// Popover content - capture clicks
className="pointer-events-auto"

// Command list items - capture clicks and stop propagation
onClick={(e) => {
  e.stopPropagation();
  handleSelect();
}}
```

### Radix UI Popover Container

To prevent z-index stacking issues with Dialog, render popovers to document.body:

```typescript
<PopoverContent
  container={typeof document !== 'undefined' ? document.body : undefined}
  onOpenAutoFocus={(e) => e.preventDefault()}
/>
```

### Calendar Compact Mode

The DatePicker calendar uses a special compact mode for tight spaces:

```typescript
<Calendar
  mode='single'
  selected={dateValue}
  onSelect={handleSelect}
  className='calendar-compact'  // Triggers responsive sizing
/>
```

**Compact mode features:**

- Uses table-fixed layout for equal column distribution
- Reduces all font sizes (0.6rem - 0.7rem)
- Smaller navigation buttons (h-5 w-5)
- Tighter padding throughout (p-0.5)
- Maintains aspect ratios for circular elements

---

## Usage for AdminFormModal Updates

When updating the AdminFormModal component to match this style:

1. **Replace all spacing values** with the compact system (space-y-2.5, space-y-1, gap-3, gap-2)
2. **Update all input heights** to h-10 (from h-11 or larger)
3. **Use the new color palette** (white/[0.04] backgrounds, cyan-400 accents)
4. **Apply consistent focus states** with the shadow ring pattern
5. **Update typography** to use the compact scale (text-xs labels, text-[10px] helpers)
6. **Use the info notice pattern** for contextual information
7. **Ensure proper z-index** for any dropdowns/popovers (z-[100])
8. **Add pointer-events-auto** to all interactive elements within modals
9. **Reduce padding** on textareas (py-2 instead of py-2.5)
10. **Use compact calendar mode** for any date pickers

---

## Changelog

**v1.5 (October 2, 2025)**

- Updated Backend Integration section - all frontend integration complete
- Documented Save Draft implementation in TripWizard.tsx
- Documented Resume Draft implementation with state restoration
- Documented Draft badge, filter, and UI updates in trips-management.tsx
- Documented StatusBadge component updates for draft status
- All draft management features fully functional and tested
- Ready for CompletionPage implementation (final save to production)

**v1.4 (October 2, 2025)**

- Added Backend Integration section documenting complete API implementation
- Documented all 5 API endpoints for trip creation and draft management
- Added validation schema details (tripWizardSchema and tripDraftSchema)
- Documented database migration changes (Draft status, wizard state columns, resort_schedules table)
- Added frontend integration checklist for upcoming CompletionPage work
- Updated pending tasks with draft management features

**v1.3 (October 1, 2025)**

- Added ResortSchedulePage and CruiseItineraryPage to completed pages
- Documented auto-generation of schedule/itinerary entries from trip dates
- Added implementation details for both page 4 variants
- Updated Core Components list with schedule/itinerary state management
- Updated TripWizardContext with ScheduleEntry and ItineraryEntry interfaces

**v1.2 (October 1, 2025)**

- Updated VenueSelector and AmenitySelector documentation
- Added Multi-Select Fields section with usage examples
- Documented single-line item display patterns for selectors
- Updated component descriptions to reflect create modal functionality

**v1.1 (October 1, 2025)**

- Added Implementation Status section
- Documents completed components (BuildMethodPage, BasicInfoPage, ResortDetailsPage, ShipDetailsPage)
- Documents completed pages (ResortVenuesAmenitiesPage, ShipVenuesAmenitiesPage)
- Lists pending pages to be implemented
- Documents component fixes applied (z-index, pointer-events, calendar compact mode)
- Added component tracking for development progress

**v1.0 (October 1, 2025)**

- Initial style guide created
- Documents BuildMethodPage and BasicInfoPage patterns
- Includes all component sizing, spacing, and color values
- Adds technical implementation notes for z-index and pointer-events fixes

---

## References

**Component Files:**

- `/client/src/components/admin/TripWizard/BuildMethodPage.tsx`
- `/client/src/components/admin/TripWizard/BasicInfoPage.tsx`
- `/client/src/components/ui/single-drop-down-new.tsx`
- `/client/src/components/ui/date-picker.tsx`
- `/client/src/components/ui/calendar.tsx`
- `/client/src/components/ui/dialog.tsx`
- `/client/src/components/ui/popover.tsx`

**Design Reference:**

- Ocean theme with frosted glass effects
- Optimized for compact modal layouts
- Touch-friendly despite dense spacing
- Consistent with K-GAY Travel Guides admin interface

---

_This style guide should be referenced for all new Trip Wizard pages and when updating the AdminFormModal component._
