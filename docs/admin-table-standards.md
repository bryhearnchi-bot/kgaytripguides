# Admin Table Standards

## Quick Reference Guide

This document defines the **EXACT** specifications that MUST be followed for ALL admin tables to maintain consistency across the application.

## Table Structure

Every admin table follows this exact structure:
1. **First Column**: Image (fixed 80px width)
2. **Middle Columns**: Dynamic content based on table type
3. **Last Column**: Actions (fixed 100px width) - automatically added when actions are provided

## Fixed Column Specifications

### Image Column (ALWAYS FIRST)
```typescript
{
  key: 'image',
  label: '',
  priority: 'high',
  sortable: false,
  resizable: false,
  width: 80,
  minWidth: 80,
  maxWidth: 80,
  render: (_value, item) => (
    <div className="flex items-center justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <IconComponent className="h-6 w-6 text-white/70" />
        )}
      </div>
    </div>
  ),
}
```

### Actions Column (ALWAYS LAST - Added Automatically)
- Width: `100px` (fixed)
- Alignment: `text-center`
- Rendered automatically by EnhancedTripsTable when actions array is provided

## Icon & Button Specifications

### Icon Sizes
- **Table Header Icon**: `h-6 w-6`
- **Image Placeholder Icon**: `h-6 w-6 text-white/70`
- **Action Button Icons**: `h-4 w-4`
- **Add Button Icon**: `h-5 w-5 text-blue-400/80`

### Button Classes
- **Standard Action Button**:
  ```
  h-4 w-4 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10
  ```
- **Destructive Button (Delete)**:
  ```
  h-4 w-4 rounded-xl border border-[#fb7185]/30 bg-[#fb7185]/10 text-[#fb7185] hover:bg-[#fb7185]/20
  ```
- **Add Button**:
  ```
  h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15
  ```
- **Action Container**:
  ```
  flex items-center justify-center gap-1.5
  ```

## Table Layout Specifications

### Table Header
```tsx
<header className="flex flex-col gap-2 border-b border-white/10 pl-6 pr-3 py-3 md:flex-row md:items-center md:justify-between">
  <div>
    <h2 className="text-lg font-semibold text-white">All [Items]</h2>
  </div>
  {/* Add button positioned close to edge */}
  <Button className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15">
    <PlusSquare className="h-5 w-5 text-blue-400/80" />
  </Button>
</header>
```

### Table Footer
```tsx
{data.length > 0 && (
  <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
    <div className="text-xs text-white/50">
      Showing {showing} of {total} {itemName}
    </div>
    {/* Pagination controls if needed */}
  </footer>
)}
```

### Table Wrapper
```
rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur
```

## Name Column Rules
- **Display**: Only show primary name, NO slugs or secondary information
- **Class**: `font-bold text-xs text-white`
- **Example**:
  ```tsx
  render: (_value, item) => (
    <p className="font-bold text-xs text-white">{item.name}</p>
  )
  ```

## Using the Configuration System

### Import the Standards
```typescript
import {
  FIXED_COLUMN_SPECS,
  ICON_SPECS,
  BUTTON_SPECS,
  IMAGE_SPECS,
  TABLE_LAYOUT_SPECS,
  createImageColumn,
  createNameColumn,
  formatTableFooter
} from '@/config/admin-table-config';
```

### Example Implementation (Ships Table)
```typescript
const columns = [
  // First: Image column (MUST be exactly this)
  {
    key: 'image',
    label: '',
    priority: 'high',
    sortable: false,
    resizable: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    render: (_value, ship) => (
      <div className="flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
          {ship.imageUrl ? (
            <img src={ship.imageUrl} alt={ship.name} className="h-full w-full rounded-xl object-cover" />
          ) : (
            <Ship className="h-6 w-6 text-white/70" />
          )}
        </div>
      </div>
    ),
  },
  // Middle: Dynamic columns specific to ships
  {
    key: 'name',
    label: 'Ship Name',
    priority: 'high',
    sortable: true,
    minWidth: 200,
    render: (value) => <p className="font-bold text-xs text-white">{value}</p>,
  },
  {
    key: 'cruiseLine',
    label: 'Cruise Line',
    // ... custom configuration
  },
  // ... more ship-specific columns
];

// Actions array (will create the fixed Actions column automatically)
const actions = [
  {
    label: 'Edit Ship',
    icon: <Edit2 className="h-4 w-4" />,
    onClick: handleEdit,
  },
  {
    label: 'Delete Ship',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: handleDelete,
    variant: 'destructive',
  },
];
```

## Key Rules to Remember

1. **NEVER** change the image column width (always 80px)
2. **NEVER** change the actions column width (always 100px)
3. **ALWAYS** use `h-6 w-6` for placeholder icons in the image column
4. **ALWAYS** use `h-4 w-4` for action button icons
5. **ALWAYS** use `h-5 w-5` for the add button icon (PlusSquare)
6. **ALWAYS** use `gap-1.5` between action buttons
7. **NEVER** show slugs or secondary text in name columns
8. **ALWAYS** use the exact gradient background for image containers
9. **ALWAYS** conditionally render the footer (only when data exists)
10. **NEVER** show count in the table title (just "All [Items]")

## Consistency Checklist

Before implementing any admin table, verify:
- [ ] Image column is first with 80px fixed width
- [ ] Image placeholder icon is h-6 w-6
- [ ] Name column shows only primary name (no slug)
- [ ] Action buttons are h-4 w-4 with proper spacing
- [ ] Add button uses PlusSquare icon at h-5 w-5
- [ ] Footer shows "Showing X of Y [items]" format
- [ ] Table header says "All [Items]" without count
- [ ] Actions column width is fixed at 100px (if actions exist)