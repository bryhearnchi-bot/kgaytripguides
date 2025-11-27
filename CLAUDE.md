# KGay Travel Guides - Development Rules

**All Claude Code agents MUST follow these rules.**

---

## CRITICAL RULES

### 1. NO TIMEZONE CONVERSIONS - EVER

**All dates/times are in the destination's local timezone. NEVER convert.**

```typescript
// CORRECT - Parse YYYY-MM-DD string
const [y, m, d] = dateStr.split('-').map(Number);
const date = new Date(y, m - 1, d);

// CORRECT - Format Date to YYYY-MM-DD
`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// WRONG - causes timezone bugs
new Date('2025-10-12'); // UTC midnight conversion
date.toISOString().split('T')[0]; // UTC conversion
```

### 2. Supabase Only

- **Database**: `postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres`
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (all images must be uploaded here)
- **Deployment**: Railway

### 3. API Field Naming

- API responses: `camelCase` (`startDate`, `heroImageUrl`)
- Database columns: `snake_case` (`start_date`, `hero_image_url`)
- Transform in storage layer functions

### 4. Never Create New Pages

- Update existing pages in `/client/src/pages/`
- Create new components in `/client/src/components/`
- Admin pages already exist for all entities

### 5. Color Scheme

- Background: `#002147` (Oxford Blue) - solid, NO gradients
- Frosted glass (`bg-white/10 backdrop-blur-lg`) - navigation only

```tsx
// CORRECT
<div className="min-h-screen bg-[#002147]">

// WRONG
<div className="bg-gradient-to-br from-blue-500 to-purple-500">
```

### 6. Event Rendering - Dual Locations

Events render in TWO places - update both when changing event display:

1. `EventCard` - `/client/src/components/trip-guide/shared/EventCard.tsx`
2. `JobListingComponent` - `/client/src/components/smoothui/ui/JobListingComponent.tsx` (lines ~518-576)

---

## Development Best Practices

### Reusable Components - ALWAYS

- **Search first**: Before creating any component, check `/client/src/components/ui/` and existing components
- **Create reusable**: New components should be generic and reusable, not one-off
- **Extract patterns**: If you write similar code twice, extract to a shared component
- **Use existing**: Prefer shadcn/ui components (`Button`, `Dialog`, `Sheet`, `Select`, etc.)

```tsx
// WRONG - inline one-off component
<div className="bg-white/5 border border-white/20 rounded-xl p-4">...</div>

// CORRECT - use or create reusable component
<Card>...</Card>
```

### DRY (Don't Repeat Yourself)

- Extract shared logic to custom hooks (`/client/src/hooks/`)
- Extract shared utilities to `/client/src/lib/`
- Extract shared API calls to existing query hooks
- If a pattern appears 2+ times, refactor
- **Existing hooks to reuse**: `useWindowSize`, `useTripUpdates`, `useImageUpload`, `useTripData`, `useShare`
- **Date utilities**: Use `getTodayString()` and `parseLocalDate()` from `@/lib/timeFormat` (avoids timezone bugs)

### Single Responsibility

- Components do ONE thing well
- Split large components (>200 lines) into smaller pieces
- Separate concerns: UI, logic, data fetching

### Minimize Dependencies

- Don't add npm packages for simple tasks
- Use existing utilities before adding new ones
- Check if React/browser APIs can solve the problem

### Clean Code

- Descriptive names: `handleSubmit` not `hs`, `isLoading` not `l`
- Small functions: <30 lines ideally
- Early returns over nested conditionals
- Delete dead/commented code - git has history

### Plan Documents

- When working from a plan document (e.g., `docs/Refactor-Code.md`), **always update the checklist** after completing tasks
- Mark completed items with `[x]` and add completion date
- Update metrics/counts if they've changed
- Commit the updated plan with your changes

### State Management

- Local state first (`useState`)
- Lift state only when needed
- React Query for server state
- Context for truly global state only

---

## Code Standards

### Security

- Validate all inputs with Zod schemas
- Use `logger` service, not `console.log`
- Never use `innerHTML` with user content
- Fail fast on missing env vars (no fallback defaults)
- **Password minimum**: 12 characters (enforced in Zod schemas)
- **Sanitize search inputs**: Use `sanitizeSearchTerm()` from `server/utils/sanitize.ts`
- **Rate limiting**: All endpoints should have appropriate rate limits
- **Generic error messages**: Don't reveal internal details to clients

### Database Security (RLS)

- **All tables must have RLS enabled** - no exceptions
- Use `(select auth.uid())` NOT `auth.uid()` in RLS policies (performance)
- Use `(select auth.jwt())` NOT `auth.jwt()` in RLS policies
- Admin write policies should check role from `profiles` table
- **Extensions go in `extensions` schema**, not `public` (e.g., `CREATE EXTENSION pg_trgm SCHEMA extensions`)
- Run `mcp__supabase__get_advisors` periodically to check for issues

### TypeScript

- No `any` types without justification
- Use `unknown` in catch blocks
- Define interfaces for all data structures
- Export types from `/client/src/types/` (organized by domain: `api.ts`, `admin.ts`, `wizard.ts`, `trip-data.ts`, `trip-info.ts`)
- **Fix TypeScript errors immediately** when you encounter them
- **Prefer `logger` over `console.log`** - if `console.log` is needed for debugging, remove it immediately after the problem is resolved
- Import client logger from `@/lib/logger`, server logger from `server/logging/logger`

### Performance

- Lazy load all routes: `lazy(() => import(...))`
- React Query staleTime: 5 minutes (never Infinity)
- Images: `loading="lazy"`
- Memoize expensive computations (`useMemo`, `useCallback`)
- Avoid inline object/array creation in JSX props

### Error Handling

```typescript
catch (error: unknown) {
  if (error instanceof Error) {
    logger.error('Operation failed', { message: error.message });
  }
}
```

---

## Quick Commands

```bash
npm run dev          # Dev server (port 3001)
npm run build        # Production build
npm run check        # TypeScript check
npm test             # Vitest tests
npm run test:e2e     # Playwright E2E
```

---

## Environment Variables

```bash
DATABASE_URL=postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
VITE_SUPABASE_ANON_KEY=...
NODE_ENV=development|production
PORT=3001
```

---

## Project Structure

```
client/src/
  components/
    trip-guide/tabs/     # OverviewTab, ItineraryTab, ScheduleTab, TalentTabNew, InfoTab, FAQTab
    trip-guide/shared/   # EventCard, TalentCard
    admin/               # Admin components
    ui/                  # shadcn/ui components
  pages/
    admin/               # trips-management, trip-wizard, locations, ships, resorts, artists, themes, faqs
    auth/                # login, AuthCallback
server/
  routes/                # API endpoints
  storage/               # Database queries (Supabase)
  middleware/            # Auth, CSRF, logging
```

---

## Additional Reference

For detailed documentation: `docs/REFERENCE.md`

- Admin style guide: `docs/admin-style-guide.md`
- Railway deployment: `docs/RAILWAY_DEPLOYMENT.md`
- Mobile/PWA: `docs/capacitor-guide.md`
