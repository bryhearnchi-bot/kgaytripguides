#!/usr/bin/env python3
import re

# Read the file
with open('/Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations.ts', 'r') as f:
    content = f.read()

# List of route patterns to update (starting from line 594 onwards)
routes_to_update = [
    # Amenities endpoints
    ('app.get("/api/amenities/stats", async ', 'app.get("/api/amenities/stats", asyncHandler(async '),
    ('app.get("/api/amenities", async ', 'app.get("/api/amenities", asyncHandler(async '),
    ('app.get("/api/amenities/:id", async ', 'app.get("/api/amenities/:id", asyncHandler(async '),
    ('app.post("/api/amenities", requireContentEditor, auditLogger(\'admin.amenity.create\'), async ',
     'app.post("/api/amenities", requireContentEditor, auditLogger(\'admin.amenity.create\'), asyncHandler(async '),
    ('app.put("/api/amenities/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger(\'admin.amenity.update\'), async ',
     'app.put("/api/amenities/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger(\'admin.amenity.update\'), asyncHandler(async '),
    ('app.delete("/api/amenities/:id", requireContentEditor, auditLogger(\'admin.amenity.delete\'), async ',
     'app.delete("/api/amenities/:id", requireContentEditor, auditLogger(\'admin.amenity.delete\'), asyncHandler(async '),

    # Venue types endpoints
    ('app.get("/api/venue-types", async ', 'app.get("/api/venue-types", asyncHandler(async '),

    # Venues endpoints
    ('app.get("/api/venues/stats", async ', 'app.get("/api/venues/stats", asyncHandler(async '),
    ('app.get("/api/venues", async ', 'app.get("/api/venues", asyncHandler(async '),
    ('app.get("/api/venues/:id", async ', 'app.get("/api/venues/:id", asyncHandler(async '),
    ('app.post("/api/venues", requireContentEditor, auditLogger(\'admin.venue.create\'), async ',
     'app.post("/api/venues", requireContentEditor, auditLogger(\'admin.venue.create\'), asyncHandler(async '),
    ('app.put("/api/venues/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger(\'admin.venue.update\'), async ',
     'app.put("/api/venues/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger(\'admin.venue.update\'), asyncHandler(async '),
    ('app.delete("/api/venues/:id", requireContentEditor, auditLogger(\'admin.venue.delete\'), async ',
     'app.delete("/api/venues/:id", requireContentEditor, auditLogger(\'admin.venue.delete\'), asyncHandler(async '),

    # Resorts endpoints
    ('app.get("/api/resorts/stats", async ', 'app.get("/api/resorts/stats", asyncHandler(async '),
    ('app.get("/api/resorts", async ', 'app.get("/api/resorts", asyncHandler(async '),
    ('app.get("/api/resorts/:id", async ', 'app.get("/api/resorts/:id", asyncHandler(async '),
    ('app.post("/api/resorts", requireContentEditor, auditLogger(\'admin.resort.create\'), async ',
     'app.post("/api/resorts", requireContentEditor, auditLogger(\'admin.resort.create\'), asyncHandler(async '),
    ('app.put("/api/resorts/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger(\'admin.resort.update\'), async ',
     'app.put("/api/resorts/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger(\'admin.resort.update\'), asyncHandler(async '),
    ('app.delete("/api/resorts/:id", requireContentEditor, auditLogger(\'admin.resort.delete\'), async ',
     'app.delete("/api/resorts/:id", requireContentEditor, auditLogger(\'admin.resort.delete\'), asyncHandler(async '),

    # Ship relationship endpoints
    ('app.get("/api/ships/:id/amenities", async ', 'app.get("/api/ships/:id/amenities", asyncHandler(async '),
    ('app.put("/api/ships/:id/amenities", requireContentEditor, auditLogger(\'admin.ship.amenities.update\'), async ',
     'app.put("/api/ships/:id/amenities", requireContentEditor, auditLogger(\'admin.ship.amenities.update\'), asyncHandler(async '),
    ('app.get("/api/ships/:id/venues", async ', 'app.get("/api/ships/:id/venues", asyncHandler(async '),
    ('app.put("/api/ships/:id/venues", requireContentEditor, auditLogger(\'admin.ship.venues.update\'), async ',
     'app.put("/api/ships/:id/venues", requireContentEditor, auditLogger(\'admin.ship.venues.update\'), asyncHandler(async '),

    # Resort relationship endpoints
    ('app.get("/api/resorts/:id/amenities", async ', 'app.get("/api/resorts/:id/amenities", asyncHandler(async '),
    ('app.put("/api/resorts/:id/amenities", requireContentEditor, auditLogger(\'admin.resort.amenities.update\'), async ',
     'app.put("/api/resorts/:id/amenities", requireContentEditor, auditLogger(\'admin.resort.amenities.update\'), asyncHandler(async '),
    ('app.get("/api/resorts/:id/venues", async ', 'app.get("/api/resorts/:id/venues", asyncHandler(async '),
    ('app.put("/api/resorts/:id/venues", requireContentEditor, auditLogger(\'admin.resort.venues.update\'), async ',
     'app.put("/api/resorts/:id/venues", requireContentEditor, auditLogger(\'admin.resort.venues.update\'), asyncHandler(async '),
]

# Apply replacements
for old, new in routes_to_update:
    content = content.replace(old, new)

# Replace try-catch blocks with throw ApiError patterns
patterns = [
    # Replace return res.status(500).json({ error: 'Failed to ... with throw ApiError.internal
    (r'return res\.status\(500\)\.json\(\{ error: [\'"]([^\'"]*)[\'"]\s*\}\)', r'throw ApiError.internal(\'\1\')'),

    # Replace return res.status(404).json({ error: ... with throw ApiError.notFound
    (r'return res\.status\(404\)\.json\(\{ error: [\'"]([^\'"]*)[\'"]\s*\}\)', r'throw ApiError.notFound(\'\1\')'),

    # Replace return res.status(400).json({ error: ... with throw ApiError.badRequest
    (r'return res\.status\(400\)\.json\(\{ error: [\'"]([^\'"]*)[\'"]\s*\}\)', r'throw ApiError.badRequest(\'\1\')'),

    # Replace return res.status(409).json({ error: ... with throw ApiError.conflict
    (r'return res\.status\(409\)\.json\(\{ error: [\'"]([^\'"]*)[\'"]\s*\}\)', r'throw ApiError.conflict(\'\1\')'),

    # Replace return res.status(503).json({ error: ..., details: ... with throw ApiError.serviceUnavailable
    (r'return res\.status\(503\)\.json\(\{\s*error: [\'"]([^\'"]*)[\'"]\s*,\s*details: [\'"]([^\'"]*)[\'"]\s*\}\)',
     r'throw ApiError.serviceUnavailable(\'\1\', \'\2\')'),
]

for pattern, replacement in patterns:
    content = re.sub(pattern, replacement, content)

# Update closing parentheses for async handlers
content = re.sub(r'\}\);(\s*//)', r'}));\\1', content)

# Write the updated content
with open('/Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations_updated.ts', 'w') as f:
    f.write(content)

print("File updated successfully! Created: locations_updated.ts")
print("Please review the changes before replacing the original file.")