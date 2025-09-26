# Authorization Fix Plan

## Problem Summary
Users are experiencing "cannot fetch data" errors when trying to edit/save items across all admin pages. Additionally, the Edit button is not showing for super_admin users on the Trips page.

## Root Causes Identified

1. **Missing Bearer Token**: Admin pages use raw `fetch()` without Authorization header - only sending cookies
2. **Incomplete Role Types**: TypeScript types missing 'super_admin' role in several places
3. **Inconsistent Permission Checks**: Frontend permission checks don't match server-side role hierarchy

## Fix Strategy

### Phase 1: Fix Authentication Headers (Primary Issue)
The main issue is that admin pages are not sending the Bearer token with API requests.

**Update all admin pages to use apiClient** instead of raw fetch:
- `/client/src/pages/admin/ships.tsx`
- `/client/src/pages/admin/locations.tsx`
- `/client/src/pages/admin/artists.tsx`
- `/client/src/pages/admin/themes.tsx`
- `/client/src/pages/admin/trip-info-sections.tsx`
- `/client/src/pages/admin/trips-management.tsx`
- `/client/src/pages/admin/users.tsx`

Replace all `fetch()` calls with `apiClient` or `api.*` methods that include Bearer token.

Example change:
```typescript
// Before:
const response = await fetch('/api/ships', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(data)
});

// After:
import { api } from '@/lib/api-client';

const response = await api.post('/api/ships', data);
```

### Phase 2: Fix Role Types & Permissions

**Update TypeScript types** to include super_admin:
- `/shared/api-types.ts` - Update Profile role type to include 'super_admin'
- `/shared/schema.ts` - Ensure role enum is complete

**Update frontend permission checks**:
- Trips page: Allow super_admin for all operations
- Ensure role hierarchy: super_admin > content_manager > viewer
- Remove 'admin' role references (consolidate to super_admin/content_manager)

### Phase 3: Fix Edit Button Visibility

Update permission checks in `trips-management.tsx`:
```typescript
// Current:
const canCreateOrEditTrips = ["admin", "content_manager"].includes(userRole);

// Should be:
const canCreateOrEditTrips = ["super_admin", "content_manager"].includes(userRole);
```

## Expected Role Hierarchy

As specified by the user:
- **super_admin**: Full CRUD across everything
- **content_manager**: Full CRUD for everything except users
- **viewer**: View-only access, no editing capabilities

## Expected Outcomes

After implementing these fixes:
1. ✅ "Cannot fetch data" errors when editing will be resolved
2. ✅ Missing Edit button for super_admin users will appear
3. ✅ Proper role hierarchy (super_admin, content_manager, viewer) will be enforced
4. ✅ Save operations will work across all admin pages

## Implementation Order

1. First, fix the apiClient usage (Phase 1) - this will immediately resolve the save/edit errors
2. Then, update the role types and permissions (Phase 2 & 3) - this will fix the permission visibility issues