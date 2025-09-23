# 📋 Schema Migration Tracker

## 📚 Context & Background
**Full Context**: See [`MIGRATION_CONTEXT.md`](./MIGRATION_CONTEXT.md) for complete problem analysis and history
**Working Endpoints**: See [`WORKING_ENDPOINTS.md`](./WORKING_ENDPOINTS.md) for current API state

## 🎯 Migration Overview
**Goal**: Align codebase with new database schema (cruises→trips, ports→locations, users→profiles)
**Started**: December 23, 2024
**Target Completion**: December 24, 2024
**Status**: 🟡 In Progress (Phase 0 Complete)
**Time Estimate**: 10-15 hours total
**Backup Branch**: `pre-migration-backup-20250923-072616`

---

## 📊 Migration Progress

### Overall Progress: [1/6 Phases Complete] ✅
- [x] Phase 0: Pre-Migration Setup ✅ Complete
- [ ] Phase 1: Core Storage Layer 🔴 Not Started
- [ ] Phase 2: Type System Alignment 🔴 Not Started
- [ ] Phase 3: API Route Migration 🔴 Not Started
- [ ] Phase 4: Frontend Migration 🔴 Not Started
- [ ] Phase 5: Cleanup & Optimization 🔴 Not Started

---

## Phase 0: Pre-Migration Setup ⏱️ 30min
**Status**: 🟢 Complete
**Risk**: Low
**Blocker for**: All phases
**Completed**: December 23, 2024 @ 07:30 UTC

### Tasks:
- [x] Create backup branch: `git checkout -b pre-migration-backup` ✅ `pre-migration-backup-20250923-072616`
- [x] Document working endpoints in `WORKING_ENDPOINTS.md` ✅ Created comprehensive endpoint analysis
- [x] Create test database backup ⚠️ Using Supabase automatic backups
- [x] Notify team via Slack/email ⚠️ N/A for solo project
- [x] Set up test environment ✅ Verified test scripts and dev server

### Validation:
- [x] Backup branch created and pushed ✅ Branch pushed to GitHub
- [x] Team notified and acknowledged ⚠️ N/A
- [x] Test environment accessible ✅ Dev server starts (database unhealthy expected)

---

## Phase 1: Core Storage Layer ⏱️ 2-3 hours
**Status**: 🔴 Not Started
**Risk**: HIGH
**Blocker for**: All subsequent phases

### Files to Update:
- [ ] `/shared/schema.ts` - Add deprecation comments
- [ ] `/server/storage.ts` - Fix imports and queries
  - [ ] Line 9-12: Remove Cruise, use Trip
  - [ ] Line 10: InsertUser → InsertProfile
  - [ ] Fix all db.select() queries
  - [ ] Fix all db.insert() queries
  - [ ] Fix all db.update() queries
- [ ] `/server/storage/OptimizedStorage.ts` - Update batch queries
- [ ] `/server/storage/PortStorage.ts` → Rename to `LocationStorage.ts`
  - [ ] Update class name
  - [ ] Update all methods
  - [ ] Fix imports in other files

### Testing Checklist:
- [ ] Test all CRUD operations for trips table
- [ ] Test all CRUD operations for locations table
- [ ] Test all CRUD operations for profiles table
- [ ] Test junction table operations (trip_talent)
- [ ] Verify no SQL errors in logs
- [ ] TypeScript compiles without errors

### Rollback Point:
- [ ] Git commit created: `git commit -m "Phase 1: Storage layer migration"`

---

## Phase 2: Type System Alignment ⏱️ 1-2 hours
**Status**: 🔴 Not Started
**Risk**: Medium
**Dependencies**: Phase 1 must be complete
**Blocker for**: Frontend development

### Type Updates:
- [ ] `/shared/api-types.ts`
  - [ ] Line 33: cruiseId → tripId
  - [ ] Line 73: Port interface → Location
  - [ ] Line 89: User interface → Profile
  - [ ] Line 103: cruiseId → tripId
  - [ ] Line 104: portId → locationId
  - [ ] Line 115: cruiseId → tripId
- [ ] `/shared/api-types-generated.ts`
  - [ ] Regenerate from OpenAPI
  - [ ] Verify generation succeeded
- [ ] Global type import updates
  - [ ] Find all `import.*User.*from` → Profile
  - [ ] Find all `import.*Cruise.*from` → Trip
  - [ ] Find all `import.*Port.*from` → Location

### Testing Checklist:
- [ ] `npm run type-check` passes
- [ ] No red squiggles in VS Code
- [ ] Auto-complete shows correct types
- [ ] Generated types match schema.ts

### Rollback Point:
- [ ] Git commit created: `git commit -m "Phase 2: Type system alignment"`

---

## Phase 3: API Route Migration ⏱️ 2-3 hours
**Status**: 🔴 Not Started
**Risk**: HIGH
**Dependencies**: Phases 1-2 must be complete
**Blocker for**: Frontend API calls

### Route Updates:
- [ ] `/server/routes/trips.ts`
  - [ ] Rename route from /cruises to /trips
  - [ ] Add compatibility redirect
  - [ ] Update all handler functions
  - [ ] Fix response shapes
- [ ] `/server/routes/locations.ts`
  - [ ] Rename route from /ports to /locations
  - [ ] Add compatibility redirect
  - [ ] Update handler functions
- [ ] `/server/routes/media.ts`
  - [ ] Update bucket name references
  - [ ] Fix upload paths (single bucket + folders)
  - [ ] Update image URL generation
- [ ] `/server/routes.ts`
  - [ ] Lines 64-85: Remove old static paths
  - [ ] Add new app-images static path
  - [ ] Update CSRF middleware exceptions
- [ ] `/server/auth-routes.ts`
  - [ ] Update user references to profiles
  - [ ] Fix JWT payload structure
- [ ] OpenAPI Updates
  - [ ] `/server/openapi/paths/trips.ts`
  - [ ] `/server/openapi/paths/public.ts`
  - [ ] `/server/openapi/spec.ts`
  - [ ] Regenerate API documentation

### Testing Checklist:
- [ ] GET /api/trips returns data
- [ ] GET /api/cruises redirects to /api/trips (compatibility)
- [ ] GET /api/locations returns data
- [ ] GET /api/ports redirects to /api/locations (compatibility)
- [ ] Image uploads work correctly
- [ ] Authentication still works
- [ ] API documentation renders correctly

### Rollback Point:
- [ ] Git commit created: `git commit -m "Phase 3: API route migration with compatibility"`

---

## Phase 4: Frontend Migration ⏱️ 4-5 hours
**Status**: 🔴 Not Started
**Risk**: Medium
**Dependencies**: Phases 1-3 must be complete
**Blocker for**: User experience

### Component Updates:
- [ ] **Admin Pages** `/client/src/pages/admin/`
  - [ ] `users.tsx` → Update to profiles
  - [ ] `cruise-wizard.tsx` → Rename to `trip-wizard.tsx`
  - [ ] `cruise-detail.tsx` → Rename to `trip-detail.tsx`
  - [ ] Update router references
- [ ] **Components** `/client/src/components/`
  - [ ] Update all API call endpoints
  - [ ] Fix prop interfaces
  - [ ] Update state management
- [ ] **Forms**
  - [ ] Update field names (cruiseId → tripId)
  - [ ] Fix validation schemas
  - [ ] Update error messages
- [ ] **API Client**
  - [ ] Update all endpoint URLs
  - [ ] Fix request payloads
  - [ ] Update response handling
- [ ] **Data Files**
  - [ ] `/client/src/data/cruise-data.ts` → `trip-data.ts`
  - [ ] Update mock data structure

### Testing Checklist:
- [ ] All pages load without errors
- [ ] Forms submit successfully
- [ ] Data displays correctly
- [ ] Search functionality works
- [ ] Filters work properly
- [ ] Mobile responsive layout intact
- [ ] No console errors
- [ ] No TypeScript errors

### Rollback Point:
- [ ] Git commit created: `git commit -m "Phase 4: Frontend migration complete"`

---

## Phase 5: Cleanup & Optimization ⏱️ 1-2 hours
**Status**: 🔴 Not Started
**Risk**: Low
**Dependencies**: All phases must be complete

### Cleanup Tasks:
- [ ] Remove backward compatibility aliases from schema.ts
- [ ] Remove compatibility redirects from routes
- [ ] Delete deprecated type exports
- [ ] Remove unused imports
- [ ] Delete old component files
- [ ] Clean up console.log statements
- [ ] Update README.md
- [ ] Update CLAUDE.md with new schema

### Optimization:
- [ ] Review query performance
- [ ] Update database indexes if needed
- [ ] Clear all caches
- [ ] Update CDN paths
- [ ] Minify production bundle

### Documentation:
- [ ] Update API documentation
- [ ] Update developer onboarding docs
- [ ] Create migration notes
- [ ] Update environment variable docs

### Final Testing:
- [ ] Full regression test
- [ ] Performance testing
- [ ] Load testing
- [ ] Security scan
- [ ] Accessibility check

### Deployment:
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor for errors

---

## 🚨 Rollback Procedures

### Quick Rollback (Any Phase):
```bash
git reset --hard [commit-before-phase]
git push --force-with-lease
```

### Database Rollback:
Not needed - database schema is already correct

### API Compatibility Mode:
Keep redirect routes active until all clients updated

---

## 📝 Notes & Issues

### Known Issues:
- [x] Issue: Database health check failing | Solution: Expected due to schema mismatch, will be fixed in Phase 1

### Discoveries During Phase 0:
- **Endpoint Analysis**: Found 120 total endpoints - 65% using new schema, 26% legacy/mixed, 9% neutral
- **Critical Finding**: Both `/api/cruises` and `/api/trips` endpoints exist simultaneously causing confusion
- **Storage Issue**: Static file paths still using old bucket structure (`/cruise-images`, `/port-images`, etc.)
- **Database Confirmed**: Supabase database correctly uses new schema (trips, locations, profiles tables verified)
- **Test Environment**: Dev server starts but database health fails (expected until Phase 1 complete)

### Team Notes:
- Solo project - no team coordination needed
- Using Supabase automatic backups for database
- All changes tracked in Git for rollback capability

---

## ✅ Sign-off

### Phase Approvals:
- [ ] Phase 0: [Name] [Date]
- [ ] Phase 1: [Name] [Date]
- [ ] Phase 2: [Name] [Date]
- [ ] Phase 3: [Name] [Date]
- [ ] Phase 4: [Name] [Date]
- [ ] Phase 5: [Name] [Date]

### Final Sign-off:
- [ ] Technical Lead: [Name] [Date]
- [ ] QA Lead: [Name] [Date]
- [ ] Product Owner: [Name] [Date]

---

## 📊 Metrics

### Before Migration:
- Build time: ___
- Bundle size: ___
- TypeScript errors: ___
- Test coverage: ___%

### After Migration:
- Build time: ___
- Bundle size: ___
- TypeScript errors: ___
- Test coverage: ___%

---

Last Updated: [Date/Time]
Next Review: [Date/Time]