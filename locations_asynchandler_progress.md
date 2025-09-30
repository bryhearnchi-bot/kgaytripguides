# AsyncHandler Migration Progress for locations.ts

## Current Status
- **Total routes**: 40
- **Completed**: 14 routes have been wrapped with asyncHandler
- **Remaining**: 26 routes still need to be updated

## Completed Routes (with asyncHandler):
1. GET /api/locations/stats ✓
2. GET /api/locations ✓
3. GET /api/locations/:id ✓
4. POST /api/locations ✓
5. PUT /api/locations/:id ✓
6. DELETE /api/locations/:id ✓
7. GET /api/ships/stats ✓
8. GET /api/ships ✓
9. GET /api/ships/:id ✓
10. POST /api/ships ✓
11. PUT /api/ships/:id ✓
12. DELETE /api/ships/:id ✓
13. GET /api/amenities/stats ✓
14. (partial updates in amenities section)

## Remaining Routes to Update:
### Amenities (5 routes)
- GET /api/amenities
- GET /api/amenities/:id
- POST /api/amenities
- PUT /api/amenities/:id
- DELETE /api/amenities/:id

### Venue Types (1 route)
- GET /api/venue-types

### Venues (6 routes)
- GET /api/venues/stats
- GET /api/venues
- GET /api/venues/:id
- POST /api/venues
- PUT /api/venues/:id
- DELETE /api/venues/:id

### Resorts (6 routes)
- GET /api/resorts/stats
- GET /api/resorts
- GET /api/resorts/:id
- POST /api/resorts
- PUT /api/resorts/:id
- DELETE /api/resorts/:id

### Ship Relationships (4 routes)
- GET /api/ships/:id/amenities
- PUT /api/ships/:id/amenities
- GET /api/ships/:id/venues
- PUT /api/ships/:id/venues

### Resort Relationships (4 routes)
- GET /api/resorts/:id/amenities
- PUT /api/resorts/:id/amenities
- GET /api/resorts/:id/venues
- PUT /api/resorts/:id/venues

## Pattern for Each Update:
1. Wrap route handler with `asyncHandler(async (req, res) => { ... }))`
2. Remove try-catch blocks
3. Replace `return res.status(XXX).json({error: '...'})` with:
   - `throw ApiError.internal('...')` for 500 errors
   - `throw ApiError.notFound('...')` for 404 errors
   - `throw ApiError.badRequest('...')` for 400 errors
   - `throw ApiError.conflict('...')` for 409 errors
   - `throw ApiError.serviceUnavailable('...', '...')` for 503 errors
4. Change closing `});` to `}));`

## Files Status:
- **Original**: `/Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations.ts` (current working file)
- **Backup**: `/Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations_backup.ts` (safe backup)

## Next Steps:
Due to the complexity and the large number of nested try-catch blocks, manual updates are required for the remaining 26 routes to ensure:
1. Proper asyncHandler wrapping
2. Complete removal of try-catch blocks
3. Correct error throwing with ApiError
4. Proper closing parentheses

## Command to verify completion:
```bash
# Should show 40 when complete
grep -c "asyncHandler" /Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations.ts

# Should show 0 when complete (no try-catch blocks)
grep -c "} catch" /Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations.ts
```