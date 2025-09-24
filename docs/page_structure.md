# Page Structure and Layout System

## Overview

The UI redesign implements a standardized component system for consistent layout, spacing, and styling across all pages. This document provides technical specifications for the standardized components and their usage.

---

## Core Layout Components

### 1. UniversalHero Component

**File:** `/client/src/components/UniversalHero.tsx`

**Purpose:** Standardized hero section with consistent dimensions and positioning across all pages.

#### Technical Specifications:
- **Height:** `300px` (h-[300px])
- **Position:** `fixed` with `top-0 left-0 right-0`
- **Z-index:** `40`
- **Bottom padding:** `24px` (pb-6) for tab positioning
- **Variants:** `landing` | `trip`

#### Structure:
```tsx
<header className="relative overflow-hidden text-white fixed top-0 left-0 right-0 z-40 h-[300px]">
  {/* Background Layer */}
  <div className="absolute inset-0 z-0">
    {/* Background varies by variant */}
  </div>

  {/* Content Layer */}
  <div className="relative z-20 h-full flex flex-col">
    {/* Flexible spacer */}
    <div className="flex-1"></div>

    {/* Title Section - Centered */}
    <div className="flex-shrink-0 text-center">
      <div className="inline-block bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 border border-white/20 shadow-lg">
        {/* Title and subtitle content */}
      </div>
    </div>

    {/* Flexible spacer */}
    <div className="flex-1"></div>

    {/* Tab Section - 24px from bottom */}
    <div className="flex-shrink-0 px-4 pb-6">
      {tabSection}
    </div>
  </div>
</header>
```

#### Background Variants:
- **Landing:** Wave pattern gradient (`cruise-gradient wave-pattern bg-ocean-600`)
- **Trip:** Hero image with overlay (`bg-gradient-to-r from-black/60 to-black/20`)

#### Props Interface:
```tsx
interface UniversalHeroProps {
  variant: 'landing' | 'trip';
  tripImageUrl?: string;
  title: string;
  subtitle: string;
  additionalInfo?: string;
  tabSection: React.ReactNode;
}
```

---

### 2. StandardizedTabContainer Component

**File:** `/client/src/components/StandardizedTabContainer.tsx`

**Purpose:** Consistent tab bar styling matching main branch design.

#### Technical Specifications:
- **Background:** `bg-white/90 backdrop-blur-sm`
- **Border radius:** `rounded-lg`
- **Padding:** `p-1` (4px)
- **Position:** Positioned by parent (UniversalHero)

#### Structure:
```tsx
<div className="bg-white/90 backdrop-blur-sm rounded-lg p-1">
  {children}
</div>
```

#### Usage:
```tsx
<StandardizedTabContainer>
  <Tabs>
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="all">All</TabsTrigger>
      {/* Additional tabs */}
    </TabsList>
  </Tabs>
</StandardizedTabContainer>
```

---

### 3. StandardizedContentLayout Component

**File:** `/client/src/components/StandardizedContentLayout.tsx`

**Purpose:** Standardized content wrapper with proper spacing below hero section.

#### Technical Specifications:
- **Background:** Ocean gradient (`bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400`)
- **Min height:** `min-h-screen`
- **Container:** `max-w-7xl mx-auto`
- **Horizontal padding:** `px-4` (16px left/right)
- **Top padding:** `pt-[40px]` (40px from hero bottom)
- **Bottom padding:** `pb-8` (32px)

#### Critical Spacing Calculation:
```
App.tsx padding:      40px  (pt-10 - navigation banner offset)
Hero height:        + 300px  (UniversalHero h-[300px])
Hero bottom tabs:   + 24px   (pb-6 in UniversalHero)
Content top padding: + 40px   (pt-[40px] in StandardizedContentLayout)
───────────────────────────
Total from page top:  404px
Effective gap:        40px   (between hero bottom and content)
```

#### Structure:
```tsx
<div className="bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400 min-h-screen">
  <div className="max-w-7xl mx-auto px-4 pt-[40px] pb-8">
    {children}
  </div>
</div>
```

---

## Page Implementation

### Landing Page (`/client/src/pages/landing.tsx`)

#### Layout Structure:
```tsx
<div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400">
  <UniversalHero
    variant="landing"
    title="Atlantis Events Guides"
    subtitle="Your complete guide to unforgettable trip experiences"
    tabSection={
      <StandardizedTabContainer>
        {/* Tab content */}
      </StandardizedTabContainer>
    }
  />

  <StandardizedContentLayout>
    {/* Content sections */}
  </StandardizedContentLayout>
</div>
```

#### Tab Configuration:
- **All:** Grid3X3 icon, shows all trips in sections
- **Current:** Clock icon with emerald styling and animation
- **Upcoming:** Calendar icon
- **Past:** History icon

---

### Trip Guide Page (`/client/src/components/trip-guide.tsx`)

#### Layout Structure:
```tsx
<div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400">
  <UniversalHero
    variant="trip"
    tripImageUrl={trip.heroImageUrl}
    title={trip.name}
    subtitle={trip.shipName}
    additionalInfo={`${format(startDate, "MMMM d")} - ${format(endDate, "d, yyyy")}`}
    tabSection={
      <StandardizedTabContainer>
        {/* Tab content */}
      </StandardizedTabContainer>
    }
  />

  <StandardizedContentLayout>
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {/* Tab content sections */}
    </Tabs>
  </StandardizedContentLayout>
</div>
```

#### Tab Configuration:
- **Itinerary:** Map icon
- **Schedule:** CalendarDays icon
- **Parties:** PartyPopper icon
- **Talent:** Star icon
- **Info:** Info icon

---

## Responsive Design

### Breakpoints:
- **Mobile:** Default styles
- **Small:** `sm:` (640px+) - Show tab text
- **Medium:** `md:` (768px+) - 2-column card grid
- **Large:** `lg:` (1024px+) - 3-column card grid

### Mobile Optimizations:
- Tab text hidden on mobile (`hidden sm:inline`)
- Responsive padding adjustments
- Touch-friendly interactive elements

---

## Key Design Principles

### 1. Consistency
- All pages use identical hero height (300px)
- Standardized 40px content spacing
- Unified tab styling across pages

### 2. Visual Hierarchy
- Fixed hero positioning for immediate visual impact
- Centered frosted glass title treatment
- Bottom-aligned tab navigation

### 3. Accessibility
- Proper color contrast ratios
- Touch-friendly tap targets (48px minimum)
- Semantic HTML structure
- Screen reader friendly content

### 4. Performance
- Fixed positioning prevents layout shifts
- Optimized background images
- Efficient CSS class composition

---

## Usage Guidelines

### When to Use Each Component:

#### UniversalHero:
- **Required** for all main pages
- Use `variant="landing"` for overview pages
- Use `variant="trip"` for detail pages with hero images

#### StandardizedTabContainer:
- **Required** wrapper for all tab navigation in hero sections
- Provides consistent white background styling

#### StandardizedContentLayout:
- **Required** wrapper for all main content below hero
- Ensures proper spacing and responsive behavior

### Implementation Example:
```tsx
// New page implementation
function NewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400">
      <UniversalHero
        variant="landing"
        title="Page Title"
        subtitle="Page Subtitle"
        tabSection={
          <StandardizedTabContainer>
            {/* Your tab content */}
          </StandardizedTabContainer>
        }
      />

      <StandardizedContentLayout>
        {/* Your main content */}
      </StandardizedContentLayout>
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues:

#### 1. Spacing Gaps
- **Problem:** Content appears too far from hero
- **Solution:** Verify `pt-[40px]` in StandardizedContentLayout
- **Calculation:** Must account for app-level `pt-10` offset

#### 2. Tab Styling Inconsistencies
- **Problem:** Tabs don't match main branch styling
- **Solution:** Ensure StandardizedTabContainer is wrapping TabsList
- **Verification:** Should have `bg-white/90` background

#### 3. Hero Height Variations
- **Problem:** Different hero heights between pages
- **Solution:** All pages must use UniversalHero with `h-[300px]`

### Debug Checklist:
- [ ] UniversalHero height is exactly 300px
- [ ] StandardizedContentLayout has `pt-[40px]`
- [ ] App.tsx has `pt-10` for navigation
- [ ] TabsList wrapped in StandardizedTabContainer
- [ ] Content uses max-width container (`max-w-7xl mx-auto`)

---

## Future Enhancements

### Potential Improvements:
1. **Dynamic hero heights** based on content needs
2. **Additional variants** for specialized page types
3. **Animation system** for smooth transitions
4. **Theme customization** for different event types
5. **Advanced responsive breakpoints** for larger displays

---

*Last Updated: December 2024*
*UI Redesign Branch Implementation*