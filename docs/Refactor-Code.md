# Code Refactoring Plan

**Based on:** Code Review (Nov 12, 2025) + CLAUDE.md Development Principles
**Created:** November 26, 2025
**Goal:** Align codebase with established development standards

---

## Executive Summary

The November code review identified significant issues that violate our CLAUDE.md development principles. This plan prioritizes fixes based on impact and alignment with our standards.

| Principle Violated                 | Issue Count         | Priority |
| ---------------------------------- | ------------------- | -------- |
| No `any` types                     | 447 instances       | HIGH     |
| Use `logger` not `console.log`     | 176 in production   | HIGH     |
| Single Responsibility (>200 lines) | 4+ large components | MEDIUM   |
| Reusable Components                | Duplicate patterns  | MEDIUM   |
| DRY (Don't Repeat)                 | 310+ useEffects     | MEDIUM   |
| Export types from `/types/`        | Types scattered     | LOW      |

---

## Phase 1: TypeScript Type Safety (HIGH PRIORITY)

### 1.1 Fix TypeScript Compilation Errors

**CLAUDE.md Rule:** "No `any` types without justification"

**Current State:** 127 compilation errors, 447 `any` usages

**Action Items:**

#### A. Create Missing Type Definitions

```bash
# Files needing types
client/src/types/trip.ts        # Create - referenced but missing
client/src/types/wizard.ts      # Create - TripWizard types
client/src/types/admin.ts       # Create - Admin table types
```

**Types to create:**

```typescript
// client/src/types/wizard.ts
export interface BasicInfoData {
  name: string;
  startDate: string;
  endDate: string;
  tripTypeId?: number;
  status?: string;
  bookingUrl?: string;
}

export interface ShipData {
  shipId: number | null;
  cabinTypes?: string[];
}

export interface ResortData {
  resortId: number | null;
  roomTypes?: string[];
}

// client/src/types/admin.ts
export interface TableColumn<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface TableAction<T> {
  label: string;
  onClick: (row: T) => void;
  icon?: React.ComponentType;
}
```

#### B. Fix High-Impact `any` Usages

| File                       | Line    | Current                        | Fix                            |
| -------------------------- | ------- | ------------------------------ | ------------------------------ |
| `TripWizardContext.tsx`    | 135-139 | `updateBasicInfo: (data: any)` | Use `BasicInfoData`            |
| `ResponsiveAdminTable.tsx` | 143     | `data: any[]`                  | Use generic `T[]`              |
| `api.ts`                   | 89, 117 | `socialLinks: any`             | Create `SocialLinks` interface |

#### C. Replace `any` with `unknown` in Catch Blocks

```typescript
// Find all: catch (error: any)
// Replace with:
catch (error: unknown) {
  if (error instanceof Error) {
    logger.error('Operation failed', { message: error.message });
  }
}
```

**Files to update:**

- All files in `client/src/hooks/`
- All files in `client/src/components/admin/`
- All files in `server/routes/`

---

## Phase 2: Console.log Cleanup (HIGH PRIORITY)

### 2.1 Replace console.log with Logger

**CLAUDE.md Rule:** "Use `logger` service, not `console.log`"

**Current State:** 176 console statements in production code

**Action Items:**

#### A. Client-Side Logger Setup

The logger exists at `@/lib/logger`. Update all client files:

```typescript
// BEFORE
console.log('Sharing:', { title, text, url });
console.error('Failed to fetch updates:', error);

// AFTER
import { logger } from '@/lib/logger';
logger.debug('Sharing content', { title, text, url });
logger.error('Failed to fetch updates', error);
```

#### B. Files to Update (Client)

| File                  | console.log count | Action                     |
| --------------------- | ----------------- | -------------------------- |
| `trip-guide.tsx`      | 5                 | Replace with logger        |
| `PillDropdown.tsx`    | 3                 | Remove debug logs          |
| `BackToTopButton.tsx` | 1                 | Remove or use logger.debug |
| `EditTripModal.tsx`   | 2                 | Remove debug logs          |
| `BasicInfoPage.tsx`   | 1                 | Remove debug log           |
| `ShareMenu.tsx`       | 2                 | Use logger.debug           |

#### C. Server-Side (Keep console for startup only)

```typescript
// ALLOWED - startup errors before logger initializes
if (missing.length > 0) {
  console.error('FATAL: Missing environment variables:', missing);
  process.exit(1);
}

// NOT ALLOWED - runtime logging
console.log('Processing request...'); // Use logger.info()
```

---

## Phase 3: Component Refactoring (MEDIUM PRIORITY)

### 3.1 Split Large Components

**CLAUDE.md Rule:** "Split large components (>200 lines) into smaller pieces"

**Current State:** 4+ components exceed 800 lines

#### A. Components to Split

| Component                  | Lines | Split Into                                                                |
| -------------------------- | ----- | ------------------------------------------------------------------------- |
| `trip-guide.tsx`           | 811   | `TripGuideLayout`, `TripGuideHeader`, `TripGuideTabs`, `TripGuideContent` |
| `FeaturedTripCarousel.tsx` | 558   | `CarouselCard`, `CarouselControls`, `CarouselIndicators`                  |
| `invitation-routes.ts`     | 965   | `invitation-create.ts`, `invitation-accept.ts`, `invitation-manage.ts`    |
| `media.ts`                 | 813   | `media-upload.ts`, `media-process.ts`, `media-delete.ts`                  |

#### B. Example Split: TripGuide

```typescript
// client/src/components/trip-guide/TripGuideLayout.tsx
export function TripGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#002147]">
      {children}
    </div>
  );
}

// client/src/components/trip-guide/TripGuideHeader.tsx
export function TripGuideHeader({ trip }: { trip: Trip }) {
  // ~50 lines - hero image, title, dates
}

// client/src/components/trip-guide/TripGuideTabs.tsx
export function TripGuideTabs({ activeTab, onTabChange }: TabsProps) {
  // ~100 lines - tab navigation
}

// client/src/components/trip-guide.tsx (main file)
export default function TripGuide({ slug }: Props) {
  return (
    <TripGuideLayout>
      <TripGuideHeader trip={trip} />
      <TripGuideTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <TripGuideContent trip={trip} activeTab={activeTab} />
    </TripGuideLayout>
  );
}
```

### 3.2 Add React.memo to Large Components

**CLAUDE.md Rule:** "Memoize expensive computations"

**Components to memoize:**

```typescript
// client/src/components/trip-guide/shared/EventCard.tsx
export const EventCard = React.memo(function EventCard({
  event,
  venue,
  talent,
  partyTheme,
}: EventCardProps) {
  // Component implementation
});

// client/src/components/admin/ResponsiveAdminTable.tsx
export const ResponsiveAdminTable = React.memo(function ResponsiveAdminTable<T>({
  data,
  columns,
  actions,
}: ResponsiveAdminTableProps<T>) {
  // Component implementation
});
```

---

## Phase 4: DRY - Extract Reusable Patterns (MEDIUM PRIORITY)

### 4.1 Extract Custom Hooks

**CLAUDE.md Rule:** "Extract shared logic to custom hooks"

#### A. Create Data Fetching Hooks

Many components have duplicate useEffect patterns for fetching. Convert to React Query:

```typescript
// client/src/hooks/useTripUpdates.ts
export function useTripUpdates(tripId: number | undefined) {
  return useQuery({
    queryKey: ['trip-updates', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const response = await api.get(`/api/trips/${tripId}/updates`);
      if (!response.ok) throw new Error('Failed to fetch updates');
      return response.json();
    },
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000, // 5 minutes per CLAUDE.md
  });
}
```

#### B. Hooks to Create

| Hook                | Purpose              | Replaces                    |
| ------------------- | -------------------- | --------------------------- |
| `useTripUpdates`    | Fetch trip updates   | useEffect in trip-guide.tsx |
| `useResizeObserver` | Debounced resize     | Multiple resize listeners   |
| `useFormValidation` | Zod form validation  | Duplicate validation logic  |
| `useAdminTableData` | Admin table fetching | Duplicate admin fetching    |

### 4.2 Extract Utility Functions

```typescript
// client/src/lib/dateUtils.ts
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// client/src/lib/imageTypeMap.ts
export const IMAGE_TYPE_FOLDERS: Record<string, string> = {
  trips: 'trips',
  talent: 'talent',
  locations: 'locations',
  parties: 'parties',
  ships: 'ships',
  charters: 'charters',
  general: 'general',
  maps: 'maps',
};

export function getFolderPath(imageType: string): string {
  return IMAGE_TYPE_FOLDERS[imageType] || 'general';
}
```

---

## Phase 5: Performance Optimizations (MEDIUM PRIORITY)

### 5.1 Fix Resize Listeners

**Add debouncing to all resize handlers:**

```typescript
// client/src/hooks/useWindowSize.ts
import { useState, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';

export function useWindowSize(debounceMs = 150) {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = debounce(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, debounceMs);

    window.addEventListener('resize', handleResize);
    return () => {
      handleResize.cancel();
      window.removeEventListener('resize', handleResize);
    };
  }, [debounceMs]);

  return size;
}
```

### 5.2 Fix Excessive useMemo Dependencies

```typescript
// BEFORE - 15 dependencies defeats memoization
const memoizedResort = useMemo(() => {
  return { id: selectedResortId, ...resortData };
}, [
  selectedResortId,
  resortData.name,
  resortData.location,
  // ... 13 more dependencies
]);

// AFTER - track parent object
const memoizedResort = useMemo(() => {
  if (!selectedResortId) return null;
  return { id: selectedResortId, ...resortData };
}, [selectedResortId, resortData]);
```

---

## Phase 6: Dead Code Removal (LOW PRIORITY)

### 6.1 Files to Delete

**CLAUDE.md Rule:** "Delete dead/commented code - git has history"

| File                                                      | Reason                       |
| --------------------------------------------------------- | ---------------------------- |
| `client/src/components/trip-guide/tabs/TalentTab.tsx`     | Replaced by TalentTabNew.tsx |
| `client/src/components/trip-guide/tabs/OverviewTab_*.tsx` | Unused experiments           |
| `client/src/data/trip-data.ts` (mock data portion)        | Data lives in database       |

### 6.2 Remove Unused Imports

Run ESLint auto-fix:

```bash
npm run lint -- --fix
```

---

## Phase 7: Type Consolidation (LOW PRIORITY)

### 7.1 Move Types to `/types/`

**CLAUDE.md Rule:** "Export types from `/client/src/types/`"

**Current scattered types to consolidate:**

```
client/src/data/trip-data.ts → client/src/types/trip-data.ts (types only)
Inline interfaces → client/src/types/admin.ts
Inline interfaces → client/src/types/wizard.ts
```

---

## Implementation Checklist

### Week 1: TypeScript & Console.log

- [x] Create `client/src/types/wizard.ts` ✅ (Nov 26, 2025)
- [x] Create `client/src/types/admin.ts` ✅ (Nov 26, 2025)
- [x] Fix TripWizardContext.tsx `any` types ✅ (Nov 26, 2025)
- [x] Fix ResponsiveAdminTable.tsx `any` types ✅ (Nov 26, 2025)
- [x] Create `client/src/lib/logger.ts` for client-side logging ✅ (Nov 26, 2025)
- [x] Replace `catch (error: any)` with `catch (error: unknown)` in client files ✅ (Nov 26, 2025)
- [x] Remove console.log from trip-guide.tsx ✅ (Nov 26, 2025)
- [x] Remove console.log from PillDropdown.tsx, BackToTopButton.tsx, ShareMenu.tsx ✅ (Nov 26, 2025)
- [x] Remove console.log from admin components ✅ (Nov 26, 2025)
- [x] Fix TripWizard modal TypeScript errors (spread operators, callback types) ✅ (Nov 26, 2025)
- [x] Fix BasicInfoPage/EditBasicInfoModal tripTypeId callback ✅ (Nov 26, 2025)
- [x] Fix ResortSchedulePage undefined date parsing ✅ (Nov 26, 2025)
- [x] Fix LocationSelector to pass locationName in callback ✅ (Nov 26, 2025)
- [x] Fix EventCard.tsx `.cat` → `.category` property access ✅ (Nov 26, 2025)
- [x] Fix BottomNavigation.tsx touch event undefined handling ✅ (Nov 26, 2025)
- [x] Fix FlyUpSheet.tsx touch event undefined handling ✅ (Nov 26, 2025)
- [x] Fix ShareMenu.tsx useEffect return paths and toast calls ✅ (Nov 26, 2025)
- [x] Fix PartyCard.tsx useEffect return path and property names ✅ (Nov 26, 2025)
- [x] Add bookingUrl to FeaturedTripCarousel Trip interface ✅ (Nov 26, 2025)
- [x] Update useLocalStorage hook to support functional updates ✅ (Nov 26, 2025)
- [x] Fix remaining TypeScript errors (102 → 0) ✅ (Nov 26, 2025)
- [x] Run `npm run check` - 0 errors ✅ (Nov 26, 2025)
- [x] Replace console.log with logger in production components ✅ (Nov 26, 2025)
- [x] Update Trip interface in shared/api-types.ts with all fields ✅ (Nov 26, 2025)
- [x] Fix navigation-menu.tsx missing @radix-ui/react-icons ✅ (Nov 26, 2025)

### Week 2: Component Refactoring

- [ ] Split trip-guide.tsx into sub-components
- [ ] Add React.memo to EventCard
- [ ] Add React.memo to ResponsiveAdminTable
- [ ] Create useWindowSize hook with debounce
- [ ] Create useTripUpdates hook

### Week 3: DRY & Performance

- [ ] Create dateUtils.ts with timezone-safe functions
- [ ] Create imageTypeMap.ts utility
- [ ] Fix useMemo excessive dependencies
- [ ] Convert 5 useEffect data fetches to React Query

### Week 4: Cleanup

- [ ] Delete deprecated TalentTab.tsx
- [ ] Delete OverviewTab\_\*.tsx experiments
- [ ] Move trip-data.ts types to /types/
- [ ] Run full ESLint fix
- [ ] Final `npm run check` verification

---

## Success Metrics

| Metric                    | Start | Current   | Target |
| ------------------------- | ----- | --------- | ------ |
| TypeScript errors         | 188   | **0** ✅  | 0      |
| `any` type usage          | 447   | ~200      | <50    |
| console.log in production | 176   | **17** ✅ | 0      |
| Components >200 lines     | 4+    | 4+        | 0      |
| Type coverage             | ~65%  | ~80%      | 85%+   |

_Last updated: November 26, 2025_

**Note:** Remaining 17 console statements are in low-level system code (Service Worker, Capacitor, PWA) where logging is acceptable for debugging native features.

---

## Notes

- **Do not refactor everything at once** - follow the weekly phases
- **Test after each change** - run `npm run check` and `npm test`
- **Commit frequently** - small, focused commits
- **Follow CLAUDE.md** - reference the rules during implementation

---

_This plan should be executed incrementally. Each phase builds on the previous one._
