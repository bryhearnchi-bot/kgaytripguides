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
│   ├── hooks/                  # Custom hooks
│   └── types/                  # TypeScript types
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
- [ ] Routes are lazy loaded
- [ ] No gradients on backgrounds
