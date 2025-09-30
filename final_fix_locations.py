#!/usr/bin/env python3
import re

# Read the current file
with open('/Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations.ts', 'r') as f:
    content = f.read()

# Define all the route patterns to update with their line numbers
routes_to_update = [
    # (line_num, route_signature)
    (614, 'app.get("/api/amenities", async (req: AuthenticatedRequest, res: Response) =>'),
    (669, 'app.get("/api/amenities/:id", async (req: AuthenticatedRequest, res: Response) =>'),
    (714, 'app.post("/api/amenities", requireContentEditor, auditLogger(\'admin.amenity.create\'), async (req: AuthenticatedRequest, res) =>'),
    (775, 'app.put("/api/amenities/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger(\'admin.amenity.update\'), async (req: AuthenticatedRequest, res) =>'),
    (836, 'app.delete("/api/amenities/:id", requireContentEditor, auditLogger(\'admin.amenity.delete\'), async (req: AuthenticatedRequest, res) =>'),
    (873, 'app.get("/api/venue-types", async (req: AuthenticatedRequest, res: Response) =>'),
    (911, 'app.get("/api/venues/stats", async (req: AuthenticatedRequest, res: Response) =>'),
    (949, 'app.get("/api/venues", async (req: AuthenticatedRequest, res: Response) =>'),
    (1018, 'app.get("/api/venues/:id", async (req: AuthenticatedRequest, res: Response) =>'),
    (1073, 'app.post("/api/venues", requireContentEditor, auditLogger(\'admin.venue.create\'), async (req: AuthenticatedRequest, res) =>'),
    (1148, 'app.put("/api/venues/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger(\'admin.venue.update\'), async (req: AuthenticatedRequest, res) =>'),
    (1220, 'app.delete("/api/venues/:id", requireContentEditor, auditLogger(\'admin.venue.delete\'), async (req: AuthenticatedRequest, res) =>'),
    (1257, 'app.get("/api/resorts/stats", async (req: AuthenticatedRequest, res: Response) =>'),
    (1291, 'app.get("/api/resorts", async (req: AuthenticatedRequest, res: Response) =>'),
    (1361, 'app.get("/api/resorts/:id", async (req: AuthenticatedRequest, res: Response) =>'),
    (1413, 'app.post("/api/resorts", requireContentEditor, auditLogger(\'admin.resort.create\'), async (req: AuthenticatedRequest, res) =>'),
    (1495, 'app.put("/api/resorts/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger(\'admin.resort.update\'), async (req: AuthenticatedRequest, res) =>'),
    (1584, 'app.delete("/api/resorts/:id", requireContentEditor, auditLogger(\'admin.resort.delete\'), async (req: AuthenticatedRequest, res) =>'),
    (1621, 'app.get("/api/ships/:id/amenities", async (req: AuthenticatedRequest, res: Response) =>'),
    (1668, 'app.put("/api/ships/:id/amenities", requireContentEditor, auditLogger(\'admin.ship.amenities.update\'), async (req: AuthenticatedRequest, res) =>'),
    (1727, 'app.get("/api/ships/:id/venues", async (req: AuthenticatedRequest, res: Response) =>'),
    (1778, 'app.put("/api/ships/:id/venues", requireContentEditor, auditLogger(\'admin.ship.venues.update\'), async (req: AuthenticatedRequest, res) =>'),
    (1839, 'app.get("/api/resorts/:id/amenities", async (req: AuthenticatedRequest, res: Response) =>'),
    (1886, 'app.put("/api/resorts/:id/amenities", requireContentEditor, auditLogger(\'admin.resort.amenities.update\'), async (req: AuthenticatedRequest, res) =>'),
    (1945, 'app.get("/api/resorts/:id/venues", async (req: AuthenticatedRequest, res: Response) =>'),
    (1996, 'app.put("/api/resorts/:id/venues", requireContentEditor, auditLogger(\'admin.resort.venues.update\'), async (req: AuthenticatedRequest, res) =>'),
]

# Apply replacements one by one
for line_num, route_pattern in routes_to_update:
    # Add asyncHandler wrapper
    content = content.replace(
        route_pattern.replace(' =>', ' => {'),
        route_pattern.replace(' async (', ' asyncHandler(async (').replace(' =>', ' => {')
    )

# Now replace try-catch patterns with direct throw statements
# This needs to be done carefully to avoid breaking the code

# Replace error returns with throws
patterns = [
    # Simple error returns
    (r'return res\.status\(500\)\.json\(\{ error: \'([^\']+)\' \}\);', r"throw ApiError.internal('\1');"),
    (r'return res\.status\(404\)\.json\(\{ error: "([^"]+)" \}\);', r'throw ApiError.notFound("\1");'),
    (r'return res\.status\(404\)\.json\(\{ error: \'([^\']+)\' \}\);', r"throw ApiError.notFound('\1');"),
    (r'return res\.status\(400\)\.json\(\{ error: \'([^\']+)\' \}\);', r"throw ApiError.badRequest('\1');"),
    (r'return res\.status\(409\)\.json\(\{ error: \'([^\']+)\' \}\);', r"throw ApiError.conflict('\1');"),
    (r'return res\.status\(503\)\.json\(\{\s*error: \'([^\']+)\',\s*details: \'([^\']+)\'\s*\}\);',
     r"throw ApiError.serviceUnavailable('\1', '\2');"),
]

for pattern, replacement in patterns:
    content = re.sub(pattern, replacement, content)

# Fix closing parentheses for async handlers
content = re.sub(r'\}\);(\s*//\s*===)', r'}));\1', content)
content = re.sub(r'\}\);(\s*\})', r'}));\1', content)

# Write the result
with open('/Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations_final.ts', 'w') as f:
    f.write(content)

print("Created locations_final.ts with all updates applied")
print("Please review before replacing the original")