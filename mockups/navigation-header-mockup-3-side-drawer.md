# Navigation Header Mockup 3: Side Drawer (Full Screen on Mobile)

## Overview

A full-height side drawer that slides in from the right, featuring a spacious layout with radio buttons for time format. Provides an app-like navigation experience.

## Visual Design

### Header Bar (Always Visible)

```
┌─────────────────────────────────────────────────────────┐
│ 🌴 KGAY TRAVEL GUIDES                           ☰       │
└─────────────────────────────────────────────────────────┘
```

### Menu - Not Logged In (Desktop View)

```
┌──────────────────────────┐ ┌─────────────────────────────┐
│ 🌴 KGAY TRAVEL GUIDES    │ │  (Main Content Dimmed)      │
│                          │ │                             │
│ ┌──────────────────────┐ │ │                             │
│ │  Login               │ │ │                             │
│ └──────────────────────┘ │ │                             │
│                          │ │                             │
│ ─────────────────────    │ │                             │
│                          │ │                             │
│ ⏰ Time Format           │ │                             │
│    ○ 24 Hour             │ │                             │
│    ● AM/PM               │ │                             │
│                          │ │                             │
│ ─────────────────────    │ │                             │
│                          │ │                             │
│ 📱 Add to Home Screen    │ │                             │
│                          │ │                             │
│ ℹ️ About KGAY Travel     │ │                             │
│                          │ │                             │
│                          │ │                             │
│                          │ │                             │
└──────────────────────────┘ └─────────────────────────────┘
```

### Menu - Logged In (Desktop View)

```
┌──────────────────────────┐ ┌─────────────────────────────┐
│ ┌──────────────────────┐ │ │  (Main Content Dimmed)      │
│ │  👤 Bryan Smith      │ │ │                             │
│ │     Super Admin     │ │ │                             │
│ └──────────────────────┘ │ │                             │
│                          │ │                             │
│ ─────────────────────    │ │                             │
│                          │ │                             │
│ 👤 Profile               │ │                             │
│                          │ │                             │
│ 🛡️ Admin Panel           │ │                             │
│                          │ │                             │
│ ✏️ Edit Trip             │ │                             │
│                          │ │                             │
│ ─────────────────────    │ │                             │
│                          │ │                             │
│ ⏰ Time Format           │ │                             │
│    ○ 24 Hour             │ │                             │
│    ● AM/PM               │ │                             │
│                          │ │                             │
│ ─────────────────────    │ │                             │
│                          │ │                             │
│ 📱 Add to Home Screen    │ │                             │
│                          │ │                             │
│ ℹ️ About KGAY Travel     │ │                             │
│                          │ │                             │
│ ─────────────────────    │ │                             │
│                          │ │                             │
│ 🚪 Sign Out              │ │                             │
│                          │ │                             │
└──────────────────────────┘ └─────────────────────────────┘
```

### Mobile View (Full Width)

```
┌─────────────────────────┐
│ 🌴 KGAY TRAVEL GUIDES   │
│                         │
│ ┌─────────────────────┐ │
│ │  👤 Bryan Smith     │ │
│ │     Super Admin    │ │
│ └─────────────────────┘ │
│                         │
│ ──────────────────────  │
│                         │
│ 👤 Profile              │
│                         │
│ 🛡️ Admin Panel          │
│                         │
│ ✏️ Edit Trip            │
│                         │
│ ──────────────────────  │
│                         │
│ ⏰ Time Format          │
│    ○ 24 Hour            │
│    ● AM/PM              │
│                         │
│ ──────────────────────  │
│                         │
│ 📱 Add to Home Screen   │
│                         │
│ ℹ️ About KGAY Travel    │
│                         │
│ ──────────────────────  │
│                         │
│ 🚪 Sign Out             │
│                         │
└─────────────────────────┘
```

## Features

### Key Characteristics

- **Menu Icon**: Hamburger (☰) - Classic style
- **Menu Type**: Side drawer (Sheet component)
- **Animation**: Slides in from right
- **Layout**: Full height, spacious vertical list
- **Time Toggle**: Radio buttons (clearest selection state)
- **Background**: Main content dims when drawer is open

### Menu Items (Not Logged In)

1. **Branding**
   - Logo and "KGAY TRAVEL GUIDES" text at top

2. **Login Button**
   - Prominent, full-width button

3. **Time Format Section**
   - Label: "⏰ Time Format"
   - Radio buttons:
     - ○ 24 Hour
     - ● AM/PM

4. **Quick Access**
   - Add to Home Screen (conditionally shown)
   - About KGAY Travel

### Menu Items (Logged In)

1. **User Profile Card**
   - Name and role badge
   - Prominent at top

2. **Navigation Links**
   - Profile (navigates to /admin/profile)
   - Admin Panel (if admin/super_admin)
   - Edit Trip (if on trip page and has permission)

3. **Time Format Section**
   - Radio button selection

4. **Quick Access**
   - Add to Home Screen
   - About KGAY Travel

5. **Sign Out**
   - Red-styled logout button at bottom

## Technical Details

### Components

- Sheet component from shadcn/ui
- Radio Group for time format
- Custom drawer layout
- Backdrop overlay with blur

### Dimensions

- **Mobile**: Full width (100vw)
- **Tablet**: 320px width
- **Desktop**: 360px width

### Animation

- Slide transition from right: 200ms ease-out
- Backdrop fade: 150ms
- Content fade-in: 100ms delay

### Styling

- Deep ocean background with frosted glass
- Full-height drawer (100vh)
- Larger touch targets (56px minimum)
- More whitespace between items
- Prominent separators

### Behavior

- Click hamburger to open
- Click backdrop to close
- Swipe right to close (touch devices)
- Escape key to close
- Auto-closes on navigation

### Responsive Design

- **Mobile**: Full-width drawer, edge-to-edge
- **Tablet**: 320px drawer from right
- **Desktop**: 360px drawer from right

## Advantages

1. ✅ Touch-friendly - Large hit targets, spacious layout
2. ✅ Modern UX - Feels like native mobile app
3. ✅ Clear selection - Radio buttons show explicit state
4. ✅ Immersive - Dims background, focuses attention
5. ✅ Scalable - Easy to add more items without crowding
6. ✅ Mobile-first - Optimized for touch interactions
7. ✅ Branding - Can repeat logo for consistent identity

## Disadvantages

1. ❌ Covers content - Requires close action to see content
2. ❌ More complex - Sheet component with animations
3. ❌ Larger footprint - Takes more screen space

## Implementation Complexity

**Medium-High** - Requires Sheet component, radio groups, and custom animations

## Recommended For

- Mobile-first applications
- Touch-heavy interfaces
- Apps wanting native app feel
- Users who want clear, spacious menus
- Applications with room to grow navigation items

## Comparison with Other Mockups

| Aspect         | Mockup 1 | Mockup 2 | Mockup 3   |
| -------------- | -------- | -------- | ---------- |
| Space          | Compact  | Medium   | Spacious   |
| Touch Targets  | Small    | Medium   | Large      |
| Mobile Feel    | Web app  | Hybrid   | Native app |
| Implementation | Easy     | Medium   | Complex    |
| Scalability    | Limited  | Good     | Excellent  |
