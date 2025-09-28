# Admin Settings Page Implementation Plan

## Overview
Transform the existing admin settings page into a dropdown table management interface following the trip management page design pattern. The admin will be able to manage 5 key lookup tables that populate dropdown menus throughout the application.

## Target Tables & Current Data
- **venue_types** (5 items): Dining, Entertainment, Bars, Spa, Recreation
- **trip_types** (2 items): Cruise, Resort
- **trip_status** (3 items): Upcoming, Current, Past
- **talent_categories** (7 items): Headliners, Vocalists, Drag & Variety, DJ's, Piano Bar / Cabaret, Comedy, Shows
- **location_types** (5 items): Embarkation, Disembarkation, Port, Sea Day, Resort

## Implementation Tasks

### 1. Backend API Development
- Create new API routes for each table:
  - `GET/POST/PUT /api/admin/venue-types`
  - `GET/POST/PUT /api/admin/trip-types`
  - `GET/POST/PUT /api/admin/trip-status`
  - `GET/POST/PUT /api/admin/talent-categories`
  - `GET/POST/PUT /api/admin/location-types`
- Follow existing API patterns from locations/ships routes
- Include proper validation and error handling
- **NO DELETE endpoints** - only add/edit functionality

### 2. Frontend Settings Page Redesign
- **Complete overhaul** of `client/src/pages/admin/settings.tsx`
- **Trip management layout pattern**: Header section + horizontal filter buttons + table view
- **Header section**: "Settings" title with description (no search bar)
- **Filter button section**: Horizontal buttons for each table type with counts
- **Table section**: Simple 2-column table (Name + Actions)
- **Add/Edit modals** following existing admin modal patterns

### 3. UI Components & Styling
- **Header styling**: Match trip management header exactly
- **Filter buttons**:
  - Active: `bg-blue-600 text-white` with `bg-white/20` count badge
  - Inactive: `bg-slate-700/50 text-slate-300 border border-slate-600` with `bg-slate-600` count badge
- **Table styling**: Simple 2-column table with standard admin table classes
- **Add buttons**: `bg-blue-600/20 border border-blue-500/30` with `text-blue-400` icon
- **Edit buttons**: `bg-slate-700/50 border border-slate-600/50` with `text-slate-300` icon
- **Modal forms**: Standard admin modal pattern (no 2-column grid needed)

### 4. Final Design (Approved)
- **Mockup file**: `/mockups/settings-trip-management-style.html`
- **Layout**: Trip management page pattern
- **No icons in table**: Just name and edit button
- **Tight, clean design**: Functional over flashy
- **Button switching**: Click filter buttons to switch between tables

### 5. Key Features
- **Add functionality**: Modal forms for creating new items
- **Edit functionality**: Pre-populated modals for updates
- **No delete**: Prevent accidental data loss
- **Table switching**: Filter buttons switch between different dropdown tables
- **Responsive design**: Mobile-friendly layout
- **Validation**: Prevent duplicate entries

## Design Requirements
- **Follow trip management page styling exactly**
- **NO gradients** - solid colors only
- **NO EnhancedTable components** - use simple HTML tables
- **NO image columns** - just name and actions
- **Button styling**: Match existing trip management filter buttons
- **Consistent with existing admin pages**: Same color scheme and layout patterns
- **No new page creation** - modify existing settings page only

## Phase Implementation
1. **Phase 1**: ✅ **COMPLETED** - Create and review HTML mockups
2. **Phase 2**: Implement backend API routes
3. **Phase 3**: Redesign frontend settings page using approved mockup
4. **Phase 4**: Testing and refinement