# Trip Wizard - User Flow & Requirements

## Overview

The purpose of this feature is to enable users to add brand new trips into the database through a graphical interface with AI-powered assistance.

### Key Components

1. **Add New Trip (Wizard)** - Step-by-step wizard interface for creating new trips
2. **Update Trip (Tabbed Modal)** - Modal with multiple tabs for editing existing trips

### AI Integration

- AI generation features will be incorporated to assist with trip creation
- This is the foundation for future AI components throughout the application
- Will require implementing an AI plan/integration strategy

## Implementation Checklist

### Database & Schema ✓

- [ ] Create `resort_schedules` table with proper indexes
- [ ] Remove unused columns from `trips` table (ship_name, cruise_line, status, pricing, includes_info)
- [ ] Verify `trip_status_id` default is set to 1 (Upcoming)
- [ ] Verify `resort_id` and `ship_id` foreign keys exist in trips table
- [ ] Verify venue relationships are ONE-TO-ONE (unique constraints)
- [ ] Verify amenity relationships are MANY-TO-MANY
- [ ] Verify itineraries table has correct day_number/order_index logic
- [ ] Ensure constraint: trips must have EITHER resort_id OR ship_id, never both

### Backend API ✓

- [ ] OpenAI service (URL extraction, PDF extraction, chat, image search)
- [ ] Image service (download, upload to Supabase, cleanup)
- [ ] Trip creation endpoints (all wizard steps)
- [ ] Validation schemas with Zod
- [ ] Auto-generate schedule/itinerary entries when dates are saved
- [ ] Slug generation with uniqueness checking
- [ ] Venue management (create and link to resort/ship)
- [ ] Amenity management (find-or-create and link)
- [ ] Error handling with proper cleanup
- [ ] Authentication/authorization on all endpoints

### Frontend Components ✓

- [x] **TripWizard main component** - `/client/src/components/admin/TripWizard/TripWizard.tsx` (COMPLETE)
  - Modal wrapper with custom styling
  - Page routing and navigation
  - Cleanup on unmount
- [x] **TripWizardContext for state management** - `/client/src/contexts/TripWizardContext.tsx` (COMPLETE)
  - Manages wizard state (currentPage, tripType, buildMethod, tripData)
  - Provides state update functions
  - Tracks trip type for conditional page rendering
- [x] **BuildMethodPage (Initial Screen)** - `/client/src/components/admin/TripWizard/BuildMethodPage.tsx` (COMPLETE)
  - Three build method options (URL/PDF/Manual)
  - Interactive selection cards with ocean theme
  - AI-powered badges
  - Navigation to BasicInfoPage
- [x] **BasicInfoPage (Page 1)** - `/client/src/components/admin/TripWizard/BasicInfoPage.tsx` (COMPLETE)
  - Charter company dropdown (SingleDropDownNew)
  - Trip type selector with visual indicator
  - Trip name with auto-slug generation
  - Start/End date pickers with compact calendar
  - Hero image upload (ImageUploadField)
  - Description and highlights textareas
  - Two-column responsive layout
  - All components styled per TRIP-WIZARD-STYLE-GUIDE.md
- [x] **ResortDetailsPage (Page 2A)** - Complete resort details form
  - Two-column responsive layout (grid-cols-1 lg:grid-cols-2)
  - Fields: Resort name, location (LocationSearchBar), capacity, rooms, check-in/check-out times (TimePicker), image upload, description, property map URL
  - Conditional rendering based on tripType === 'resort'
  - Ocean theme styling following TRIP-WIZARD-STYLE-GUIDE.md
  - **FILE**: `/client/src/components/admin/TripWizard/ResortDetailsPage.tsx`
- [x] **ShipDetailsPage (Page 2B)** - Complete ship details form
  - Two-column responsive layout (grid-cols-1 lg:grid-cols-2)
  - Fields: Ship name, cruise line, capacity, decks, image upload, description, deck plans URL
  - Conditional rendering based on tripType === 'cruise'
  - Ocean theme styling following TRIP-WIZARD-STYLE-GUIDE.md
  - **FILE**: `/client/src/components/admin/TripWizard/ShipDetailsPage.tsx`
- [x] **ResortVenuesAmenitiesPage (Page 3A)** - Venues and amenities selection for resorts
  - Single column layout with two sections (Venues, Amenities)
  - Uses existing VenueSelector component (multi-select with create)
  - Uses existing AmenitySelector component (multi-select with create)
  - Conditional rendering based on tripType === 'resort'
  - Ocean theme styling following TRIP-WIZARD-STYLE-GUIDE.md
  - **FILE**: `/client/src/components/admin/TripWizard/ResortVenuesAmenitiesPage.tsx`
- [x] **ShipVenuesAmenitiesPage (Page 3B)** - Venues and amenities selection for ships
  - Single column layout with two sections (Venues, Amenities)
  - Uses existing VenueSelector component (multi-select with create)
  - Uses existing AmenitySelector component (multi-select with create)
  - Conditional rendering based on tripType === 'cruise'
  - Ocean theme styling following TRIP-WIZARD-STYLE-GUIDE.md
  - **FILE**: `/client/src/components/admin/TripWizard/ShipVenuesAmenitiesPage.tsx`
- [x] **ResortSchedulePage** (Page 4A) - COMPLETE
  - Daily schedule builder with auto-generated entries from trip dates
  - Two-column layout (image + description) per day
  - ImageUploadField for optional day images, Textarea for descriptions
  - Displays day number and formatted date for each entry
  - Ocean theme styling following TRIP-WIZARD-STYLE-GUIDE.md
  - **FILE**: `/client/src/components/admin/TripWizard/ResortSchedulePage.tsx`
- [x] **CruiseItineraryPage** (Page 4B) - COMPLETE
  - Port-by-port itinerary with auto-generated entries from trip dates
  - LocationSearchBar for port/location selection
  - TimePicker fields (arrival, departure, all aboard) in 24-hour format
  - ImageUploadField for optional port images, Textarea for descriptions
  - Displays day number and formatted date for each entry
  - Ocean theme styling following TRIP-WIZARD-STYLE-GUIDE.md
  - **FILE**: `/client/src/components/admin/TripWizard/CruiseItineraryPage.tsx`
- [ ] CompletionPage (Page 5)
- [ ] AIAssistantChat component (collapsible, persistent)
- [x] **VenueSelector** - Multi-select with create modal, single-line display (name + venue type) (COMPLETE)
- [x] **AmenitySelector** - Multi-select with create modal, single-line display (name only) (COMPLETE)
- [x] **LocationSearchBar** - Photon API integration for location search (COMPLETE)
- [ ] **LocationSelector** - Database location picker with create modal (PENDING)
  - Searches `locations` table in database (NOT Photon API)
  - "Add New Location" always shown at top of dropdown
  - Opens modal with LocationSearchBar + additional fields
  - Saves new location to database
  - Returns selected location
  - **AI Note**: When AI integration is added, AI should be able to suggest and auto-fill location details in the create modal
- [x] **ImageUpload component** - Using existing ImageUploadField component (COMPLETE)
- [x] **Add Day Functionality** - Modal for adding pre/post-trip days with date validation (COMPLETE)
- [ ] WizardNavigation (Next/Back/Save buttons)

### UI/UX ✓

- [ ] "Add New Trip" button on admin trips page
- [x] **Follow TRIP-WIZARD-STYLE-GUIDE.md** for ALL styling patterns (COMPLETE)
  - [x] Use ocean theme colors (cyan-400 accents, white/[0.04] backgrounds)
  - [x] Apply compact spacing system (space-y-2.5, gap-3)
  - [x] Use standard component sizing (h-10 inputs)
  - [x] Implement focus states with shadow rings
  - [x] Follow typography scale (text-xs labels, text-[10px] helpers)
- [x] Follow AdminFormModal.tsx styling (ocean theme, frosted glass) (COMPLETE)
- [x] All components use Shadcn/ui (COMPLETE)
- [x] Loading states for async operations (COMPLETE - implemented in BasicInfoPage)
- [ ] Progress indicator showing current wizard step
- [ ] Real-time field validation
- [ ] Error messages and success confirmations
- [x] Mobile responsive design (COMPLETE - two-column layout with lg: breakpoint)
- [ ] Keyboard navigation
- [ ] ARIA labels for accessibility

### AI Integration ✓

- [ ] URL extraction with OpenAI
- [ ] PDF extraction with OpenAI Vision
- [ ] Persistent chat window throughout wizard
- [ ] Context-aware chat (knows current page)
- [ ] Streaming responses
- [ ] Auto-populate form fields from extracted data
- [ ] Image search and download
- [ ] Description generation
- [ ] Venue/amenity suggestions
- [ ] Store chat history in wizard state
- [ ] Clear chat history on completion

### Image Handling ✓

- [ ] Download external images to temp storage
- [ ] Upload to Supabase storage
- [ ] Delete temp files immediately after upload (finally blocks)
- [ ] Cleanup on wizard completion
- [ ] Cleanup on wizard cancel/close
- [ ] Cleanup on error
- [ ] Track all temp files in wizard state
- [ ] Never store external image URLs in database
- [ ] Update CLAUDE.md with image storage rules

### Data Flow ✓

- [ ] Page 1: Save basic trip info, auto-generate schedule/itinerary entries
- [ ] Page 2A: Create resort, link to trip via trip.resort_id
- [ ] Page 2B: Create ship, link to trip via trip.ship_id
- [ ] Page 3A: Create resort venues (ONE-TO-ONE), link resort amenities (MANY-TO-MANY)
- [ ] Page 3B: Create ship venues (ONE-TO-ONE), link ship amenities (MANY-TO-MANY)
- [ ] Page 4A: Fill in resort schedule descriptions and images
- [ ] Page 4B: Fill in cruise itinerary locations, times, and images
- [ ] Page 5: Finalize, cleanup temp files, show link to trip page

### Edge Cases & Error Handling ✓

- [ ] AI extraction fails → Allow manual entry
- [ ] Image upload fails → Show error, allow retry
- [ ] Wizard cancelled → Cleanup temp files, optionally delete draft trip
- [ ] Browser closed mid-wizard → Handle on next load or cleanup job
- [ ] Invalid dates → Validation error
- [ ] Slug already exists → Append number
- [ ] No locations found → Allow creating new location
- [ ] Venue type not found → Allow creating new venue type

### Testing ✓

- [ ] Complete resort workflow end-to-end
- [ ] Complete cruise workflow end-to-end
- [ ] Test URL extraction with multiple charter websites
- [ ] Test PDF extraction
- [ ] Test AI chat throughout wizard
- [ ] Test image upload and cleanup
- [ ] Test navigation (back/forward)
- [ ] Test cancel/close cleanup
- [ ] Test venue ONE-TO-ONE constraint
- [ ] Test amenity MANY-TO-MANY relationship
- [ ] Test slug uniqueness
- [ ] Test auto-generation of schedule/itinerary
- [ ] Test trip guide page tab label (Schedule vs Itinerary)

### Environment & Deployment ✓

- [ ] Add OPENAI_API_KEY to environment variables
- [ ] Rotate exposed OpenAI key after adding to .env
- [ ] Verify Supabase storage buckets configured
- [ ] Verify temp file directory exists and has write permissions
- [ ] Update existing ship/resort edit modals to match venue/amenity logic

### Documentation ✓

- [x] **TRIP-WIZARD-STYLE-GUIDE.md v1.1** - Comprehensive styling documentation (completed)
  - [x] Implementation Status section added
  - [x] Completed components documented (BuildMethodPage, BasicInfoPage, ResortDetailsPage, ShipDetailsPage)
  - [x] Component fixes documented (z-index, pointer-events, calendar compact mode)
  - [x] Pending pages listed
  - [x] **CRITICAL RULE ADDED:** No page headers in wizard pages (modal already displays title)
  - [x] **FUTURE MIGRATION DOCUMENTED:** 24-hour time standardization across database and app
- [x] Reference style guide in trip-wizard.md (completed)
- [x] Update Component Library section with DatePicker component (completed)
- [x] Update Component Library section with TimePicker component (completed)
- [ ] API endpoint documentation
- [ ] Code comments in complex functions
- [x] Update CLAUDE.md with image storage rules (completed)
- [ ] Implementation notes for future developers

### ⚠️ Important Development Notes

**DO NOT Add Page Headers in Wizard Pages**

The TripWizard modal already displays dynamic page titles in the modal header via `getPageTitle()` and `getPageDescription()`. Adding additional headers inside wizard page components (like `<h2>Resort Details</h2>`) creates duplicate headers and wastes vertical space.

❌ **WRONG:**

```typescript
export function MyWizardPage() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Page Title</h2>
      </div>
      {/* form fields */}
    </div>
  );
}
```

✅ **CORRECT:**

```typescript
export function MyWizardPage() {
  return (
    <div className="space-y-2.5">
      {/* Start directly with form content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* form fields */}
      </div>
    </div>
  );
}
```

**24-Hour Time Standardization (Future Migration)**

All time fields will be standardized to 24-hour format (HH:MM) before production launch. This includes:

1. **Database Migration:**
   - Review all time columns across tables (trips, resorts, ships, schedules, events)
   - Convert any AM/PM formatted times to HH:MM format
   - Create migration script for existing data

2. **Application Updates:**
   - Audit all time-related components (already done for TimePicker)
   - Update any time formatting utilities
   - Search for AM/PM displays and convert to 24-hour
   - Update validation to enforce HH:MM format

**Status:** TimePicker component already uses 24-hour format. Full migration to be completed later.
**Priority:** Medium - Must complete before production launch.

---

### ⚡ Timezone-Safe Date Handling (IMPLEMENTED)

**CRITICAL:** This application NEVER converts timezones. All dates and times are in the destination's local timezone.

**Implementation Details:**

1. **Date Parsing - Always Use Local Timezone:**

```typescript
// ❌ WRONG - Causes UTC conversion
const date = new Date('2025-10-12'); // Interprets as UTC midnight

// ✅ CORRECT - Parse in local timezone
const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
```

2. **Date Formatting - Never Use toISOString():**

```typescript
// ❌ WRONG - Converts to UTC
const dateString = date.toISOString().split('T')[0];

// ✅ CORRECT - Format without timezone conversion
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const dateString = `${year}-${month}-${day}`;
```

3. **Implemented in All Date Components:**
   - `DatePicker` component - Uses parseDateString helper
   - `ResortSchedulePage` - formatDate, getMinMaxDates, useEffect
   - `CruiseItineraryPage` - formatDate, getMinMaxDates, useEffect
   - All date calculations use local timezone parsing

**Why This Matters:**

- Trip on Oct 12-18 displays as Oct 12-18 everywhere (not Oct 11-17)
- Cruise departure at 14:00 means 2:00 PM ship time
- No off-by-one date bugs

**Reference:** CLAUDE.md Critical Rule #1 - NO TIMEZONE CONVERSIONS

---

### 🗓️ Day Numbering System (IMPLEMENTED)

**Day Number Logic:**

| Day Type  | Day Number Range         | Display Label       | Use Case                |
| --------- | ------------------------ | ------------------- | ----------------------- |
| Pre-trip  | Negative (-1, -2, -3...) | "Pre-Trip"          | Days before trip starts |
| Regular   | 1 to 99                  | "Day 1", "Day 2"... | Main trip days          |
| Post-trip | 100+ (100, 101, 102...)  | "Post-Trip"         | Days after trip ends    |

**Calculation:**

- **Pre-trip days**: `dayNumber = -(days before start date)`
  - Example: Oct 11 is 1 day before Oct 12 start → dayNumber = -1
- **Regular days**: `dayNumber = 1, 2, 3...` (starts at Day 1, not Day 0)
- **Post-trip days**: `dayNumber = 100 + (days after end date) - 1`
  - Example: Oct 19 is 1 day after Oct 18 end → dayNumber = 100

**Implementation:**

```typescript
// Display logic
{
  entry.dayNumber < 1
    ? 'Pre-Trip'
    : entry.dayNumber >= 100
      ? 'Post-Trip'
      : `Day ${entry.dayNumber}`;
}

// Calculate pre-trip day number
const startDateObj = parseDateString(state.tripData.startDate);
const daysDiff = Math.floor(
  (startDateObj.getTime() - selectedDateObj.getTime()) / (1000 * 60 * 60 * 24)
);
newDayNumber = -daysDiff;

// Calculate post-trip day number
const endDateObj = parseDateString(state.tripData.endDate);
const daysDiff = Math.floor(
  (selectedDateObj.getTime() - endDateObj.getTime()) / (1000 * 60 * 60 * 24)
);
newDayNumber = 100 + daysDiff - 1;
```

**Add Day Functionality:**

- Modal allows adding pre-trip or post-trip days
- Calendar grays out already-added dates (`disabledDates` prop)
- Duplicate date prevention with alert
- Auto-scroll: Top for pre-trip, bottom for post-trip
- Validation: Prevents navigation with incomplete entries

**Database Storage:**

- Day numbers stored as-is in database (including negatives and 100+)
- Sorted by date for display
- UI displays appropriate label based on day number range

---

### 📍 Location Selection System (PENDING IMPLEMENTATION)

**Two Different Location Components:**

1. **LocationSearchBar** (Existing - for user profiles, etc.)
   - Direct Photon API search
   - Used in user profiles and other non-wizard contexts
   - No database storage of locations
   - Simple search and select

2. **LocationSelector** (New - for Trip Wizard ONLY)
   - Searches `locations` database table
   - "Add New Location" option always at top
   - Opens modal to create new locations
   - Saves to database for reuse

---

**LocationSelector Component Specification:**

**Purpose:** Allow selecting existing locations OR creating new ones during trip wizard flow

**Behavior:**

1. **Dropdown Search:**
   - Searches `locations` table in database (NOT Photon API)
   - Shows matching locations from database
   - **"Add New Location" always appears at the top** of dropdown menu
   - Single-select (user picks one location)

2. **Add New Location Modal:**
   - Triggered by clicking "Add New Location"
   - Contains:
     - **LocationSearchBar component** (existing Photon API search)
     - All additional fields needed for `locations` table
     - Save button
   - User workflow:
     1. Click "Add New Location"
     2. Modal opens
     3. Use LocationSearchBar to search Photon API
     4. Fill in additional location details
     5. Click Save → Location added to `locations` table
     6. Modal closes → New location is auto-selected in LocationSelector

3. **Where Used:**
   - **ResortDetailsPage**: Resort location field
   - **CruiseItineraryPage**: Port/location field for each itinerary entry

4. **Component Pattern:**
   - Follows VenueSelector/AmenitySelector pattern
   - Ocean theme modal styling
   - Wizard mode support
   - Database integration

**AI Integration (Future):**

- When AI Assistant is implemented, AI should:
  - Suggest locations based on trip context
  - Auto-fill location details in create modal
  - Search for location data from trip URL/PDF
  - Match locations to existing database entries when possible

**Database Fields (locations table):**

- `name` - Location name
- `city` - City name
- `state` - State/province
- `country` - Country
- `latitude` - Geographic coordinate
- `longitude` - Geographic coordinate
- Additional fields as needed

**Implementation Priority:** Must be completed before Page 4 (Itinerary) is functional

---

## User Flow

### Initial Screen: Choose Build Method

**First thing user sees when opening the wizard:**

**"How would you like to build this trip?"**

Three options:

1. **Import from URL**
   - User provides URL to charter company's trip page
   - AI extracts data automatically
2. **Upload PDF**
   - User uploads PDF file with trip information
   - AI extracts data from PDF
3. **Build Manually**
   - User fills in all information manually
   - No AI assistance (or minimal)

**Selected option determines AI Assistant behavior:**

- URL/PDF → AI Assistant chat window opens after import
- Manual → Skip AI Assistant or provide minimal help

---

### Page 1: New Trip Wizard - Basic Information

#### Step 0 (Conditional): AI Assistant - Persistent Chat Window

**Only appears if user selected "Import from URL" or "Upload PDF"**

**Feature: "AI Trip Builder Assistant"**

**For URL Import:**

- User provides URL to the charter company's trip page
- AI fetches and extracts all available trip data from HTML

**For PDF Upload:**

- User uploads PDF file
- AI extracts text and data from PDF document
- OpenAI Vision can process PDF pages as images if needed

**Common Flow (both URL and PDF):**

- AI does initial extraction of all available trip data
- **Small collapsible chat window remains available throughout entire wizard**
- User can iteratively request additional extractions via chat:
  - "Can you find the port departure times?"
  - "Extract the activities section"
  - "I see a pricing table, get the cabin types"
  - "Find the images for each port"
- AI auto-fills form fields in real-time as data is extracted
- Chat persists across all wizard pages

**Initial Extraction Includes:**

- Trip name, dates, description, highlights
- Itinerary (for cruises)
- Activities (for resorts)
- Location information
- Images (for locations/ports)

**UX Flow:**

1. User selects "Import from URL" or "Upload PDF"
2. Input modal appears (URL input or file upload)
3. User submits → AI processes (show loading state)
4. AI chat window opens with initial extraction summary
5. Chat window shows what was found and allows user to:
   - Ask for additional data extraction
   - Request re-extraction of specific fields
   - Get help finding data in the source
6. AI auto-populates wizard fields as data is extracted
7. Chat window remains docked/collapsible as user navigates wizard
8. User can still manually edit any field at any time

**Chat Window Features:**

- Collapsible panel (like support widget)
- Context-aware: knows which wizard page user is on
- Shows extraction history/log
- Real-time field highlighting when data is auto-filled
- "Re-scan" button for full re-extraction (URL or PDF)

**Technical Notes:**

- Use OpenAI API with streaming for chat responses
- GPT-4 Vision for PDF processing (treats pages as images)
- Maintain conversation context across wizard pages
- Store extracted data in wizard state (React Context)
- Use function calling for structured data extraction
- Cache original source (HTML or PDF) for follow-up extractions

#### Step 1: Charter Company Selection

- User selects which charter company this trip is with
- Data source: Charter companies from database

#### Step 2: Trip Type Selection

- User chooses trip type (Resort or Cruise)
- Data source: `trip_types` table in database

#### Step 3: Trip Details Form

**Required Fields:**

- **Trip Name** (text input)
  - Auto-generate slug from trip name
- **Start Date** (date picker)
- **End Date** (date picker)
- **Status**: Automatically set to "Upcoming" (trip_status_id = 1, verify this ID)

#### Step 4: Image Upload

- Use existing image upload modal
- Upload trip cover image

#### Step 5: Description

- Text area for trip description

#### Step 6: Highlights

- Input for trip highlights

---

### Page 2: Resort or Ship Details (FORK IN WORKFLOW)

**Flow branches based on Trip Type selected in Page 1**

#### Page 2A: Resort Details (if Trip Type = Resort)

**Data goes to: `resorts` table**

**Required Fields:**

- **Resort Name** (text input)
- **Location** (location picker/input)
- **Capacity** (number input)
- **Number of Rooms** (number input)
- **Image Upload** (use existing image modal)
- **Description** (text area)
  - AI can generate/find if not in original URL
- **Property Map URL** (text input)
  - AI Assistant can search for property map
- **Check-in Time** (time picker)
  - AI can search/find if not provided
- **Check-out Time** (time picker)
  - AI can search/find if not provided

**AI Assistant Tasks for this page:**

- Try to find high-quality image of resort
- Search for property map URL
- Search for check-in/check-out times if not provided
- Generate concise, interesting description if needed
- Potentially resize images to hero image dimensions

---

### Page 3A: Resort Venues & Amenities (if Trip Type = Resort)

**Data goes to: `resort_venues` and `resort_amenities` junction tables**

#### Resort Venues

**Database Schema:**

- `venues` table - Master list of all venues
- `venue_types` table - Categories: Dining, Entertainment, Bars, Spa, Recreation
- `resort_venues` table - Junction table linking resort_id ↔ venue_id

**Important:**

- ⚠️ **Venues are ONE-TO-ONE** - A venue can only be attached to ONE resort
- Each venue is unique to this specific resort

**UI/UX:**

- **Multi-select tagging interface** (reuse existing component from ship/resort edit modals)
- Add/create venues for this resort
- **Assign venue type to each venue** from dropdown:
  - Existing types: Dining, Entertainment, Bars, Spa, Recreation
  - Allow user to add new venue type if needed
  - AI can suggest new venue types if needed
- AI searches web for venue list if not in URL/PDF

#### Resort Amenities

**Database Schema:**

- `amenities` table - Master list of amenities (reusable)
- `resort_amenities` table - Junction table linking resort_id ↔ amenity_id

**Important:**

- ✅ **Amenities are MANY-TO-MANY** - Amenities can be attached to multiple resorts
- Select from existing amenities pool (e.g., "Pool", "Gym", "WiFi")
- Standard amenities reused across all resorts

**UI/UX:**

- **Multi-select tagging interface** (reuse existing component from ship/resort edit modals)
- Select amenities from master list
- Can add new amenities to master list if needed
- AI searches web for amenities if not in URL/PDF

**AI Assistant Tasks for this page:**

- Search web for resort venues if not provided
- Search web for resort amenities if not provided
- Suggest venue types if current categories don't fit
- Match found venues/amenities to existing database records when possible

---

#### Page 2B: Ship Details (if Trip Type = Cruise)

**Data goes to: `ships` table**

**Required Fields:**

- **Ship Name** (text input)
- **Cruise Line** (dropdown or text input)
  - Which cruise line the ship belongs to
- **Capacity** (number input)
- **Number of Decks** (number input)
- **Image Upload/URL** (use existing image modal)
- **Description** (text area)
  - AI can generate/find summary if not in original URL
- **Deck Plans URL** (text input)
  - AI searches cruisemapper.com for deck plans

**AI Assistant Tasks for this page:**

- Try to find high-quality image of ship
- Search cruisemapper.com for deck plans
- Generate concise, interesting ship description
- Potentially resize images to hero image dimensions
- Pull capacity and number of decks if available

---

### Page 3B: Ship Venues & Amenities (if Trip Type = Cruise)

**Data goes to: `ship_venues` and `ship_amenities` junction tables**

#### Ship Venues

**Database Schema:**

- `venues` table - Master list of all venues
- `venue_types` table - Categories: Dining, Entertainment, Bars, Spa, Recreation
- `ship_venues` table - Junction table linking ship_id ↔ venue_id

**Important:**

- ⚠️ **Venues are ONE-TO-ONE** - A venue can only be attached to ONE ship
- Each venue is unique to this specific ship

**UI/UX:**

- **Multi-select tagging interface** (reuse existing component from ship/resort edit modals)
- Add/create venues for this ship
- **Assign venue type to each venue** from dropdown:
  - Existing types: Dining, Entertainment, Bars, Spa, Recreation
  - Allow user to add new venue type if needed
  - AI can suggest new venue types if needed
- AI searches web for venue list if not in URL/PDF

#### Ship Amenities

**Database Schema:**

- `amenities` table - Master list of amenities (reusable)
- `ship_amenities` table - Junction table linking ship_id ↔ amenity_id

**Important:**

- ✅ **Amenities are MANY-TO-MANY** - Amenities can be attached to multiple ships
- Select from existing amenities pool (e.g., "Pool", "Gym", "WiFi")
- Standard amenities reused across all ships

**UI/UX:**

- **Multi-select tagging interface** (reuse existing component from ship/resort edit modals)
- Select amenities from master list
- Can add new amenities to master list if needed
- AI searches web for amenities if not in URL/PDF

**AI Assistant Tasks for this page:**

- Search web for ship venues if not provided
- Search web for ship amenities if not provided
- Suggest venue types if current categories don't fit
- Match found venues/amenities to existing database records when possible

---

---

### Page 4A: Resort Schedule (if Trip Type = Resort)

**Create new table: `resort_schedules`**

**Purpose:**

- Resorts stay in one location, so they need a daily schedule instead of an itinerary
- Shows what activities/events happen each day of the trip

**Required Fields:**

- `trip_id` (foreign key to trips table)
- `date` (date field, auto-calculated from trip start_date + day_number)
- `day_number` (integer, starts at 0 for pre-trip activities)
  - Example: Day 0, Day 1, Day 2, Day 3...
  - Display as "Day 0", "Day 1", "Day 2"...
- `order_index` (integer, starts at 1, NOT 0)
  - Example: 1, 2, 3, 4, 5...
  - Relationship: `order_index = day_number + 1` (initially)
  - Can be reordered independently from day_number
- `image_url` (text, optional)
  - Fun resort-themed image for that day
  - AI can find images, which are then downloaded and uploaded to Supabase storage
  - User can request different images from AI
  - ⚠️ **All images must be stored in Supabase storage, never external URLs**
- `description` (text)
  - High-level description of what happens that day
  - Example: "Day 1: Welcome reception and beach party"

**Auto-Generation:**

- ✅ As soon as start_date and end_date are known, automatically create schedule entries for each day
- Creates one entry per day between start_date and end_date
- User fills in descriptions and images on this page

**UI/UX:**

- List of days with ability to add/remove/reorder
- Each day has: day number, date, image, description
- AI can extract schedule from URL/PDF
- AI can find fun images for each day
- User can ask AI for different image suggestions

**AI Assistant Tasks:**

- Extract daily schedule from source document
- Find appropriate images for each day (download to temp → upload to Supabase → delete temp)
- Generate descriptions if not provided
- Suggest images when user requests alternatives
- ⚠️ All AI-found images must be downloaded and uploaded to Supabase storage
- ⚠️ Delete temporary files immediately after Supabase upload

---

### Page 4B: Cruise Itinerary (if Trip Type = Cruise)

**Uses existing table: `itineraries`**

**Purpose:**

- Cruises travel to multiple locations
- Needs embarkation/disembarkation info, ports, times

**Required Fields (verify existing schema):**

- `trip_id` (foreign key)
- `date` (date field, auto-calculated from trip start_date + day_number)
- `day_number` (integer, starts at 0 for pre-cruise activities)
  - Example: Day 0, Day 1, Day 2...
  - Display as "Day 0", "Day 1", "Day 2"...
- `order_index` (integer, starts at 1, NOT 0)
  - Example: 1, 2, 3, 4, 5...
  - Relationship: `order_index = day_number + 1` (initially)
  - Can be reordered independently from day_number
- `location_id` (foreign key to locations)
- `location_name` (text, from locations table)
- `arrival_time` (time field)
- `departure_time` (time field)
- `all_aboard_time` (time field)
- `description` (text, optional)
- `image_url` (text, optional)

**Auto-Generation:**

- ✅ As soon as start_date and end_date are known, automatically create itinerary entries for each day
- Creates one entry per day between start_date and end_date
- User fills in locations, times, and descriptions on this page

**Schema Verification Needed:**

- ⚠️ **Check how day_number and order_index are currently used in trip guide page**
- Ensure day_number starts at 0 (Day 0, Day 1, Day 2...)
- Ensure order_index starts at 1 (1, 2, 3, 4...)
- Verify relationship: `order_index = day_number + 1`

**UI/UX:**

- List of ports/days with ability to add/remove/reorder
- Each day has: location, times, image, description
- AI can extract itinerary from URL/PDF
- **Location picker** with existing locations database
  - Search/autocomplete from locations table
  - Can add new location if not found
  - Shows location details (city, country)

**AI Assistant Tasks:**

- Extract cruise itinerary from source document
- Match locations to existing locations in database
- Extract times (arrival, departure, all aboard)
- Find images for each port/location (download to temp → upload to Supabase → delete temp)
- ⚠️ All AI-found images must be downloaded and uploaded to Supabase storage
- ⚠️ Delete temporary files immediately after Supabase upload

---

**Note:** Workflows converge after this page.

---

### Page 5: Completion & Success

**Purpose:**

- Save all trip data to database
- Show success message
- Provide link to view the live trip page

**Actions on This Page:**

1. **Save all data to database:**
   - Trip basic info
   - Resort/Ship details
   - Venues and amenities
   - Itinerary or schedule
   - All uploaded images

2. **Show success confirmation:**
   - "Trip created successfully!"
   - Display trip name and dates
   - Show hero image preview

3. **Provide link to live page:**
   - Button: "View Trip Page"
   - Links to public trip guide page: `/trip-guide/[slug]`
   - User can see exactly how the trip appears to customers
   - ⚠️ **Trip visibility**: Newly created trips with status "Upcoming" are immediately visible on the site

4. **Additional actions:**
   - Button: "Edit Trip" - Opens edit modal if they need to make changes
   - Button: "Create Another Trip" - Resets wizard for new trip
   - Button: "Back to Dashboard" - Returns to admin dashboard

**Cleanup:**

- ⚠️ Delete all temporary files from local storage
- Clear wizard state/context
- Clear AI Assistant chat history

**UI/UX:**

- Success celebration (animation or icon)
- Clear call-to-action buttons
- Link prominently displayed

---

## Features & Requirements

### Wizard Entry Point

**Location:** Admin Trips Page (`/client/src/pages/admin/trips.tsx`)

- Add "Add New Trip" button in the header/toolbar
- Button opens the TripWizard modal/page
- Only visible to admin users

### Summary of Wizard Pages

**Initial Screen:** Choose build method (URL, PDF, or Manual)

**Page 1:** Basic Trip Information

- Charter company selection
- Trip type (Resort/Cruise)
- Trip name, dates, status
- Hero image upload
- Description and highlights

**Page 2A/2B:** Resort or Ship Details (workflow fork)

- **2A Resort:** Name, location, capacity, rooms, image, description, property map, check-in/out times
- **2B Ship:** Name, cruise line, capacity, decks, image, description, deck plans

**Page 3A/3B:** Venues & Amenities (workflow fork)

- **3A Resort:** Resort venues (one-to-one), resort amenities (many-to-many)
- **3B Ship:** Ship venues (one-to-one), ship amenities (many-to-many)

**Page 4A/4B:** Schedule or Itinerary (workflow fork)

- **4A Resort:** Daily schedule with images and descriptions
- **4B Cruise:** Port-by-port itinerary with locations, times, images

**Page 5:** Completion & Success

- Save all data
- Show success message
- Link to live trip page

**AI Assistant:** Persistent chat window throughout wizard (if URL/PDF import selected)

## Database Schema Changes Required

### Schema Verification Needed

**Verify the following relationships are correctly set up:**

- Venues: ONE-TO-ONE with resorts/ships (each venue belongs to only one property)
- Amenities: MANY-TO-MANY with resorts/ships (amenities are reusable)
- Check foreign key constraints match this logic

### Existing UI Components to Update

**Ship/Resort Edit Modals:**

- ⚠️ **Current ship edit modal may not follow correct venue/amenity logic**
- Need to ensure multi-select components allow:
  - Creating new venues (ONE-TO-ONE)
  - Selecting existing amenities (MANY-TO-MANY)
  - Adding new amenities to master list
- Reuse these updated components in the wizard

**Trip Guide Page (Public View):**

- ⚠️ **Update tab label based on trip type**
- If trip type = Resort → First tab: "Schedule"
- If trip type = Cruise → First tab: "Itinerary"
- Simple conditional: `{tripType === 'resort' ? 'Schedule' : 'Itinerary'}`

### New Table to Create: `resort_schedules`

**Purpose:** Daily schedule for resort trips (separate from cruise itineraries)

**Columns:**

- `id` (primary key)
- `trip_id` (foreign key to trips table)
- `date` (date, auto-calculated from start_date + day_number)
- `day_number` (integer, starts at 0)
- `order_index` (integer, starts at 1)
- `image_url` (text, optional)
- `description` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- Foreign key on `trip_id`
- Index on `trip_id, order_index` for sorting

**Auto-Generation Logic:**

- When trip start_date and end_date are saved (Page 1), automatically create schedule entries
- Calculate number of days: `(end_date - start_date) + 1`
- Create entries with:
  - day_number: 0, 1, 2, 3... (one for each day)
  - order_index: 1, 2, 3, 4... (day_number + 1)
  - date: start_date + day_number
  - description: empty (to be filled by user on Page 4A)

### Existing Table Verification: `itineraries`

**Purpose:** Port-by-port itinerary for cruise trips

⚠️ **Need to verify:**

- How `day_number` and `order_index` are currently implemented
- How they're used in the trip guide page
- Ensure `day_number` starts at 0
- Ensure `order_index` starts at 1

**Auto-Generation Logic:**

- When trip start_date and end_date are saved (Page 1), automatically create itinerary entries
- Calculate number of days: `(end_date - start_date) + 1`
- Create entries with:
  - day_number: 0, 1, 2, 3... (one for each day)
  - order_index: 1, 2, 3, 4... (day_number + 1)
  - date: start_date + day_number
  - location_id: null (to be filled by user on Page 4B)
  - times: null (to be filled by user on Page 4B)

### Trips Table Modifications

**Columns to Remove:**

1. `ship_name` - No longer needed
2. `cruise_line` - No longer needed
3. `status` (text column) - Redundant, using `trip_status_id` instead
4. `pricing` - No longer needed
5. `includes_info` - No longer needed

**Columns to Keep/Use:**

- `trip_status_id` - This will be the primary status field
  - Default value for new trips: 1 (Upcoming) - **verify this ID**
  - References `trip_statuses` table (should have: Upcoming, Active, Past)

**Critical Foreign Keys (Already Exist):**

- `resort_id` - Links trip to resort (for resort trips)
- `ship_id` - Links trip to ship (for cruise trips)
- ⚠️ **IMPORTANT**: Trips must have EITHER resort_id OR ship_id, never both
- Set resort_id when creating resort (Page 2A)
- Set ship_id when creating ship (Page 2B)

## Technical Implementation Notes

### Development Approach

**Phase 1: Design Mockups**

- Create HTML mockups for each page/step of the wizard
- Review and finalize design before implementation
- Ensure mockups follow the admin style guide (ocean theme, frosted glass effects)

**Phase 2: Implementation**
[To be determined after user flow is defined]

### UI Component Guidelines

**Component Library:**

- ✅ Use Shadcn/ui components for all new components
- ✅ Reuse existing components where possible
- ✅ **ALWAYS use `SingleDropDownNew`** component for all single-select dropdowns
  - Located at: `/client/src/components/ui/single-drop-down-new.tsx`
  - Provides searchable dropdown with icon support
  - Matches ocean theme styling automatically
  - Replaces native HTML `<select>` elements
  - **IMPLEMENTED**: Used in BasicInfoPage for Charter Company and Trip Type selection
- ✅ **ALWAYS use `DatePicker`** component for date selection
  - Located at: `/client/src/components/ui/date-picker.tsx`
  - Provides calendar popup with compact mode for tight spaces
  - Uses `Calendar` component internally with ocean theme styling
  - Automatically constrains popup width to match trigger button
  - **Supports date constraints**: `fromDate`, `toDate`, and `disabledDates` props
  - **Timezone-safe**: Parses date strings in local timezone (no UTC conversion)
  - **IMPLEMENTED**: Used in BasicInfoPage for Start Date and End Date fields
  - **IMPLEMENTED**: Used in ResortSchedulePage and CruiseItineraryPage with disabled dates
- ✅ **ALWAYS use `TimePicker`** component for time selection
  - Located at: `/client/src/components/ui/time-picker.tsx`
  - Provides 24-hour time input with automatic formatting (HH:MM)
  - Validates hours (0-23) and minutes (0-59)
  - Displays 12-hour format hint below input for user convenience
  - Matches ocean theme styling with cyan-400 accents
  - **IMPLEMENTED**: Used in ResortDetailsPage for Check-in and Check-out times

**Design Reference:**

- **📘 COMPREHENSIVE STYLE GUIDE**: `/client/src/components/admin/TripWizard/TRIP-WIZARD-STYLE-GUIDE.md`
  - Complete documentation of all styling patterns
  - Color system (ocean theme with cyan-400 accents)
  - Spacing system (space-y-2.5, gap-3, etc.)
  - Typography scale (text-xs labels, text-[10px] helpers)
  - Component sizing standards (h-10 inputs, icon sizes)
  - Interactive states (focus rings, hover effects)
  - Complete code examples
  - **Use this guide for ALL Trip Wizard pages and future AdminFormModal updates**
- Follow style of `/client/src/components/admin/AdminFormModal.tsx`
- Ocean theme with frosted glass effects
- Consistent with existing admin interface
- Use same spacing, colors, and interaction patterns

**SingleDropDownNew Usage:**

```typescript
import { SingleDropDownNew } from '@/components/ui/single-drop-down-new';
import { Ship, Building2, Calendar } from 'lucide-react';

// Example: Trip Type selector
<SingleDropDownNew
  label="Trip Type"
  placeholder="Select a trip type"
  emptyMessage="No trip type found."
  options={tripTypes.map(type => ({
    value: type.id.toString(),
    label: type.trip_type,
    icon: type.trip_type.toLowerCase() === 'cruise' ? Ship : Calendar
  }))}
  value={selectedValue}
  onChange={handleChange}
  required
/>
```

### Temporary File Management Strategy

**Image Download Flow:**

```typescript
// 1. AI finds external image URL
const externalImageUrl = 'https://example.com/image.jpg';

// 2. Download to temporary local storage
const tempFilePath = await downloadToTemp(externalImageUrl);

try {
  // 3. Upload to Supabase storage
  const supabaseUrl = await uploadToSupabase(tempFilePath);

  // 4. Store Supabase URL in database
  await saveToDatabase({ image_url: supabaseUrl });
} finally {
  // 5. Delete temporary file (always executes)
  await deleteTempFile(tempFilePath);
}
```

**Cleanup Triggers:**

1. **Immediately after Supabase upload** - Delete each temp file right after upload succeeds
2. **Wizard completion** - Delete all temp files when user clicks "Save" or "Finish"
3. **Wizard cancel/close** - Delete all temp files when user cancels or closes wizard
4. **Error handling** - Use `finally` blocks to ensure cleanup even on errors

**Implementation Details:**

- Store temp file paths in wizard state/context
- Track all temp files created during session
- Implement cleanup function that iterates through all tracked temp files
- Call cleanup on unmount, completion, cancel, and error

### AI Implementation Strategy

#### Recommended Approach: Extract → Preview → Approve

**Why this approach:**

- ✅ User has full visibility into what AI extracted
- ✅ Prevents bad data from entering database without review
- ✅ User maintains control over all data
- ✅ Clear separation between AI suggestions and user decisions
- ✅ Can highlight confidence levels for each extracted field

**Alternative approaches considered:**

- Auto-fill without preview: Too risky, no user control
- Progressive extraction: More complex, less transparent

#### OpenAI Integration

**API Configuration:**

- Add to `.env`: `OPENAI_API_KEY=sk-...`
- **⚠️ SECURITY NOTE**: The API key provided in chat should be rotated immediately after adding to environment variables (exposed keys should never be used)
- Use GPT-4 Turbo with Vision for comprehensive extraction
- Implement structured output using function calling/JSON mode

**Extraction Process:**

1. Fetch HTML content from provided URL
2. Send to OpenAI with structured extraction prompt
3. Parse response into structured data
4. Present to user in review modal with confidence scores
5. Store approved data in temporary state
6. Auto-populate wizard forms across all pages

**Data to Extract:**

- Basic trip info (name, dates, description)
- Itinerary (cruises) or activities (resorts)
- Location details with coordinates
- Port/destination information
- Images (parse image URLs, download, and upload to Supabase storage)
- Highlights and key features

**Image Handling:**

- ⚠️ **CRITICAL**: All images must be stored in Supabase storage
- AI finds external image URLs → Download to temp local storage → Upload to Supabase → Delete local temp file → Use Supabase URL
- Never store external image URLs in database

**Temporary File Cleanup:**

- Delete local temp files immediately after uploading to Supabase
- On wizard completion/save: Delete all temporary files from local storage
- On wizard cancel/close: Delete all temporary files from local storage
- Implement cleanup in finally blocks to ensure execution

---

## COMPREHENSIVE TECHNICAL IMPLEMENTATION PLAN

### Phase 1: Database Schema Changes & Migrations

#### 1.1 Create New Tables

**Migration: `resort_schedules` table**

```sql
CREATE TABLE resort_schedules (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resort_schedules_trip_id ON resort_schedules(trip_id);
CREATE INDEX idx_resort_schedules_trip_order ON resort_schedules(trip_id, order_index);
```

#### 1.2 Modify Existing Tables

**Migration: Remove columns from `trips` table**

```sql
ALTER TABLE trips
  DROP COLUMN IF EXISTS ship_name,
  DROP COLUMN IF EXISTS cruise_line,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS pricing,
  DROP COLUMN IF EXISTS includes_info;
```

**Verification: Check `trip_status_id` default**

```sql
-- Verify trip_statuses table has correct entries
SELECT * FROM trip_statuses;
-- Should have: id=1 (Upcoming), id=2 (Active), id=3 (Past)

-- Set default for trip_status_id
ALTER TABLE trips ALTER COLUMN trip_status_id SET DEFAULT 1;
```

#### 1.3 Verify Junction Table Relationships

**Check venue relationships (ONE-TO-ONE):**

```sql
-- Verify resort_venues has unique constraint on venue_id
-- Verify ship_venues has unique constraint on venue_id
-- This ensures each venue can only be attached to one resort/ship
```

**Check amenities relationships (MANY-TO-MANY):**

```sql
-- Verify resort_amenities allows multiple resorts per amenity
-- Verify ship_amenities allows multiple ships per amenity
```

#### 1.4 Verify `itineraries` Table Schema

**Check day_number and order_index logic:**

```sql
-- Review existing itineraries table structure
-- Ensure day_number starts at 0
-- Ensure order_index starts at 1
-- Check if date is auto-calculated or manually entered
```

---

### Phase 2: Backend API Development

#### 2.1 OpenAI Integration Service

**File: `server/services/openai-service.ts`**

```typescript
export class OpenAIService {
  // Initialize OpenAI client
  async extractFromURL(url: string): Promise<ExtractedTripData>;
  async extractFromPDF(pdfFile: Buffer): Promise<ExtractedTripData>;
  async chatCompletion(messages: ChatMessage[]): Promise<string>;
  async downloadAndUploadImage(imageUrl: string): Promise<string>;
  async findImages(query: string, count: number): Promise<string[]>;
  async generateDescription(context: string): Promise<string>;
}
```

**Key Functions:**

- HTML/PDF extraction using GPT-4
- Streaming chat responses for AI Assistant
- Image search and download
- Structured data extraction using function calling

#### 2.2 Image Processing Service

**File: `server/services/image-service.ts`**

```typescript
export class ImageService {
  async downloadToTemp(url: string): Promise<string>;
  async uploadToSupabase(tempPath: string, bucket: string): Promise<string>;
  async deleteTempFile(tempPath: string): Promise<void>;
  async cleanupTempFiles(paths: string[]): Promise<void>;
  async resizeImage(path: string, dimensions: Dimensions): Promise<string>;
}
```

**Key Functions:**

- Download external images to temp storage
- Upload to Supabase storage
- Cleanup temp files with error handling
- Image resizing for hero images

#### 2.3 Trip Creation API Endpoints

**File: `server/routes/trips-wizard.ts`**

**Endpoints:**

```typescript
// AI Extraction
POST   /api/trips/wizard/extract-url
POST   /api/trips/wizard/extract-pdf
POST   /api/trips/wizard/chat

// Trip Creation (Multi-step)
POST   /api/trips/wizard/create            // Create initial trip record
PUT    /api/trips/wizard/:id/basic         // Update basic info
PUT    /api/trips/wizard/:id/resort        // Add resort details
PUT    /api/trips/wizard/:id/ship          // Add ship details
PUT    /api/trips/wizard/:id/venues        // Add venues
PUT    /api/trips/wizard/:id/amenities     // Add amenities
PUT    /api/trips/wizard/:id/schedule      // Add resort schedule
PUT    /api/trips/wizard/:id/itinerary     // Add cruise itinerary
POST   /api/trips/wizard/:id/finalize      // Finalize and cleanup

// Image Operations
POST   /api/trips/wizard/images/upload
POST   /api/trips/wizard/images/ai-find
DELETE /api/trips/wizard/images/cleanup
```

#### 2.4 Validation Schemas

**File: `server/schemas/trip-wizard-schemas.ts`**

```typescript
// Zod schemas for each wizard step
export const basicTripSchema = z.object({
  charter_company_id: z.number(),
  trip_type_id: z.number(),
  name: z.string().min(3),
  slug: z.string(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  // ... more fields
});

export const resortDetailsSchema = z.object({
  name: z.string(),
  location_id: z.number(),
  capacity: z.number().positive(),
  // ... more fields
});

// ... more schemas for each step
```

---

### Phase 3: Frontend Component Architecture

#### 3.1 Wizard State Management

**File: `client/src/contexts/TripWizardContext.tsx`**

```typescript
interface TripWizardState {
  currentPage: number;
  tripType: 'resort' | 'cruise' | null;
  buildMethod: 'url' | 'pdf' | 'manual' | null;
  extractedData: ExtractedTripData | null;
  tripData: Partial<Trip>;
  resortData: Partial<Resort> | null;
  shipData: Partial<Ship> | null;
  venues: Venue[];
  amenities: Amenity[];
  schedule: ResortSchedule[];
  itinerary: Itinerary[];
  tempFiles: string[];
  aiChatHistory: ChatMessage[];
}

export const TripWizardProvider: React.FC;
export const useTripWizard: () => TripWizardContextType;
```

#### 3.2 Main Wizard Component

**File: `client/src/components/admin/TripWizard/TripWizard.tsx`**

```typescript
export const TripWizard: React.FC = () => {
  // Wizard orchestration
  // Page routing
  // Progress indicator
  // Cleanup on unmount
};
```

#### 3.3 Wizard Pages (Components)

**File Structure:**

```
client/src/components/admin/TripWizard/
├── TripWizard.tsx                    // Main wizard container
├── TripWizardContext.tsx             // State management
├── pages/
│   ├── BuildMethodPage.tsx           // Initial: URL/PDF/Manual
│   ├── BasicInfoPage.tsx             // Page 1: Basic trip info
│   ├── ResortDetailsPage.tsx         // Page 2A: Resort
│   ├── ShipDetailsPage.tsx           // Page 2B: Ship
│   ├── ResortVenuesAmenitiesPage.tsx // Page 3A: Resort venues/amenities
│   ├── ShipVenuesAmenitiesPage.tsx   // Page 3B: Ship venues/amenities
│   ├── ResortSchedulePage.tsx        // Page 4A: Resort schedule
│   ├── CruiseItineraryPage.tsx       // Page 4B: Cruise itinerary
│   └── CompletionPage.tsx            // Page 5: Success
├── components/
│   ├── AIAssistantChat.tsx           // Persistent AI chat window
│   ├── ImageUpload.tsx               // Image upload component
│   ├── VenueSelector.tsx             // Multi-select for venues
│   ├── AmenitySelector.tsx           // Multi-select for amenities
│   ├── ScheduleDay.tsx               // Individual schedule day
│   ├── ItineraryDay.tsx              // Individual itinerary day
│   └── WizardNavigation.tsx          // Next/Back/Save buttons
└── hooks/
    ├── useWizardNavigation.ts
    ├── useAIExtraction.ts
    └── useImageUpload.ts
```

#### 3.4 AI Assistant Chat Component

**File: `client/src/components/admin/TripWizard/components/AIAssistantChat.tsx`**

```typescript
export const AIAssistantChat: React.FC = () => {
  // Collapsible chat window
  // Message history
  // Streaming responses
  // Context-aware suggestions
  // Real-time field updates
};
```

**Features:**

- Docked/collapsible panel
- Shows extraction history
- Allows follow-up questions
- Auto-fills form fields when data is extracted
- Persists across wizard pages

#### 3.5 Reusable Components

**Multi-select Components:**

- Use existing multi-select from AdminFormModal.tsx
- Adapt for venues (create new) and amenities (select existing)

**Image Upload:**

- Use existing image modal
- Add AI image search integration

**Date/Time Pickers:**

- Use Shadcn/ui date picker
- Time picker for cruise itinerary

---

### Phase 4: Database Operations & Logic

#### 4.1 Auto-Generate Schedule/Itinerary Entries

**Function: `createScheduleEntries`**

```typescript
async function createScheduleEntries(tripId: number, startDate: Date, endDate: Date) {
  const days = calculateDays(startDate, endDate);
  const entries = [];

  for (let i = 0; i <= days; i++) {
    entries.push({
      trip_id: tripId,
      date: addDays(startDate, i),
      day_number: i,
      order_index: i + 1,
      description: '',
      image_url: null,
    });
  }

  await db.insert('resort_schedules').values(entries);
}
```

**Function: `createItineraryEntries`**

```typescript
async function createItineraryEntries(tripId: number, startDate: Date, endDate: Date) {
  // Similar to createScheduleEntries but for itineraries table
  // Leave location_id, times as null for user to fill
}
```

#### 4.2 Slug Generation

**Function: `generateSlug`**

```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Check for uniqueness and append number if needed
async function ensureUniqueSlug(slug: string): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;

  while (await slugExists(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}
```

#### 4.3 Venue/Amenity Management

**Venues (ONE-TO-ONE):**

```typescript
// When creating venues, ensure they're unique to this resort/ship
async function createVenues(
  propertyId: number,
  propertyType: 'resort' | 'ship',
  venues: VenueInput[]
) {
  for (const venue of venues) {
    // Create venue in venues table
    const venueId = await createVenue(venue);

    // Link to property
    if (propertyType === 'resort') {
      await linkResortVenue(propertyId, venueId);
    } else {
      await linkShipVenue(propertyId, venueId);
    }
  }
}
```

**Amenities (MANY-TO-MANY):**

```typescript
// When selecting amenities, reuse existing or create new
async function attachAmenities(
  propertyId: number,
  propertyType: 'resort' | 'ship',
  amenityNames: string[]
) {
  for (const name of amenityNames) {
    // Find or create amenity
    let amenityId = await findAmenityByName(name);
    if (!amenityId) {
      amenityId = await createAmenity(name);
    }

    // Link to property
    if (propertyType === 'resort') {
      await linkResortAmenity(propertyId, amenityId);
    } else {
      await linkShipAmenity(propertyId, amenityId);
    }
  }
}
```

---

### Phase 5: Integration & Testing

#### 5.1 OpenAI Integration Testing

**Test Cases:**

- URL extraction with various charter company websites
- PDF extraction with different PDF formats
- Chat completion with context
- Image search and download
- Error handling for invalid URLs/PDFs

#### 5.2 Image Pipeline Testing

**Test Cases:**

- Download external image to temp
- Upload to Supabase storage
- Cleanup temp files
- Handle upload errors (rollback)
- Multiple concurrent uploads

#### 5.3 Wizard Flow Testing

**Test Cases:**

- Complete wizard flow (resort)
- Complete wizard flow (cruise)
- Navigate back/forward between pages
- Cancel wizard (cleanup triggered)
- Save partial progress
- Resume from partial save

#### 5.4 Database Integrity Testing

**Test Cases:**

- Verify venue ONE-TO-ONE constraints
- Verify amenity MANY-TO-MANY relationships
- Verify auto-generated schedule/itinerary entries
- Verify slug uniqueness
- Verify trip_status_id defaults

---

### Phase 6: Security & Error Handling

#### 6.1 Input Validation

- Validate all inputs with Zod schemas
- Sanitize user inputs before database operations
- Validate file uploads (size, type)
- Validate external URLs before fetching

#### 6.2 Authentication & Authorization

- Verify admin role for all wizard endpoints
- Check permissions before modifying trips
- Rate limiting on AI endpoints
- API key protection for OpenAI

#### 6.3 Error Handling

```typescript
// Standardized error responses
try {
  await createTrip(data);
} catch (error) {
  logger.error('Trip creation failed', { error, data });

  // Cleanup on error
  await cleanupTempFiles(tempFiles);
  await rollbackTransaction();

  return res.status(500).json({
    error: 'Failed to create trip',
    code: 'TRIP_CREATE_ERROR',
  });
}
```

#### 6.4 Data Cleanup

- Delete temp files on error (finally blocks)
- Delete orphaned records on wizard cancel
- Clean up AI chat history on completion
- Remove draft trips after X days

---

### Phase 7: UI/UX Enhancements

#### 7.1 Loading States

- Show loading spinner during AI extraction
- Progress indicator for multi-step operations
- Skeleton loaders for form fields
- Streaming indicators for AI chat

#### 7.2 Validation Feedback

- Real-time field validation
- Clear error messages
- Required field indicators
- Success confirmations

#### 7.3 Accessibility

- Keyboard navigation
- ARIA labels
- Focus management
- Screen reader support

#### 7.4 Mobile Responsiveness

- Responsive wizard layout
- Mobile-friendly AI chat window
- Touch-friendly interactions
- Responsive image uploads

---

### Phase 8: Performance Optimization

#### 8.1 Code Splitting

- Lazy load wizard pages
- Lazy load AI Assistant component
- Split vendor bundles
- Dynamic imports for heavy components

#### 8.2 Caching

- Cache AI extraction results
- Cache fetched location/amenity data
- Memoize expensive computations
- Cache Supabase storage URLs

#### 8.3 Optimistic Updates

- Update UI immediately on user actions
- Rollback on error
- Show saving indicators
- Background sync

---

## Implementation Timeline (Claude Code)

**Total Estimated Time: ~10-12 hours**

### Phase 1: Foundation (~90 minutes)

1. **Database migrations (30 min)**
   - Create `resort_schedules` table
   - Remove unused columns from `trips` table
   - Verify junction table constraints
   - Update trip guide page tab logic

2. **Basic wizard structure (45 min)**
   - Create TripWizard component structure
   - Implement TripWizardContext
   - Build basic navigation and routing
   - Setup wizard pages scaffold

3. **Image service (15 min)**
   - Supabase upload functionality
   - Temp file management
   - Cleanup logic

### Phase 2: Core Features (~180 minutes)

1. **Wizard pages - Manual mode (120 min)**
   - Build all page components (Initial, Page 1-5)
   - Implement form validation with Zod
   - Connect to backend APIs
   - Build venue/amenity multi-select components
   - Schedule/itinerary day components

2. **Backend APIs (60 min)**
   - Trip creation endpoints (all routes)
   - Validation schemas
   - Error handling
   - Auto-generate schedule/itinerary logic
   - Slug generation

### Phase 3: AI Integration (~150 minutes)

1. **OpenAI service (60 min)**
   - URL/PDF extraction
   - Structured data parsing with function calling
   - Image search/download
   - Description generation

2. **Image processing (30 min)**
   - Download to temp
   - Upload to Supabase
   - Cleanup with finally blocks
   - Handle errors

3. **AI Assistant chat (60 min)**
   - Chat UI component
   - Streaming responses
   - Context management
   - Auto-population from chat
   - Persistent chat across pages

### Phase 4: UI/UX & Polish (~120 minutes)

1. **Styling & design (60 min)**
   - Follow AdminFormModal.tsx style
   - Ocean theme styling
   - Loading states
   - Progress indicators
   - Mobile responsiveness

2. **Error handling & validation (30 min)**
   - Real-time field validation
   - Clear error messages
   - Success confirmations
   - Cleanup on errors

3. **Accessibility (30 min)**
   - Keyboard navigation
   - ARIA labels
   - Focus management

### Phase 5: Testing & Refinement (~90 minutes)

1. **Manual testing (45 min)**
   - Test resort workflow end-to-end
   - Test cruise workflow end-to-end
   - Test navigation (back/forward)
   - Test cleanup triggers

2. **AI testing (30 min)**
   - Test URL extraction
   - Test PDF extraction
   - Test chat functionality
   - Test image download/upload

3. **Bug fixes & refinement (15 min)**
   - Fix issues found during testing
   - Refine UX based on testing

### Phase 6: Performance & Optimization (~60 minutes)

1. **Code splitting (20 min)**
   - Lazy load wizard pages
   - Lazy load AI Assistant component
   - Dynamic imports

2. **Caching & optimization (20 min)**
   - Cache AI extraction results
   - Memoize expensive computations
   - Optimize database queries

3. **Final review (20 min)**
   - Code review
   - Security audit
   - Performance check

### Phase 7: Documentation & Deployment (~30 minutes)

1. **Documentation (15 min)**
   - API documentation
   - Code comments
   - Implementation notes

2. **Environment setup (15 min)**
   - Add OPENAI_API_KEY to environment
   - Verify Supabase storage buckets
   - Final deployment checks

---

## Technical Risks & Mitigations

### Risk 1: AI Extraction Accuracy

**Mitigation:**

- Allow manual editing of all extracted data
- Show confidence scores
- Provide "Re-scan" functionality
- Test with multiple charter company websites

### Risk 2: Temporary File Cleanup Failures

**Mitigation:**

- Multiple cleanup triggers (success, error, cancel)
- Use finally blocks
- Background cleanup job for orphaned files
- Monitor temp directory size

### Risk 3: Complex State Management

**Mitigation:**

- Use React Context for wizard state
- Consider Zustand for more complex state
- Implement save/restore functionality
- Test navigation edge cases

### Risk 4: OpenAI API Costs

**Mitigation:**

- Cache extraction results
- Rate limiting on AI endpoints
- Monitor usage and costs
- Use appropriate model sizes (GPT-4 Mini for chat, GPT-4 for extraction)

### Risk 5: Database Performance

**Mitigation:**

- Index foreign keys properly
- Batch insert for schedule/itinerary entries
- Optimize queries with joins
- Use transactions for multi-step operations

---

## Success Metrics

### User Experience

- Time to create trip: < 10 minutes (with AI) vs 30 minutes (manual)
- AI extraction accuracy: > 90% for major fields
- User satisfaction: Gather feedback after launch

### Performance

- Wizard load time: < 2 seconds
- AI extraction time: < 30 seconds for URL, < 60 seconds for PDF
- Image upload time: < 5 seconds per image

### Reliability

- Temp file cleanup rate: 100%
- Wizard completion rate: > 80%
- Error rate: < 5%

---

## Future Enhancements

### Phase 2 Features (Post-Launch)

1. **Save as draft** - Allow users to save incomplete wizards
2. **Template trips** - Duplicate similar trips
3. **Bulk import** - Import multiple trips from spreadsheet
4. **AI-powered suggestions** - Suggest venues/amenities based on property type
5. **Image optimization** - Auto-resize and compress images
6. **Multi-language support** - Extract data in multiple languages

### Advanced AI Features

1. **Smart scheduling** - AI suggests optimal schedule based on trip type
2. **Venue recommendations** - AI suggests venues based on resort/ship
3. **Description enhancement** - AI improves user-written descriptions
4. **SEO optimization** - AI generates meta descriptions and keywords

---

## Critical Implementation Reminders

### 🚨 Database Relationships

1. **Trips → Resort/Ship**: When creating a resort (Page 2A), set `trip.resort_id`. When creating a ship (Page 2B), set `trip.ship_id`. NEVER set both.
2. **Venues**: ONE-TO-ONE relationship. Each venue belongs to only ONE resort or ship. Verify unique constraints exist.
3. **Amenities**: MANY-TO-MANY relationship. Amenities can be reused across multiple resorts/ships.

### 🚨 Image Handling

1. **NEVER store external image URLs** in the database. Always download → upload to Supabase → store Supabase URL.
2. **ALWAYS delete temp files** immediately after uploading to Supabase using `finally` blocks.
3. **Cleanup triggers**: On completion, on cancel, on close, on error.

### 🚨 Auto-Generation Logic

1. **Schedule/Itinerary entries** are auto-generated when start_date and end_date are saved on Page 1.
2. **day_number** starts at 0 (Day 0, Day 1, Day 2...)
3. **order_index** starts at 1 (1, 2, 3, 4...)
4. Relationship: `order_index = day_number + 1` (initially)

### 🚨 AI Integration

1. **OpenAI API key** must be in environment variables, never hardcoded.
2. **Rotate the exposed API key** from chat immediately after adding to .env.
3. **Chat window** persists across all wizard pages - store in wizard context.
4. **Cache** the original source (HTML or PDF) for follow-up AI requests.

### 🚨 User Experience

1. **Wizard entry point**: "Add New Trip" button on `/admin/trips` page.
2. **Trip guide page**: Tab label changes based on trip type (Schedule vs Itinerary).
3. **Completion page**: Shows link to live trip page at `/trip-guide/[slug]`.
4. **Styling**: Follow `AdminFormModal.tsx` - ocean theme, frosted glass.

### 🚨 Data Validation

1. **Zod schemas** for all wizard steps - validate on both client and server.
2. **Slug uniqueness** - append number if slug exists.
3. **Required fields** - clearly mark and validate before allowing navigation.

---

---

_End of Technical Implementation Plan_
