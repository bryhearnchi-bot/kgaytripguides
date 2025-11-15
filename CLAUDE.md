# KGay Travel Guides - Critical Development Rules

**All Claude Code agents MUST follow these rules. Breaking these rules breaks the application.**

---

## 🚨 CRITICAL RULES

### 1. NO TIMEZONE CONVERSIONS - EVER (MANDATORY)

**ALL DATES AND TIMES ARE IN THE LOCAL TIMEZONE OF THE TRIP DESTINATION. NEVER CONVERT TIMEZONES.**

- 🔥 **This application is for travel guides. All dates/times are already in the destination's local timezone.**
- ✅ Store dates as entered: `"2025-10-12"` means October 12th at the destination
- ✅ Store times as entered: `"14:00"` means 2:00 PM at the destination (24-hour format)
- ❌ NEVER convert to UTC or any other timezone
- ❌ NEVER use `new Date("2025-10-12")` or `new Date(dateStr)` with ISO strings
- ❌ NEVER use `.toISOString()` for date formatting - returns UTC
- ✅ Parse dates: `const [y, m, d] = date.split('-').map(Number); new Date(y, m - 1, d);`
- ✅ Format dates: Use `getFullYear()`, `getMonth()`, `getDate()` on locally-created dates
- ✅ Backend: Use `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` when extracting from DB timestamps
- 🔥 **Users care about the time AT THE DESTINATION, not their home timezone**

**Why this matters:**

- Trip on Oct 12-18 must display as Oct 12-18, not Oct 11-17 or Oct 13-19
- Cruise departure at 14:00 means 2:00 PM ship time, regardless of user's browser timezone
- Event on "2025-10-15" stays on Oct 15, never shifted by timezone
- No timezone math = no off-by-one date bugs

**Correct Patterns (see TripWizardContext for reference):**

```typescript
// ✅ CORRECT - Parse YYYY-MM-DD string
const [y, m, d] = dateStr.split('-').map(Number);
const date = new Date(y, m - 1, d);

// ✅ CORRECT - Format Date to YYYY-MM-DD
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
return `${year}-${month}-${day}`;

// ❌ WRONG
new Date('2025-10-12'); // UTC midnight conversion
date.toISOString().split('T')[0]; // UTC conversion
```

### 2. Database Rules (MANDATORY)

**SUPABASE IS THE ONLY DATABASE. PERIOD.**

- ✅ Connection: `DATABASE_URL=postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres`
- ❌ NO Neon, NO mock data, NO other databases
- ❌ NEVER use `USE_MOCK_DATA=true`
- 🔥 **ALL DATABASE OPERATIONS GO TO SUPABASE - NO EXCEPTIONS**

**SQL Functions MUST include search_path:**

```sql
CREATE OR REPLACE FUNCTION my_function()
RETURNS TABLE(...) AS $$
BEGIN
  SET search_path = public, extensions;  -- REQUIRED!
  RETURN QUERY SELECT ...;
END;
$$ LANGUAGE plpgsql;
```

### 3. API Field Naming (MANDATORY)

**API RESPONSES USE CAMELCASE. DATABASE USES SNAKE_CASE.**

- ✅ API: `startDate`, `heroImageUrl`, `shipName`, `createdAt`
- ✅ Database: `start_date`, `hero_image_url`, `ship_name`, `created_at`
- 🔥 **Transform snake_case → camelCase in storage layer (transformTripData, etc.)**

### 4. Page Creation Rules (MANDATORY)

**NEVER CREATE NEW PAGES - ONLY UPDATE EXISTING ONES.**

- ✅ Update existing: `/client/src/pages/admin/ships.tsx`
- ✅ Create components in: `/client/src/components/`
- ❌ NEVER create new pages like `ShipsManagement.tsx`
- 🔥 **CREATING NEW PAGES BREAKS APPLICATION ARCHITECTURE**

### 5. Image Storage Rules (MANDATORY)

**ALL IMAGES MUST BE STORED IN SUPABASE STORAGE. PERIOD.**

- ✅ Upload images to Supabase storage bucket
- ✅ Use Supabase storage URLs only
- ❌ NEVER use external image URLs
- ❌ NEVER link to images on other domains
- 🔥 **ALL IMAGES MUST BE IN SUPABASE STORAGE - NO EXCEPTIONS**

**Image Handling:**

```typescript
// ✅ CORRECT - Upload to Supabase
const { data, error } = await supabase.storage.from('bucket-name').upload('file-path', file);

// ❌ WRONG - External URL
const imageUrl = 'https://example.com/image.jpg';
```

**AI-Found Images:**

- If AI finds an external image, download it first
- Then upload to Supabase storage
- Use the Supabase storage URL in the database

### 6. Color Scheme Rules (MANDATORY)

**SOLID OXFORD BLUE BACKGROUNDS. NO GRADIENTS. NO EXCEPTIONS.**

- ✅ Background color: `#002147` (Oxford Blue)
- ✅ Apply to ALL pages, slide-out menus, and content areas
- ❌ NEVER use gradients on backgrounds (`bg-gradient-*`)
- ❌ NEVER use background images on page backgrounds
- ❌ NEVER use radial gradients or any gradient effects
- 🔥 **Frosted glass ONLY on navigation bar and safe areas**

**Frosted Glass (Limited Use):**

```tsx
// ✅ CORRECT - Navigation bar only
<div className="bg-white/10 backdrop-blur-lg">

// ❌ WRONG - Content areas
<div className="bg-white/10 backdrop-blur-lg"> // NO!
```

**Page Backgrounds:**

```tsx
// ✅ CORRECT
<div className="min-h-screen bg-[#002147]">
<SheetContent className="bg-[#002147] border-white/10 text-white">

// ❌ WRONG
<div className="bg-gradient-to-br from-blue-500 to-purple-500">
<div style={{ backgroundImage: 'radial-gradient(...)' }}>
```

### 7. Component Patterns & Gotchas (IMPORTANT)

**Event Rendering - Dual Locations:**

Events are rendered in TWO separate places in the codebase. When making changes to event display, you MUST update both:

1. **`EventCard` component** (`/client/src/components/trip-guide/shared/EventCard.tsx`)
   - Used in: Events tab (ScheduleTab), EventsModal
   - Main event card component with badges, talent, party themes
   - Has built-in modals for talent/party theme details

2. **`JobListingComponent` inline rendering** (`/client/src/components/smoothui/ui/JobListingComponent.tsx`)
   - Used in: Itinerary tab → "View Events for This Day" modal (lines ~518-576)
   - Inline event rendering within the day events modal
   - Simpler layout with larger images (24x24)
   - Has its own slide-in panels for talent/party details

**Why this matters:**

- Changes to event display (badges, layout, styling) must be applied to both locations
- Badge removals, venue display, artist rendering - all need dual updates
- Future refactoring opportunity: consolidate into single EventCard component with flexible layouts

**Current state:** Both locations show only venue badge (cyan). Artist and party theme badges removed from both (as of Nov 2025).

**Expandable Card Pattern - Ship Info:**

The Ship Info card on the Overview tab uses an expandable pattern with a button bar:

- **Location:** `/client/src/components/trip-guide/tabs/OverviewTab.tsx` (search for "Ship Information")
- **State management:** Uses `isShipExpanded` boolean state with toggle
- **Button bar pattern:** Same as other cards - `bg-white/5 border-t border-white/10` container, button with `bg-white/5 hover:bg-white/10`
- **Button text:** Toggles between "Additional Ship Information" and "Less Ship Information"
- **Mobile only:** Hidden on desktop (`lg:hidden`)

This pattern can be reused for other expandable cards. The card uses:

```tsx
<div className="bg-white/5 border border-white/20 rounded-xl shadow-lg overflow-hidden">
  <div className="p-4 md:p-6">{/* Card content */}</div>
  {/* Bottom Action Bar - Mobile only */}
  <div className="lg:hidden bg-white/5 border-t border-white/10 px-3 py-1.5">
    <button className="w-full flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/20 transition-all">
      <Icon className="w-3.5 h-3.5" />
      {isExpanded ? 'Less Information' : 'Additional Information'}
    </button>
  </div>
</div>
```

**Trip Guide Tab Components:**

Active tabs (in `/client/src/components/trip-guide/tabs/`):

- `OverviewTab.tsx` - Trip overview (ACTIVE)
- `ItineraryTab.tsx` - Daily itinerary with ports
- `ScheduleTab.tsx` - Events schedule (uses EventCard)
- `TalentTabNew.tsx` - Talent roster (ACTIVE)
- `PartiesTab.tsx` - Party schedule
- `InfoTab.tsx` - Important trip information
- `FAQTab.tsx` - Frequently asked questions

Deprecated tabs (for reference only):

- `TalentTab.tsx` - Old talent tab (use TalentTabNew.tsx instead)
- `OverviewTab_*.tsx` - Various overview experiments (not used)

**Tab Headers:** All tab headers have been removed as of Nov 2025 to provide more content space.

---

## 🔐 Security Standards (MANDATORY)

### Environment Variables

**ALWAYS fail fast. NEVER use fallback defaults.**

```typescript
// ✅ CORRECT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET not configured');
  process.exit(1);
}

// ❌ WRONG
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
```

### Logging

**NO console.log in production code. Use logger service.**

```typescript
// ✅ CORRECT
import { logger } from '@/lib/logger';
logger.info('User action', { userId, action });
logger.error('Operation failed', error);

// ❌ WRONG
console.log('Debug:', data);
```

### XSS Prevention

**NEVER use innerHTML with user content.**

```typescript
// ✅ CORRECT
element.textContent = userInput;

// ❌ WRONG - XSS vulnerability
element.innerHTML = userInput;
```

### Input Validation

- **Validate ALL inputs** with Zod schemas
- **Use parameterized queries** for database operations
- **Verify roles** on every protected endpoint

---

## ⚡ Performance Standards (MANDATORY)

### Code Splitting

**All routes MUST be lazy loaded.**

```typescript
// ✅ CORRECT
const TripGuide = lazy(() => import('@/pages/TripGuide'));

// ❌ WRONG
import TripGuide from '@/pages/TripGuide';
```

### React Query

**staleTime MUST be finite (5 minutes). NEVER Infinity.**

```typescript
// ✅ CORRECT
staleTime: 5 * 60 * 1000; // 5 minutes

// ❌ WRONG
staleTime: Infinity;
```

### Images

**All images MUST have lazy loading.**

```tsx
<img src={url} loading="lazy" alt="..." />
```

---

## 🛡️ Error Handling (MANDATORY)

### API Routes

**Wrap all routes in try-catch.**

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error);
  return res.status(500).json({
    error: 'An error occurred',
    code: 'INTERNAL_ERROR',
  });
}
```

### Error Types

**Use unknown, not any.**

```typescript
// ✅ CORRECT
catch (error: unknown) {
  if (error instanceof Error) {
    logger.error('Operation failed', { message: error.message });
  }
}

// ❌ WRONG
catch (error: any) { ... }
```

---

## 📊 TypeScript Standards (MANDATORY)

- **NO 'any' types** without explicit justification
- **Strict mode enabled** (already configured)
- **Define interfaces** for all data structures
- **Use type guards** for runtime checking

---

## 🤖 Code Review (MANDATORY)

**After writing significant code, ALWAYS run:**

```bash
# Option 1: Use code-reviewer agent
claude-code use code-reviewer

# Option 2: Use slash command
/review-code
```

**If review finds issues, fix them before proceeding.**

---

## ⚡ Server Management

**ALWAYS use `npm run dev` with `run_in_background: true`:**

```bash
npm run dev
```

**Set `run_in_background: true` in Bash tool to prevent blocking.**

---

## 🚀 Quick Command Reference

```bash
# Development
npm run dev                    # Start dev server (port 3001)
npm run build                  # Production build (includes PWA files)
npm run check                  # TypeScript type checking
npm run clean:cache            # Clear Vite cache

# Testing
npm test                       # Run Vitest unit tests
npm run test:e2e              # Playwright E2E tests
npm run test:e2e:ui           # Playwright E2E with UI
npm run test:coverage         # Test coverage report

# Database
npm run db:seed                # Seed development database
npm run production:seed        # Seed production database

# Code Quality
npm run lint                   # ESLint checking
npm run format                 # Prettier formatting
npm run security:check         # Security vulnerability check

# API Docs
npm run api:docs               # View at localhost:3001/api/docs

# Capacitor / Mobile App
npm run cap:sync              # Sync web build to native projects
npm run cap:ios               # Open iOS project in Xcode
npm run cap:android           # Open Android project in Android Studio
npm run cap:serve:ios         # Run iOS app with live reload
npm run cap:serve:android     # Run Android app with live reload
```

---

## 📱 PWA & Mobile App (Capacitor)

**Progressive Web App (PWA):**

- App is installable on iOS, Android, and desktop browsers
- PWA manifest: `/public/manifest.json`
- Service worker for offline functionality
- App icons and splash screens in `/public/`

**Capacitor Native Apps:**

- iOS and Android native wrappers for the web app
- Configuration: `/capacitor.config.ts`
- Native plugins: Haptics, Status Bar, Splash Screen, Share, Preferences
- Live reload available for development
- Build web app first with `npm run build`, then sync with `npm run cap:sync`

**PWA Detection:**

- Use `window.matchMedia('(display-mode: standalone)').matches` to detect PWA mode
- Navigation behavior differs in PWA vs browser (back buttons, logo navigation)
- Status bar and theme colors configured in manifest

**Key Files:**

- `/capacitor.config.ts` - Capacitor configuration
- `/public/manifest.json` - PWA manifest
- `/ios/` - iOS native project
- `/android/` - Android native project
- `/scripts/copy-pwa-files.js` - Build-time PWA file copying

---

## 🛡️ Pre-Commit Checklist

Before committing, verify:

- [ ] No hardcoded secrets or credentials
- [ ] All inputs validated with Zod
- [ ] No console.log (use logger)
- [ ] No 'any' types without justification
- [ ] Proper error handling (try-catch)
- [ ] No innerHTML with user content
- [ ] React Query staleTime is finite
- [ ] Images have loading="lazy"
- [ ] Routes are lazy loaded
- [ ] **No gradients on backgrounds** (use solid #002147)
- [ ] **Frosted glass only on navigation** (not content areas)
- [ ] Code review passed

---

## 📁 Project Structure (Simplified)

```
├── client/src/
│   ├── components/
│   │   ├── trip-guide/              # Trip guide components
│   │   │   ├── tabs/                # Tab components (Itinerary, Events, Talent, etc.)
│   │   │   ├── modals/              # Modal components (EventsModal, etc.)
│   │   │   ├── shared/              # Shared components (EventCard, TalentCard, etc.)
│   │   │   ├── info-sections/       # Info tab sections
│   │   │   ├── hooks/               # Custom hooks
│   │   │   └── utils/               # Utility functions
│   │   ├── smoothui/                # SmoothUI library components
│   │   ├── admin/                   # Admin page components
│   │   ├── ui/                      # Base UI components (shadcn/ui)
│   │   └── ...
│   ├── pages/
│   │   ├── landing.tsx              # Landing page (trip list)
│   │   ├── trip.tsx                 # Trip guide page
│   │   ├── admin/                   # Admin pages
│   │   └── auth/                    # Auth pages
│   ├── lib/                         # Core libraries (api-client, logger, etc.)
│   ├── contexts/                    # React contexts
│   ├── hooks/                       # Custom hooks
│   ├── types/                       # TypeScript types
│   └── data/                        # Static data (deprecated - moving to DB)
├── server/
│   ├── routes/                      # API route handlers
│   ├── middleware/                  # Express middleware (auth, logging, etc.)
│   ├── logging/                     # Winston logger service
│   ├── schemas/                     # Zod validation schemas
│   ├── storage/                     # Database query functions
│   └── index.ts                     # Express server entry point
├── supabase/                        # Supabase (deprecated - using direct SQL)
├── docs/                            # Documentation
├── scripts/                         # Build and utility scripts
├── public/                          # Static assets (PWA icons, manifest)
├── ios/                             # Capacitor iOS native project
└── android/                         # Capacitor Android native project
```

---

## 🔐 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres

# Supabase
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
VITE_SUPABASE_ANON_KEY=...

# Application
NODE_ENV=development|production
PORT=3001
VITE_API_URL=http://localhost:3001

# Security
SESSION_SECRET=...
JWT_SECRET=...
```

**All secrets MUST be validated on startup. No fallback defaults.**

---

## 🎨 UI Guidelines & Color Scheme (MANDATORY)

### Color Scheme

**The application uses a consistent, solid color scheme with NO gradients.**

**Primary Background Color:**

- **#002147** (Oxford Blue) - Used for ALL page backgrounds, slide-out menus, and main content areas
- ✅ Apply to: `body`, `html`, `App.tsx`, `NavigationDrawer`, `Sheet`, `trip-guide.tsx`
- ❌ NEVER use gradients on page backgrounds
- ❌ NEVER use background images on page backgrounds

**Frosted Glass Effect:**

- **ONLY** used for navigation bar and safe areas
- Classes: `bg-white/10 backdrop-blur-lg`
- Applied to:
  - Navigation banner (top)
  - Bottom safe area
  - Profile dropdown popover
- ❌ NEVER apply frosted glass to page backgrounds or content areas

**Example Usage:**

```tsx
// ✅ CORRECT - Page background
<div className="min-h-screen bg-[#002147]">

// ✅ CORRECT - Navigation bar (frosted glass)
<div className="bg-white/10 backdrop-blur-lg">

// ✅ CORRECT - Slide-out menu
<SheetContent className="bg-[#002147] border-white/10 text-white">

// ❌ WRONG - Gradient background
<div className="bg-gradient-to-br from-blue-500 to-purple-500">

// ❌ WRONG - Background image
<div style={{ backgroundImage: 'radial-gradient(...)' }}>

// ❌ WRONG - Frosted glass on content
<div className="bg-white/10 backdrop-blur-lg"> // Only for nav!
```

### Admin Style Guide

- **Reference**: `docs/admin-style-guide.md` for detailed specs
- **Never create new admin pages** - only update existing
- **Use LocationManagement.tsx pattern** for all admin pages
- **Consistent Oxford Blue (#002147) background** across all admin pages

### Design System

- **Solid Oxford Blue (#002147)** background - NO gradients
- Frosted glass effects on navigation only
- Shadcn/ui components
- Tailwind CSS
- Mobile-first responsive design

### Admin Pages Architecture

**Available Admin Pages (all in `/client/src/pages/admin/`):**

- `trips-management.tsx` - Main trips list and management
- `trip-wizard.tsx` - New trip creation wizard
- `trip-detail.tsx` - Edit trip details, itinerary, events
- `locations.tsx` - Manage ports/destinations
- `ships.tsx` - Manage cruise ships
- `resorts.tsx` - Manage resorts
- `artists.tsx` - Manage talent/performers
- `talent.tsx` - Legacy talent management (deprecated)
- `themes.tsx` - Manage party themes
- `faqs.tsx` - Manage FAQ entries
- `trip-info-sections.tsx` - Manage info sections
- `lookup-tables.tsx` - Manage reference data
- `users.tsx` - User management
- `invitations.tsx` - Invitation system
- `profile.tsx` - User profile settings

**Admin Page Pattern:**

1. Use existing admin pages - NEVER create new pages
2. Follow LocationManagement.tsx pattern for consistency
3. Solid Oxford Blue background (#002147)
4. Table-based layouts with filters and search
5. Modal-based forms for create/edit operations
6. Toast notifications for user feedback
7. Proper loading states and error handling
8. Role-based access control (admin only)

**Admin Style Guide:** See `docs/admin-style-guide.md` for detailed specifications

---

## 📚 Additional Documentation

**Core Documentation:**

- **Detailed Tech Stack**: `docs/REFERENCE.md`
- **Admin Style Guide**: `docs/admin-style-guide.md`
- **API Documentation**: http://localhost:3001/api/docs
- **API Request Standards**: `docs/API_REQUEST_STANDARDS.md`

**Development Guides:**

- **Capacitor Mobile App**: `docs/capacitor-guide.md` & `docs/mobile-app-implementation-plan.md`
- **Trip Wizard**: `docs/trip-wizard.md`
- **Cruise Import Protocol**: `docs/CRUISE_GUIDE_IMPORT_PROTOCOL.md`
- **Database Sequence Fix**: `docs/DATABASE-SEQUENCE-FIX.md`

**Architecture & Patterns:**

- **Modal Architecture**: `docs/MODAL_ARCHITECTURE_FIX.md` & `docs/MODAL_INTERACTION_FLOW.md`
- **Overview Tab Templates**: `docs/OVERVIEW_TAB_TEMPLATES.md`
- **Trip Info Sections**: `docs/TripInfoAndFAQ.md`

**Reports & Audits:**

- **Security Audit**: `docs/SECURITY_AUDIT_REPORT.md` & `docs/security-review.md`
- **Performance Optimization**: `docs/PERFORMANCE_OPTIMIZATION_REPORT.md`
- **Mobile Responsiveness**: `docs/MOBILE_RESPONSIVENESS_AUDIT.md` & `docs/MOBILE_FIXES_SUMMARY.md`
- **Phase Reports**: `docs/PHASE_*_CHECKPOINT_REPORT.md` (Phases 1-8)

**Deployment:**

- **Railway Deployment**: `docs/RAILWAY_DEPLOYMENT.md`
- **Supabase Keys**: `docs/GET_SUPABASE_KEYS.md`

---

## 🔧 Common Issues & Quick Fixes

### Database Issues

- Verify `DATABASE_URL` has port 6543
- Check `USE_MOCK_DATA` is false or removed

### TypeScript Errors

- Run `npm run check`
- Look for 'any' types without justification

### Performance Issues

- Check code splitting in `client/dist/`
- Verify initial bundle < 200KB gzipped
- Run `npm run build` and check output

### Authentication Issues

- Verify Bearer token in API requests
- Check Supabase RLS policies

---

---

_Last updated: January 2025_
_Color Scheme: Oxford Blue (#002147) - Solid backgrounds, no gradients_
_Current Phase: Phase 8+ Complete (Mobile App, PWA, Performance Optimization)_
_For detailed documentation, see `docs/REFERENCE.md`_

**Key Recent Updates:**

- Added PWA & Capacitor mobile app support
- Event rendering dual location documentation (EventCard + JobListingComponent)
- Updated command reference with Capacitor and testing commands
- Expanded project structure with trip-guide component organization
