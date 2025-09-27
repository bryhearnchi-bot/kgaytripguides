# Admin Header Standardization Plan

## Overview
Standardize headers across all admin pages to create a consistent user experience with search functionality moved to the header bar.

**Updated Design Decision**: Keep description lines on all pages - they provide helpful context and look better.

## Phase 1: Trips & Ships Pages ✅ COMPLETED

### Trips Page (`trips-management.tsx`) ✅
- **✅ Removed**: "Voyage Control" text from header
- **✅ Kept**: Description line "Monitor upcoming departures, live sailings, and archived voyages in one place." (looks better)
- **✅ Moved**: Search bar from FilterBar component to the header (right side)
- **✅ Kept**: Filter buttons in their current separate bar below the header

### Ships Page (`ships.tsx`) ✅
- **✅ Moved**: Search bar from the section below to the header (right side)
- **✅ Removed**: Three filter buttons ("Active", "Fleet", "Capacity")
- **✅ Kept**: Clean header structure with title on left, search on right

## Phase 2: Other Pages ✅ COMPLETED

### Sailings Page
- **NOTE**: Not yet implemented - was not in scope for this phase

### Resorts Page ✅
- **✅ Moved**: Search bar to header (right side)
- **✅ Removed**: Filter buttons ("Active", "Location", "Capacity")
- **✅ Maintained**: Consistent header layout

### Locations Page ✅
- **✅ Moved**: Search bar to header (right side)
- **✅ Removed**: Filter buttons ("Active", "Region", "Type")
- **✅ Maintained**: Consistent header layout

### Artists Page ✅
- **✅ Moved**: Search bar to header (right side)
- **✅ Removed**: Filter buttons ("Active", "Category", "Cruise")
- **✅ Maintained**: Consistent header layout

### Themes Page ✅
- **✅ Moved**: Search bar to header (right side)
- **✅ Removed**: Filter buttons ("Active", "Category", "Popular")
- **✅ Maintained**: Consistent header layout

### Trip Info Sections Page ✅
- **✅ Moved**: Search bar to header (right side)
- **✅ Removed**: Filter buttons ("Active", "Category", "Trip")
- **✅ Maintained**: Consistent header layout

### Users Page ✅
- **✅ Moved**: Search bar to header (right side)
- **✅ Removed**: Filter buttons ("Active", "Role", "Status")
- **✅ Maintained**: Consistent header layout

### Invitations Page ✅
- **✅ Created**: Proper header structure (converted from Card component)
- **✅ Removed**: Search bar entirely
- **✅ Moved**: Existing content into proper admin table container below header

### Settings Page ✅
- **✅ Moved**: Search bar to header (right side)
- **✅ Removed**: Filter buttons ("Active", "Category", "System")
- **✅ Standardized**: Header layout

### Profile Page
- **No changes needed** (as requested)

## Expected Outcome
After implementation, all admin pages will have:
- Consistent header structure with page title and icon on the left
- Search functionality (when needed) positioned on the right side of the header
- Filter controls remaining in a separate bar below the header when necessary
- Clean, unified appearance across the entire admin interface

## Implementation Notes
- Start with trips and ships pages as a test
- Get user approval before proceeding to other pages
- Ensure responsive behavior is maintained
- Keep the ocean theme styling consistent