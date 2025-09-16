# Claude Code Notes

## Project Location

**Project Root**: `/Users/bryan/develop/projects/kgay-travel-guides`

## MCP Configuration

The following MCP servers are configured locally for this project:
- **supabase**: Connected to project `bxiiodeyqvqqcgzzqzvt.supabase.co` (primary database and auth)
- **perplexity-sonar**: AI-powered search with API key configured
- **playwright**: Browser automation and testing
- **vercel**: Deployment management

All MCP servers are installed locally in the project's `node_modules` directory and configured with absolute paths.

## Database Configuration

**IMPORTANT**: This project uses **Supabase PostgreSQL** database, NOT SQLite, Neon, or Railway.

- All database calls/edits must be done through the Supabase PostgreSQL connection
- The database connection is configured in `server/storage.ts`
- Uses Drizzle ORM with node-postgres driver
- Environment variable: `DATABASE_URL` points to the Supabase database
- Schema is defined in `shared/schema.ts`
- Authentication handled via Supabase Auth with `SupabaseAuthContext`

### Never use SQLite commands like:
- `sqlite3 database.db`
- `better-sqlite3`
- Direct SQL file access

### Always use:
- The existing storage layer (`server/storage.ts`)
- Drizzle ORM queries through the Supabase connection
- Environment-based database URL configuration
- Supabase MCP tools for database operations

## Image Storage

All images are stored in Supabase Storage and referenced in the Supabase database:
- **Talent Images**: 22 artist profile images with `profileImageUrl` fields
- **Port Images**: 7 destination images (Athens, Santorini, Kuşadası, Istanbul, Alexandria, Mykonos, Iraklion)
- **Party Theme Images**: All party events have hero images
- All images serve from Supabase Storage CDN with optimized transformations
- **Migration Complete**: Cloudinary integration has been archived to `archived/old-cloudinary/`

## Date and Time Handling Policy

**IMPORTANT**: The entire application should NOT adjust for time zones unless specifically asked to build a component that requires timezone functionality.

### Guidelines:
- **Always use `dateOnly()` utility** when displaying dates from the database
- **Never use `new Date()` directly** on database date strings - it applies unwanted timezone conversion
- **Database dates are stored as intended** - display them exactly as stored
- **Time zone adjustments cause incorrect date display** (e.g., Oct 15 showing as Oct 14)

### Correct Usage:
```typescript
// ✅ CORRECT - No timezone adjustment
format(dateOnly(tripData.trip.startDate), 'MMMM d')

// ❌ WRONG - Applies timezone conversion
format(new Date(tripData.trip.startDate), 'MMMM d')
```

### Exception:
Only implement timezone handling when explicitly requested for features like:
- World clock components
- Multi-timezone event scheduling
- User location-based time displays




## UI Preservation Guidelines

**IMPORTANT**: The app UI has been finalized and approved. DO NOT make changes to:
- Headers, navigation, or tab bars
- Overall color scheme or gradients (ocean theme)
- Banner and hero sections
- General layout structure and spacing patterns
- Tab ordering and navigation behavior
- **Landing page** - Always ask for permission before making any changes
- **Trip guides pages** - Always ask for permission before making any changes

**Allowed modifications**:
- Content within existing card structures
- Text formatting within established design system
- Mobile-specific responsive fixes that don't affect desktop
- Data display improvements that maintain current visual hierarchy
- Admin interfaces (Port Management, Party Management, Event Wizard)
- AI Assistant panel integration

Always preserve the ocean-themed design system and existing visual hierarchy.

## Test-Driven Development (TDD) Guidelines

**MANDATORY**: All changes must follow TDD practices throughout the entire migration:

### TDD Process (Required for EVERY change)
1. **Write tests first** - Before implementing any feature or fix
2. **See tests fail** (red phase) - Confirm tests actually test something
3. **Implement minimal code** to make tests pass (green phase)
4. **Refactor** while keeping tests passing (refactor phase)
5. **QA Review** - Independent verification of test coverage

### TDD Enforcement
- No code merged without tests written first
- Test coverage must increase or stay same, never decrease
- All PRs must show test-first commit history
- QA must verify TDD was followed
- Migration steps require pre-written validation tests

### QA Process During Migration
1. **Pre-Implementation QA**
   - Review test plans before coding
   - Verify test coverage targets
   - Review acceptance criteria

2. **During Implementation QA**
   - Continuous test execution
   - Real-time coverage monitoring
   - Performance testing at each step

3. **Post-Implementation QA**
   - Full regression testing
   - User acceptance testing
   - Performance benchmarking
   - Security audit

### Test Locations
- Unit tests: `__tests__/` directories or adjacent to components
- E2E tests: `test/e2e/` directory (using Playwright)
- Component tests: Adjacent to components with `.test.tsx` extension

### Test Coverage Requirements
- New features: Minimum 80% coverage
- Bug fixes: Must include regression tests
- UI changes: Visual regression tests when applicable
- Mobile responsiveness: Viewport tests at 375px, 768px, 1024px

### Test Commands
```bash
npm test                # Run unit tests in watch mode
npm run test:run        # Run all tests once (CI mode)
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run E2E tests with UI
```

### Pre-commit Checklist
- [ ] All tests pass (`npm run test:run`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] TypeScript checks pass (`npm run check`)
- [ ] Changes documented in CHANGELOG.md