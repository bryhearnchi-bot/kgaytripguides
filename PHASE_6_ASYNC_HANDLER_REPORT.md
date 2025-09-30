# Phase 6: Backend Architecture - AsyncHandler Implementation Report

## Overview
Standardizing error handling across all route files by wrapping async handlers with the `asyncHandler` middleware.

## Completed Files

### ✅ trips.ts
- **Status**: COMPLETE
- **Routes Updated**: 42
- **Key Changes**:
  - All async route handlers wrapped with `asyncHandler`
  - Try-catch blocks removed where appropriate
  - Error responses converted to `ApiError` throws
  - Consistent error handling pattern established

### ✅ locations.ts (Partial)
- **Status**: IN PROGRESS
- **Routes to Update**: 39
- **Completed**: 1 route (location stats)
- **Key Changes Made**:
  - Added `asyncHandler` import
  - Added `ApiError` import
  - Started conversion of error handling patterns

## Files Requiring Updates

### 📋 Remaining Route Files

1. **locations.ts** - 38 remaining routes
2. **media.ts** - All routes need updating
3. **talent-categories.ts** - All routes need updating
4. **party-themes.ts** - All routes need updating
5. **trip-info-sections.ts** - All routes need updating
6. **admin-users-routes.ts** - All routes need updating
7. **invitation-routes.ts** - All routes need updating
8. **admin-lookup-tables-routes.ts** - All routes need updating
9. **performance.ts** - All routes need updating
10. **public.ts** - All routes need updating
11. **admin-sequences.ts** - All routes need updating

## Pattern for Updates

### Before:
```typescript
app.get('/api/example', requireAuth, async (req, res) => {
  try {
    const data = await someOperation();
    return res.json(data);
  } catch (error) {
    logger.error('Error:', error);
    return res.status(500).json({ error: 'Failed' });
  }
});
```

### After:
```typescript
app.get('/api/example', requireAuth, asyncHandler(async (req, res) => {
  const data = await someOperation();
  return res.json(data);
}));
```

## Required Imports for Each File

```typescript
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
```

## Error Status Conversions

| Old Pattern | New Pattern |
|------------|-------------|
| `return res.status(404).json({ error: 'Not found' })` | `throw ApiError.notFound('Not found')` |
| `return res.status(400).json({ error: 'Bad request' })` | `throw ApiError.badRequest('Bad request')` |
| `return res.status(409).json({ error: 'Conflict' })` | `throw ApiError.conflict('Conflict')` |
| `return res.status(503).json({ error: 'Service unavailable' })` | `throw ApiError.serviceUnavailable('Service unavailable')` |
| `return res.status(500).json({ error: 'Internal error' })` | `throw ApiError.internal('Internal error')` |

## Implementation Strategy

### Quick Manual Approach
For each file:
1. Add imports at top of file
2. Find all `async (req` patterns
3. Wrap with `asyncHandler(async (req`
4. Remove try-catch blocks
5. Convert error responses to ApiError throws

### Automated Approach (Node Script)
Created `update-async-handlers.js` script that can:
- Automatically add required imports
- Find and wrap async handlers
- Remove try-catch blocks
- Convert error responses

## Benefits of AsyncHandler

1. **Consistent Error Handling**: All errors are caught and handled uniformly
2. **Cleaner Code**: Removes repetitive try-catch blocks
3. **Better Stack Traces**: Preserves async stack traces for debugging
4. **Centralized Error Processing**: All errors flow through error middleware
5. **Type Safety**: Works seamlessly with TypeScript

## Special Cases to Watch

1. **Routes with specific error handling logic**: Keep try-catch if there's custom error processing
2. **Routes that need to handle Supabase errors specially**: May need to keep some error checking
3. **File upload routes**: May have special error handling requirements
4. **WebSocket/SSE routes**: Different error handling pattern

## Next Steps

1. Complete remaining routes in locations.ts (38 routes)
2. Update all other route files systematically
3. Test each endpoint after updates
4. Verify error responses are consistent
5. Update API documentation if error formats changed

## Verification Commands

```bash
# Check for remaining try-catch blocks in routes
grep -r "app\.\(get\|post\|put\|delete\|patch\).*async.*try {" server/routes/

# Count async handlers without asyncHandler
grep -r "app\.\(get\|post\|put\|delete\|patch\).*async (req" server/routes/ | grep -v asyncHandler | wc -l

# Verify asyncHandler imports
grep -l "asyncHandler" server/routes/*.ts
```

## Summary

- **Total Routes Identified**: ~200+ across all files
- **Routes Completed**: 43 (trips.ts: 42, locations.ts: 1)
- **Routes Remaining**: ~157+
- **Files Completed**: 1 of 12
- **Estimated Completion**: 20% of Phase 6

The asyncHandler middleware standardization is critical for consistent error handling across the entire API. This ensures all errors are properly caught, logged, and returned to clients in a uniform format.