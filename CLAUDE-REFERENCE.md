# KGay Travel Guides - Extended Reference

**Load this file with `/context add CLAUDE-REFERENCE.md` when needed.**

---

## Tech Stack

**Frontend:**

- React 18 + TypeScript 5.6
- Vite 5 (build tool)
- Tailwind CSS + shadcn/ui
- React Query (TanStack Query)
- Wouter (routing)
- React Hook Form + Zod
- Framer Motion

**Backend:**

- Express 4
- PostgreSQL (Supabase)
- Supabase Auth + Storage
- Winston (logging)
- OpenAPI/Swagger docs

**Mobile:**

- Capacitor 7 (iOS/Android)
- PWA support

**Testing:**

- Vitest (unit)
- Playwright (E2E)

---

## Full Project Structure

```
├── client/src/
│   ├── components/
│   │   ├── trip-guide/
│   │   │   ├── tabs/           # OverviewTab, ItineraryTab, ScheduleTab, TalentTabNew, PartiesTab, InfoTab, FAQTab
│   │   │   ├── modals/         # Modal components
│   │   │   ├── shared/         # EventCard, TalentCard
│   │   │   ├── info-sections/  # Info tab sections
│   │   │   └── hooks/          # Custom hooks
│   │   ├── admin/              # Admin page components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── smoothui/           # SmoothUI library
│   ├── pages/
│   │   ├── landing.tsx         # Trip list
│   │   ├── trip.tsx            # Trip guide
│   │   ├── admin/              # Admin pages
│   │   └── auth/               # Auth pages
│   ├── lib/                    # api-client, supabase, queryClient
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom hooks (useWindowSize, useTripUpdates, useImageUpload, etc.)
│   └── types/                  # TypeScript types (api.ts, admin.ts, wizard.ts, trip-data.ts, trip-info.ts)
├── server/
│   ├── routes/                 # API endpoints
│   ├── storage/                # Supabase queries
│   ├── middleware/             # Auth, CSRF, logging
│   ├── schemas/                # Zod validation
│   └── logging/                # Winston logger
├── public/                     # PWA manifest, icons
├── ios/                        # Capacitor iOS
├── android/                    # Capacitor Android
└── docs/                       # Documentation
```

---

## Admin Pages

All in `/client/src/pages/admin/`:

| Page                     | Purpose            |
| ------------------------ | ------------------ |
| `trips-management.tsx`   | Main trips list    |
| `trip-wizard.tsx`        | Create new trip    |
| `trip-detail.tsx`        | Edit trip details  |
| `locations.tsx`          | Ports/destinations |
| `ships.tsx`              | Cruise ships       |
| `resorts.tsx`            | Resorts            |
| `artists.tsx`            | Talent/performers  |
| `themes.tsx`             | Party themes       |
| `faqs.tsx`               | FAQ entries        |
| `trip-info-sections.tsx` | Info sections      |
| `lookup-tables.tsx`      | Reference data     |
| `users.tsx`              | User management    |
| `invitations.tsx`        | Invitations        |
| `profile.tsx`            | User profile       |

---

## All NPM Commands

```bash
# Development
npm run dev                    # Dev server (port 3001)
npm run build                  # Production build
npm run check                  # TypeScript check
npm run clean:cache            # Clear Vite cache

# Testing
npm test                       # Vitest unit tests
npm run test:e2e              # Playwright E2E
npm run test:e2e:ui           # Playwright with UI
npm run test:coverage         # Coverage report

# Database
npm run db:seed                # Seed dev database
npm run production:seed        # Seed production

# Code Quality
npm run lint                   # ESLint
npm run format                 # Prettier
npm run security:check         # Security scan

# Mobile
npm run cap:sync              # Sync to native
npm run cap:ios               # Open Xcode
npm run cap:android           # Open Android Studio
npm run cap:serve:ios         # iOS live reload
npm run cap:serve:android     # Android live reload
```

---

## Trip Guide Tabs

Active tabs in `/client/src/components/trip-guide/tabs/`:

| Component          | Purpose                    |
| ------------------ | -------------------------- |
| `OverviewTab.tsx`  | Trip overview, ship info   |
| `ItineraryTab.tsx` | Daily itinerary with ports |
| `ScheduleTab.tsx`  | Events schedule            |
| `TalentTabNew.tsx` | Talent roster              |
| `PartiesTab.tsx`   | Party schedule             |
| `InfoTab.tsx`      | Important info             |
| `FAQTab.tsx`       | FAQ                        |

**Deprecated:** `TalentTab.tsx` (use TalentTabNew)

---

## Key Custom Hooks

| Hook              | Location                   | Purpose                                      |
| ----------------- | -------------------------- | -------------------------------------------- |
| `useWindowSize`   | `hooks/useWindowSize.ts`   | Debounced window resize (also `useIsMobile`) |
| `useTripUpdates`  | `hooks/useTripUpdates.ts`  | React Query hook for trip updates            |
| `useTripData`     | `hooks/useTripData.ts`     | Complete trip data fetching                  |
| `useImageUpload`  | `hooks/useImageUpload.ts`  | Supabase Storage image uploads               |
| `useShare`        | `hooks/useShare.ts`        | Native share / clipboard fallback            |
| `useSupabaseAuth` | `hooks/useSupabaseAuth.ts` | Auth state management                        |

---

## Image Optimization

All Supabase Storage images are optimized on-the-fly using URL transformations.

**Key files:**

- `/client/src/lib/image-utils.ts` - Core utility functions
- `/client/src/components/ui/OptimizedImage.tsx` - React component

**Usage:**

```typescript
import { getOptimizedImageUrl, IMAGE_PRESETS } from '@/lib/image-utils';

// Use presets (recommended)
const cardUrl = getOptimizedImageUrl(imageUrl, IMAGE_PRESETS.card);

// Custom dimensions
const customUrl = getOptimizedImageUrl(imageUrl, {
  width: 300,
  height: 200,
  quality: 85,
  resize: 'cover',
});

// Generate srcset for retina
import { getSrcSet } from '@/lib/image-utils';
const srcSet = getSrcSet(imageUrl, IMAGE_PRESETS.card); // "url 1x, url 2x"
```

**Available presets:**

| Preset      | Dimensions | Quality | Use Case                        |
| ----------- | ---------- | ------- | ------------------------------- |
| `thumbnail` | 80x80      | 70      | Admin tables, small icons       |
| `card`      | 400x300    | 80      | Event cards, party cards        |
| `profile`   | 200x200    | 80      | Small talent profile thumbnails |
| `modal`     | 600x600    | 85      | Modal/slide-up sheet images     |
| `hero`      | 1200x800   | 85      | Hero sections                   |
| `full`      | 1920x1280  | 90      | Full-screen galleries           |

**OptimizedImage component:**

```tsx
import { OptimizedImage } from '@/components/ui/OptimizedImage';

// With preset
<OptimizedImage src={imageUrl} preset="card" alt="Event" />

// With fallback
<OptimizedImage
  src={imageUrl}
  preset="thumbnail"
  fallbackSrc="/placeholder.jpg"
  alt="Profile"
/>

// With placeholder while loading
<OptimizedImage
  src={imageUrl}
  preset="hero"
  showPlaceholder
  alt="Hero"
/>
```

**Note:** Only works with Supabase Storage URLs. Non-Supabase URLs pass through unchanged.

---

## Type Files

| File                 | Contents                                                      |
| -------------------- | ------------------------------------------------------------- |
| `types/api.ts`       | API response types, pagination, Location, Talent (DB)         |
| `types/admin.ts`     | TableColumn, TableAction, admin component types               |
| `types/wizard.ts`    | BasicInfoData, ShipData, ResortData for TripWizard            |
| `types/trip-data.ts` | Trip guide types: DailyEvent, PartyTheme, ItineraryStop, etc. |
| `types/trip-info.ts` | TripInfoSection, FAQ, Update types                            |

---

## Date/Time Utilities

**Always use these to avoid timezone bugs:**

```typescript
import { getTodayString, parseLocalDate } from '@/lib/timeFormat';

// Get today's date as YYYY-MM-DD (local timezone)
const today = getTodayString(); // "2025-11-26"

// Parse a date string without timezone conversion
const date = parseLocalDate('2025-11-26'); // Date object at local midnight

// Format helpers also available:
import { formatTime12Hour, formatDateRange, formatEventTime } from '@/lib/timeFormat';
```

**Never use:**

- `new Date('2025-10-12')` - causes UTC conversion
- `date.toISOString().split('T')[0]` - converts to UTC

---

## Logger Usage

**Client-side:**

```typescript
import { logger } from '@/lib/logger';

logger.debug('Debug info', { data });
logger.info('User action', { action: 'click' });
logger.warn('Warning', { issue });
logger.error('Error occurred', error);
```

**Server-side:**

```typescript
import { logger } from './logging/logger';

logger.info('Request processed', { path: req.path });
logger.error('Database error', { error: err.message });
```

**Exception:** `console.log` is acceptable only in:

- Service Worker (`sw.ts`)
- Capacitor native bridge code
- PWA install prompts

---

## UI Patterns

### Card Pattern

```tsx
<div className="bg-white/5 border border-white/20 rounded-xl shadow-lg overflow-hidden">
  <div className="p-4 md:p-6">{/* Content */}</div>
</div>
```

### Expandable Card (Mobile)

```tsx
<div className="lg:hidden bg-white/5 border-t border-white/10 px-3 py-1.5">
  <button className="w-full flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10">
    {isExpanded ? 'Less Information' : 'Additional Information'}
  </button>
</div>
```

### Sheet/Drawer

```tsx
<SheetContent className="bg-[#002147] border-white/10 text-white">
```

---

## Documentation Index

**Core:**

- `docs/REFERENCE.md` - Detailed tech stack
- `docs/admin-style-guide.md` - Admin UI specs

**Deployment:**

- `docs/RAILWAY_DEPLOYMENT.md` - Railway setup
- `docs/GET_SUPABASE_KEYS.md` - Supabase keys

**Mobile:**

- `docs/capacitor-guide.md` - Capacitor setup
- `docs/mobile-app-implementation-plan.md` - Mobile plan

**Features:**

- `docs/trip-wizard.md` - Trip wizard
- `docs/CRUISE_GUIDE_IMPORT_PROTOCOL.md` - Cruise import
- `docs/TripInfoAndFAQ.md` - Info sections

---

## Pre-Commit Checklist

- [ ] No hardcoded secrets
- [ ] Inputs validated with Zod
- [ ] No `console.log` (use logger)
- [ ] No `any` types
- [ ] Try-catch on async operations
- [ ] No `innerHTML` with user content
- [ ] React Query staleTime finite
- [ ] Images have `loading="lazy"`
- [ ] Supabase images use `getOptimizedImageUrl()` with appropriate preset
- [ ] Routes are lazy loaded
- [ ] No gradients on backgrounds

---

## Security Compliance Checklist

**When adding new endpoints:**

- [ ] Rate limiting applied (use appropriate limiter from `middleware/rate-limiting.ts`)
- [ ] Input validation with Zod schema (`validateBody`, `validateQuery`)
- [ ] Search terms sanitized with `sanitizeSearchTerm()`
- [ ] Authentication required where appropriate (`requireAuth`, `requireContentEditor`, etc.)
- [ ] Error messages don't expose internal details
- [ ] Password fields use 12+ character minimum

**When creating RLS policies:**

- [ ] Use `(select auth.uid())` NOT `auth.uid()` (prevents per-row re-evaluation)
- [ ] Use `(select auth.jwt())` NOT `auth.jwt()`
- [ ] Verify table has RLS enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Test policies work for intended roles
- [ ] Run security advisor after: `mcp__supabase__get_advisors`

**When handling files/images:**

- [ ] Validate MIME type (whitelist approach)
- [ ] Validate file extension
- [ ] Check Content-Length before download
- [ ] Use UUID for filenames (no user input)
- [ ] Upload to Supabase Storage only

**Periodic security checks:**

```bash
# Run Supabase security advisor
mcp__supabase__get_advisors(project_id, type="security")

# Run npm audit
npm audit

# TypeScript check
npm run check
```
