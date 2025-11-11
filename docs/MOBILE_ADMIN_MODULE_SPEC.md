# Mobile Admin Module Specification

**Document Version:** 1.0
**Last Updated:** January 2025
**Module:** Admin Trips Management (Mobile)

---

## Overview

This document specifies the mobile-specific design and functionality for the Admin Trips Management module. The mobile interface prioritizes touch-friendly interactions, clean visual hierarchy, and efficient use of limited screen space.

---

## Design Philosophy

### Core Principles

1. **Touch-First Design** - All interactive elements are sized for easy touch interaction (minimum 44px touch targets)
2. **Clean Visual Hierarchy** - Remove visual clutter, use white space effectively
3. **Frosted Glass Aesthetic** - Consistent use of `bg-white/10 backdrop-blur-xl` for cards and overlays
4. **No Container Backgrounds on Mobile** - Content appears directly on the Oxford Blue (#002147) background
5. **Desktop Unchanged** - All mobile-specific changes use responsive classes (no desktop modifications)

---

## Header & Navigation

### Page Header

**Layout:**

- Trip Management title with icon on the left
- Search, Filter, and Add buttons on the right
- All buttons use consistent round styling: `h-9 w-9 rounded-full bg-white/10`

**Button Specifications:**

```tsx
// Search Button
<Button className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15">
  <Search className="h-4 w-4" />
</Button>

// Filter Button (Dropdown)
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15">
      <Filter className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="bg-white/15 backdrop-blur-xl border-white/10">
    {/* Filter menu items */}
  </DropdownMenuContent>
</DropdownMenu>

// Add Button
<Button className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15">
  <Plus className="h-4 w-4" />
</Button>
```

### Section Header (Mobile Only)

**Purpose:** Display current filter selection
**Visibility:** Mobile only (`sm:hidden`)
**Location:** Between search/filter controls and trip cards

```tsx
<div className="sm:hidden px-1 mb-4">
  <h2 className="text-lg font-semibold text-white">{currentFilterLabel}</h2>
</div>
```

**Dynamic Text:**

- "All Trips" (default)
- "Preview"
- "Upcoming"
- "Past"
- Updates automatically when filter changes

---

## Search Functionality

### Search Bar

**Behavior:**

- Hidden by default
- Toggles open/close when search button is clicked
- Appears inline below header
- Smooth slide-in animation

**Styling:**

```tsx
<div className="relative px-1 animate-in fade-in slide-in-from-top-2 duration-200">
  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
  <Input
    className="h-11 rounded-full border-white/5 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0 transition-all"
    placeholder="Search voyages by name, ship, or cruise line"
  />
</div>
```

**Key Properties:**

- Subtle border: `border-white/5` (no bright border)
- Focus state: `focus-visible:border-white/20` with subtle ring
- Icon positioned inside input on left
- Auto-focus when opened

---

## Filter System

### Filter Dropdown

**Type:** Dropdown menu (not inline pills)
**Trigger:** Filter icon button in header
**Alignment:** Right-aligned to button

**Menu Styling:**

```tsx
<DropdownMenuContent align="end" className="bg-white/15 backdrop-blur-xl border-white/10">
  {filters.map(filter => (
    <DropdownMenuItem
      className={`text-white hover:bg-white/10 focus:bg-white/10 transition-colors ${
        isActive ? 'bg-white/20 font-medium' : ''
      }`}
    >
      <div className="flex items-center justify-between w-full gap-3">
        <span>{filter.label}</span>
        <span className="text-xs text-white/60">{filter.count}</span>
      </div>
    </DropdownMenuItem>
  ))}
</DropdownMenuContent>
```

**Filter Options:**

- Only show filters with count > 0
- Label on left, count on right
- Active filter highlighted with `bg-white/20`
- Frosted glass background matches three-dot menu

---

## Trip Cards

### Container Specifications

**Mobile:**

- No container background/border
- Cards appear directly on page background
- No top/bottom borders on section
- Spacing: `space-y-3` between cards

**Desktop/Tablet:**

- Full container with `rounded-2xl border border-white/10 bg-white/5`
- Header with border-bottom
- Footer with border-top

```tsx
// Section wrapper
<section className="relative sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/5 sm:shadow-2xl sm:shadow-black/40 sm:backdrop-blur">
```

### Card Layout

**Structure:**

```
┌─────────────────────────────────────────────────────┐
│  [Image]  Trip Name                    [⌄] [⋮]     │
│           Status Badge                              │
└─────────────────────────────────────────────────────┘
```

**Layout Code:**

```tsx
<Card className="border border-white/10 bg-white/10 backdrop-blur-xl overflow-hidden">
  <CardContent className="p-0">
    <div className="p-4">
      <div className="flex items-center gap-3">
        {/* Image - left aligned */}
        <div className="flex-shrink-0">{imageElement}</div>

        {/* Name and Status - middle, flexible width */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white font-medium">{tripName}</div>
          <div className="mt-2 text-xs">{statusBadge}</div>
        </div>

        {/* Buttons - right aligned */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {expandButton}
          {actionsMenu}
        </div>
      </div>
    </div>

    {/* Expanded section */}
    {isExpanded && (
      <div className="border-t border-white/10 bg-white/5 p-4 space-y-2">{hiddenFields}</div>
    )}
  </CardContent>
</Card>
```

### Card Specifications

**Main Card:**

- Background: `bg-white/10 backdrop-blur-xl` (frosted glass)
- Border: `border-white/10`
- Padding: `p-4`
- Alignment: `items-center` (vertically centered)

**Image:**

- Position: Left side
- No wrapping, fixed size
- `flex-shrink-0`

**Trip Name:**

- Font: `text-sm font-medium`
- Color: `text-white`
- Position: Below image, flexible width

**Status Badge:**

- Margin top: `mt-2` (8px spacing from name)
- Size: `text-xs` (smaller than default)
- Position: Directly under trip name

**Action Buttons:**

- Size: `h-8 w-8` (32px)
- Style: `rounded-full border border-white/15 bg-white/5`
- Icons: `h-4 w-4` (16px)
- Hover: `hover:bg-white/10`

### Expanded Section

**Specifications:**

- Background: `bg-white/5` (darker than main card)
- Border top: `border-t border-white/10`
- Padding: `p-4`
- Spacing: `space-y-2`

**Field Display:**

- **Regular fields:** Label on left, value on right
- **Highlights:** No label, badges displayed directly
- **Status:** Excluded (already shown in main card)

```tsx
{
  hiddenColumns
    .filter(column => column.key !== 'status')
    .map(column => (
      <div className={column.key === 'highlights' ? '' : 'flex justify-between items-start gap-2'}>
        {column.key !== 'highlights' && (
          <span className="text-xs text-white/50 font-medium">{column.label}:</span>
        )}
        <div
          className={
            column.key === 'highlights'
              ? 'text-sm text-white'
              : 'text-sm text-white text-right flex-1'
          }
        >
          {value}
        </div>
      </div>
    ));
}
```

---

## Dropdown Menus

### Three-Dot Actions Menu

**Styling:**

```tsx
<DropdownMenuContent align="end" className="bg-white/15 backdrop-blur-xl border-white/10">
  <DropdownMenuItem className="text-white hover:bg-white/10 focus:bg-white/10 transition-colors">
    {/* Menu items */}
  </DropdownMenuItem>
</DropdownMenuContent>
```

**Properties:**

- Background: Frosted glass `bg-white/15 backdrop-blur-xl`
- Border: `border-white/10`
- Text: `text-white`
- Hover: `hover:bg-white/10`
- Destructive items: `text-red-400 hover:bg-red-400/10`

### Filter Dropdown

**Same styling as actions menu:**

- Frosted glass background
- Right-aligned
- Active item highlighted
- Label and count layout

---

## Responsive Behavior

### Breakpoints

**Mobile:** Default (< 640px)
**Tablet:** `sm:` (≥ 640px)
**Desktop:** `lg:` (≥ 1024px)

### Mobile-Specific Classes

**Hide on Mobile:**

```tsx
className = 'hidden sm:flex'; // Desktop header
```

**Show on Mobile Only:**

```tsx
className = 'sm:hidden'; // Mobile section header
```

**Responsive Containers:**

```tsx
className = 'sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/5';
```

**Responsive Borders:**

```tsx
className = 'sm:border-t sm:border-white/10'; // Footer border
```

---

## Color Scheme

### Background Colors

- **Page background:** `#002147` (Oxford Blue) - solid, no gradient
- **Card background:** `bg-white/10 backdrop-blur-xl` (frosted glass)
- **Expanded section:** `bg-white/5` (darker shade)
- **Dropdown menus:** `bg-white/15 backdrop-blur-xl` (opaque frosted glass)

### Borders

- **Default:** `border-white/10`
- **Hover:** `border-white/20`
- **Active:** `border-white/20`

### Text Colors

- **Primary:** `text-white`
- **Secondary:** `text-white/60` or `text-white/50`
- **Disabled:** `text-white/40`

### Interactive States

- **Button background:** `bg-white/10`
- **Button hover:** `hover:bg-white/15`
- **Active filter:** `bg-white/20`
- **Menu hover:** `hover:bg-white/10`

---

## Touch Targets

### Minimum Sizes

All interactive elements meet the minimum 44px touch target requirement:

- **Icon buttons:** `h-9 w-9` (36px) + padding = ~44px effective area
- **Card actions:** `h-8 w-8` (32px) with surrounding padding
- **Dropdown items:** `py-2.5` (10px) + content height = ~44px

### Touch-Friendly Patterns

1. **Adequate spacing** between interactive elements
2. **Clear visual feedback** on hover/press
3. **No hover-only features** - all functionality available via tap
4. **Swipe gestures** not required - all actions via buttons

---

## Animation & Transitions

### Search Bar

```tsx
className = 'animate-in fade-in slide-in-from-top-2 duration-200';
```

- Fade in opacity
- Slide down from top
- 200ms duration

### Transitions

```tsx
className = 'transition-all'; // All properties
className = 'transition-colors'; // Color changes only
```

- Used on buttons, hover states, focus states
- Smooth visual feedback

---

## Accessibility

### ARIA Labels

```tsx
aria-label="Search trips"
aria-label="Filter trips"
aria-label="Add new trip"
```

### Focus States

- Visible focus rings on keyboard navigation
- `focus-visible:ring-1 focus-visible:ring-white/10`
- Focus states respect reduced motion preferences

### Keyboard Navigation

- Tab order follows visual order
- Dropdown menus close on Escape
- All interactive elements keyboard accessible

---

## Implementation Files

### Primary Files

1. **`/client/src/pages/admin/trips-management.tsx`**
   - Main page component
   - Header with search/filter/add buttons
   - Mobile section header
   - Trip list rendering

2. **`/client/src/components/admin/EnhancedTripsTable.tsx`**
   - Card layout implementation
   - Mobile vs desktop rendering
   - Expand/collapse functionality
   - Actions menu

### Related Components

- `/client/src/components/ui/dropdown-menu.tsx` - Dropdown implementation
- `/client/src/components/ui/button.tsx` - Button component
- `/client/src/components/ui/input.tsx` - Search input
- `/client/src/components/ui/card.tsx` - Card component

---

## Desktop vs Mobile Differences

### Desktop

✅ Container with background and border
✅ Table layout with columns
✅ Header with title inside container
✅ Footer with border-top
✅ All features visible

### Mobile

❌ No container background (cards on page background)
❌ Card layout instead of table
✅ Section header outside container
❌ No footer border
✅ Dropdown filters instead of inline
✅ Frosted glass cards
✅ Touch-optimized buttons

---

## Future Considerations

### Potential Enhancements

1. **Swipe actions** - Swipe to reveal common actions
2. **Pull to refresh** - Refresh trip list
3. **Infinite scroll** - Load more trips as user scrolls
4. **Bulk actions** - Select multiple trips
5. **Quick filters** - Swipeable filter chips at top

### Performance

- Virtualized scrolling for large lists
- Image lazy loading
- Optimistic UI updates

### Offline Support

- Cache trip data
- Offline indicators
- Sync when back online

---

## Change Log

### v1.0 - January 2025

- Initial mobile admin module specification
- Frosted glass card design
- Dropdown filter implementation
- Touch-optimized interface
- Mobile section header
- Removed container backgrounds on mobile

---

## Notes

- **Desktop unchanged:** All changes use responsive prefixes (`sm:`, `lg:`)
- **Consistent styling:** Frosted glass theme throughout
- **Touch-first:** All interactions optimized for touch
- **Clean hierarchy:** Remove clutter, focus on content

---

_For questions or updates to this specification, contact the development team._
