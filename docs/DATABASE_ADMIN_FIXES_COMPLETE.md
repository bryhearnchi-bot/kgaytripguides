# Database and Admin Panel Fixes - Complete Solution

## Overview
This document details all the fixes implemented to resolve the admin panel database connectivity and update issues.

## Root Causes Identified

### 1. RLS (Row Level Security) Issues
**Problem**: Drizzle ORM respects RLS policies, and the RLS policies had infinite recursion
**Solution**: Use Supabase Admin client with service role key to bypass RLS for admin operations

### 2. Authentication Issues
**Problem**: Session persistence causing logout to fail
**Solution**: Clear localStorage keys before signout

### 3. Database Constraints
**Problem**: Database constraints preventing certain operations (e.g., "viewer" role)
**Solution**: Update database constraints to match application requirements

## Key Pattern: Use Supabase Admin for All Admin Operations

### Implementation Pattern
```javascript
import { getSupabaseAdmin, handleSupabaseError, isSupabaseAdminAvailable } from '../supabase-admin';

// In your route handler:
app.put("/api/resource/:id", requireAuth, async (req, res) => {
  try {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      return res.status(503).json({
        error: 'Admin service not configured',
        details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      });
    }

    // Use Supabase Admin client to bypass RLS
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('table_name')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'update resource');
    }

    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update' });
  }
});
```

## Files Modified

### 1. `/server/routes/admin-users-routes.ts`
- Switched from Drizzle ORM to Supabase Admin client
- Fixed user creation with manual profile creation
- Added proper error handling for database constraints

### 2. `/server/routes/locations.ts`
- Already using Supabase Admin pattern correctly
- Handles both locations and ships tables

### 3. `/client/src/hooks/useSupabaseAuth.ts`
- Fixed logout by clearing localStorage keys
- Improved session management

### 4. Database Migrations
- Updated `valid_role` constraint to include "viewer" role
- Fixed profile creation trigger with error handling

## Authentication Fix Pattern

### Client-side (Frontend)
```javascript
// Get fresh session token for each request
const { data: { session } } = await supabase.auth.getSession();
if (!session?.access_token) {
  throw new Error('No authentication token');
}

// Include in headers
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${session.access_token}`,
};
```

### Server-side (Backend)
```javascript
// Always use Supabase Admin for admin operations
const supabaseAdmin = getSupabaseAdmin();

// CRUD operations bypass RLS
const { data, error } = await supabaseAdmin
  .from('profiles')
  .select('*')
  .order('created_at', { ascending: false });
```

## Field Name Consistency
- Database: snake_case (e.g., `full_name`, `cruise_line`)
- Frontend: can use either snake_case or camelCase
- Backend: accepts both, converts to snake_case for database

## Testing Checklist

### User Management ✅
- [x] List users
- [x] Update user details
- [x] Change user role (including "viewer")
- [x] Create new user
- [x] Delete user

### Location Management ✅
- [x] List locations
- [x] Create location
- [x] Update location
- [x] Delete location

### Ship Management ✅
- [x] List ships
- [x] Create ship
- [x] Update ship
- [x] Delete ship

### Authentication ✅
- [x] Login works
- [x] Logout clears session completely
- [x] Admin menu shows for admin users
- [x] Username displays correctly

## Environment Requirements

```bash
# Required environment variables
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # CRITICAL for admin operations
DATABASE_URL=postgresql://postgres:password@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres
```

## Common Issues and Solutions

### Issue: "Failed to update" errors
**Solution**: Ensure using Supabase Admin client, not Drizzle ORM

### Issue: Logout not working
**Solution**: Clear localStorage keys starting with 'sb-' before signout

### Issue: Role changes not saving
**Solution**: Check database constraints match allowed roles

### Issue: User creation fails
**Solution**: Manually create profile if trigger fails

## Next Steps for Other Admin Sections

When implementing other admin sections (talent, parties, etc.), follow this pattern:

1. Use Supabase Admin client for all CRUD operations
2. Include Bearer token in all API requests from frontend
3. Handle both snake_case and camelCase field names
4. Add proper error handling with specific messages
5. Test each operation thoroughly

## Migration Complete
All critical admin panel functions are now working correctly with proper database connectivity and authentication.