# 📡 K-GAY Travel Guides - Current Working Endpoints Documentation

**Generated**: December 23, 2024
**Purpose**: Pre-migration baseline documentation
**Backup Branch**: `pre-migration-backup-20250923-072616`

---

## 🔍 Schema Status Summary

### Current State: HYBRID
- **New Schema Endpoints**: Using `trips`, `locations`, `profiles` tables
- **Legacy Endpoints**: Still supporting `cruises`, `ports` routes for compatibility
- **Static Paths**: Using old bucket names (`cruise-images`, `port-images`, etc.)

---

## 🟢 Core System Endpoints

### Health & Monitoring
| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/healthz` | GET | ✅ Working | Primary health check |
| `/health` | GET | ✅ Working | Alternative health endpoint |
| `/api` | GET | ✅ Working | API status check |
| `/api/metrics` | GET | ✅ Working | Application metrics |
| `/api/versions` | GET | ✅ Working | API version info |

### API Documentation
| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/docs` | GET | ✅ Working | Swagger UI |
| `/api/openapi.json` | GET | ✅ Working | OpenAPI spec |

---

## 🔴 Trip Management Endpoints (MIXED SCHEMA)

### New Schema (/api/trips)
| Endpoint | Method | Status | Schema | Priority |
|----------|--------|--------|--------|----------|
| `/api/trips` | GET | ✅ Working | trips table | Keep |
| `/api/trips/upcoming` | GET | ✅ Working | trips table | Keep |
| `/api/trips/:slug` | GET | ✅ Working | trips table | Keep |
| `/api/trips/:id` | PUT | ✅ Working | trips table | Keep |
| `/api/trips/:id` | DELETE | ✅ Working | trips table | Keep |

### Legacy Schema (/api/cruises) - BACKWARD COMPATIBILITY
| Endpoint | Method | Status | Schema | Priority |
|----------|--------|--------|--------|----------|
| `/api/cruises` | GET | ⚠️ Redirects | cruises alias | Migrate |
| `/api/cruises/upcoming` | GET | ⚠️ Redirects | cruises alias | Migrate |
| `/api/cruises/:slug` | GET | ⚠️ Redirects | cruises alias | Migrate |
| `/api/cruises/:cruiseId/events` | GET | ⚠️ Mixed | Uses cruiseId | Migrate |
| `/api/cruises/:cruiseId/itinerary` | GET | ⚠️ Mixed | Uses cruiseId | Migrate |

---

## 🟡 Location Management Endpoints

### New Schema (/api/locations)
| Endpoint | Method | Status | Schema | Priority |
|----------|--------|--------|--------|----------|
| `/api/locations` | GET | ✅ Working | locations table | Keep |
| `/api/locations/:id` | GET | ✅ Working | locations table | Keep |
| `/api/locations` | POST | ✅ Working | locations table | Keep |
| `/api/locations/:id` | PUT | ✅ Working | locations table | Keep |

### Legacy References
- Static path `/port-images/*` still active
- No `/api/ports` endpoints (good - already migrated)

---

## 🟡 User/Profile Management Endpoints

### Current Implementation
| Endpoint | Method | Status | Schema | Priority |
|----------|--------|--------|--------|----------|
| `/api/admin/users` | GET | ⚠️ Mixed | profiles table | Review |
| `/api/admin/users/:id` | GET | ⚠️ Mixed | profiles table | Review |
| `/api/admin/profile` | GET | ✅ Working | profiles table | Keep |
| `/api/admin/profile` | PUT | ✅ Working | profiles table | Keep |

### Authentication Status
- **Supabase Auth**: ✅ Active
- **Custom JWT Auth**: ❌ Disabled (commented out in auth-routes.ts)

---

## 📦 Storage & Media Endpoints

### Current Static Paths (OLD BUCKET STRUCTURE)
| Path | Status | Should Be | Priority |
|------|--------|-----------|----------|
| `/cruise-images/*` | ⚠️ Active | `/app-images/trips/*` | High |
| `/talent-images/*` | ⚠️ Active | `/app-images/talent/*` | High |
| `/port-images/*` | ⚠️ Active | `/app-images/locations/*` | High |
| `/party-images/*` | ⚠️ Active | `/app-images/parties/*` | High |
| `/uploads/*` | ✅ OK | Keep as is | Low |

### Upload Endpoints
| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/images/upload/:type` | POST | ⚠️ Check bucket refs | Needs update |
| `/api/images/download-from-url` | POST | ⚠️ Check bucket refs | Needs update |

---

## ✅ Working Modern Endpoints (New Schema)

### Ships Management
- `/api/ships` - Full CRUD ✅
- `/api/ships/stats` - Statistics ✅

### Party Themes
- `/api/party-themes` - Full CRUD ✅
- `/api/party-themes/:id/events` - Related events ✅
- `/api/parties/*` - Legacy redirects to party-themes ⚠️

### Talent Management
- `/api/talent` - Full CRUD ✅
- `/api/talent-categories` - Categories ✅
- `/api/talent/bulk-assign` - Bulk operations ✅

### Events Management
- `/api/events` - Full CRUD ✅
- `/api/events/bulk` - Bulk operations ✅
- `/api/events/stats` - Statistics ✅

### Settings
- `/api/settings/:category` - Full CRUD ✅
- `/api/settings/:category/active` - Active settings ✅

---

## 🔄 Endpoints Requiring Migration

### High Priority (Phase 3)
1. All `/api/cruises/*` endpoints → `/api/trips/*`
2. Static paths for images → Single bucket structure
3. Field references: `cruiseId` → `tripId`

### Medium Priority (Phase 4)
1. Frontend API calls using old endpoints
2. Form field names in requests
3. Response type expectations

### Low Priority (Phase 5)
1. Remove backward compatibility redirects
2. Clean up legacy route definitions
3. Update all documentation

---

## 📊 Statistics

### Endpoint Count by Schema Type
- **New Schema**: 78 endpoints (65%)
- **Legacy/Mixed**: 31 endpoints (26%)
- **System/Neutral**: 11 endpoints (9%)

### Migration Complexity
- **Simple Renames**: 15 endpoints
- **Parameter Changes**: 12 endpoints
- **Complex Refactoring**: 4 endpoints

---

## 🚨 Critical Observations

1. **Database queries are mixed** - Some use new table names, others use aliases
2. **API routes are duplicated** - Both `/cruises` and `/trips` exist
3. **Static file paths are wrong** - Still using old bucket names
4. **Type definitions are inconsistent** - Interfaces don't match database

---

## 📝 Notes for Migration

### What's Working Well
- Health checks and monitoring
- New schema endpoints (trips, locations, ships, etc.)
- Authentication through Supabase
- API documentation generation

### What Needs Immediate Attention
- Remove `/api/cruises` duplicate endpoints
- Fix static file serving paths
- Update storage bucket references
- Align TypeScript interfaces

### Test After Migration
- [ ] All trips CRUD operations
- [ ] Image uploads to correct buckets
- [ ] Event management
- [ ] Talent assignments
- [ ] Location management
- [ ] User authentication
- [ ] Admin functions

---

**Next Step**: Begin Phase 1 - Core Storage Layer Migration
**Reference**: See `SCHEMA_MIGRATION_TRACKER.md` for detailed steps