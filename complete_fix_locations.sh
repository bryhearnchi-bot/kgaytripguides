#!/bin/bash

# Copy the backup to work on
cp /Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations_backup.ts /Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations_clean.ts

# Define the file to work on
FILE="/Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations_clean.ts"

# List of all routes that need updating (from line 614 onwards)
ROUTES=(
  "/api/amenities"
  "/api/amenities/stats"
  "/api/amenities/:id"
  "/api/venue-types"
  "/api/venues"
  "/api/venues/stats"
  "/api/venues/:id"
  "/api/resorts"
  "/api/resorts/stats"
  "/api/resorts/:id"
  "/api/ships/:id/amenities"
  "/api/ships/:id/venues"
  "/api/resorts/:id/amenities"
  "/api/resorts/:id/venues"
)

# Step 1: Add asyncHandler to all async routes
for route in "${ROUTES[@]}"; do
  # For GET routes
  sed -i '' "s|app.get(\"$route\", async (|app.get(\"$route\", asyncHandler(async (|g" "$FILE"
  sed -i '' "s|app.get('$route', async (|app.get('$route', asyncHandler(async (|g" "$FILE"

  # For POST routes with middleware
  sed -i '' "s|app.post(\"$route\", requireContentEditor, auditLogger([^)]*), async (|app.post(\"$route\", requireContentEditor, auditLogger(\1), asyncHandler(async (|g" "$FILE"

  # For PUT routes with middleware
  sed -i '' "s|app.put(\"$route\", requireContentEditor, validateParams([^)]*), auditLogger([^)]*), async (|app.put(\"$route\", requireContentEditor, validateParams(\1), auditLogger(\2), asyncHandler(async (|g" "$FILE"
  sed -i '' "s|app.put(\"$route\", requireContentEditor, auditLogger([^)]*), async (|app.put(\"$route\", requireContentEditor, auditLogger(\1), asyncHandler(async (|g" "$FILE"

  # For DELETE routes with middleware
  sed -i '' "s|app.delete(\"$route\", requireContentEditor, auditLogger([^)]*), async (|app.delete(\"$route\", requireContentEditor, auditLogger(\1), asyncHandler(async (|g" "$FILE"
done

# Step 2: Fix closing parentheses for asyncHandler
sed -i '' 's|});$|}));|g' "$FILE"

# Step 3: Convert error responses to ApiError throws
sed -i '' "s|return res.status(500).json({ error: '\([^']*\)' });|throw ApiError.internal('\1');|g" "$FILE"
sed -i '' 's|return res.status(404).json({ error: "\([^"]*\)" });|throw ApiError.notFound("\1");|g' "$FILE"
sed -i '' "s|return res.status(404).json({ error: '\([^']*\)' });|throw ApiError.notFound('\1');|g" "$FILE"
sed -i '' "s|return res.status(400).json({ error: '\([^']*\)' });|throw ApiError.badRequest('\1');|g" "$FILE"
sed -i '' "s|return res.status(409).json({ error: '\([^']*\)' });|throw ApiError.conflict('\1');|g" "$FILE"

echo "Conversion complete! Check locations_clean.ts"
echo "Number of asyncHandler calls: $(grep -c "asyncHandler" "$FILE")"
echo "Number of remaining try-catch blocks: $(grep -c "} catch" "$FILE")"