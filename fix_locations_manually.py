#!/usr/bin/env python3
import re

# Read the original file (not the updated one)
with open('/Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations.ts', 'r') as f:
    lines = f.readlines()

# Process line by line, tracking when we're inside asyncHandler routes
output = []
i = 0
while i < len(lines):
    line = lines[i]

    # Check if this is a route that needs updating (starting from amenities section)
    if i >= 593:  # Around line 594 is where amenities start
        # Routes that need asyncHandler wrapping
        if ('app.get("/api/amenities' in line or
            'app.post("/api/amenities' in line or
            'app.put("/api/amenities' in line or
            'app.delete("/api/amenities' in line or
            'app.get("/api/venue' in line or
            'app.post("/api/venue' in line or
            'app.put("/api/venue' in line or
            'app.delete("/api/venue' in line or
            'app.get("/api/resorts' in line or
            'app.post("/api/resorts' in line or
            'app.put("/api/resorts' in line or
            'app.delete("/api/resorts' in line or
            'app.get("/api/ships/:id/amenities' in line or
            'app.put("/api/ships/:id/amenities' in line or
            'app.get("/api/ships/:id/venues' in line or
            'app.put("/api/ships/:id/venues' in line or
            'app.get("/api/resorts/:id/amenities' in line or
            'app.put("/api/resorts/:id/amenities' in line or
            'app.get("/api/resorts/:id/venues' in line or
            'app.put("/api/resorts/:id/venues' in line):

            # Add asyncHandler if not already there
            if 'asyncHandler' not in line and 'async (' in line:
                line = line.replace('async (', 'asyncHandler(async (')

            output.append(line)
            i += 1

            # Find the matching try block and remove it
            brace_count = 0
            found_try = False
            route_body = []

            while i < len(lines):
                current = lines[i]

                # Count braces to track nesting
                brace_count += current.count('{') - current.count('}')

                # Check for try block
                if not found_try and 'try {' in current:
                    found_try = True
                    i += 1
                    continue

                # Skip the catch block
                if found_try and '} catch' in current:
                    # Skip until we find the closing brace of catch
                    i += 1
                    catch_braces = 1
                    while i < len(lines) and catch_braces > 0:
                        catch_line = lines[i]
                        catch_braces += catch_line.count('{') - catch_line.count('}')
                        i += 1
                    # Adjust for the closing of the route
                    if i < len(lines) and '});' in lines[i]:
                        output.append('  }));\n')
                        i += 1
                    continue

                # Handle normal lines
                if found_try:
                    # Replace return status responses with throw ApiError
                    if 'return res.status(500).json({ error:' in current:
                        match = re.search(r"error:\s*['\"]([^'\"]*)['\"]", current)
                        if match:
                            error_msg = match.group(1)
                            current = f"      throw ApiError.internal('{error_msg}');\n"
                    elif 'return res.status(404).json({ error:' in current:
                        match = re.search(r"error:\s*['\"]([^'\"]*)['\"]", current)
                        if match:
                            error_msg = match.group(1)
                            current = f"      throw ApiError.notFound('{error_msg}');\n"
                    elif 'return res.status(400).json({ error:' in current:
                        match = re.search(r"error:\s*['\"]([^'\"]*)['\"]", current)
                        if match:
                            error_msg = match.group(1)
                            current = f"      throw ApiError.badRequest('{error_msg}');\n"
                    elif 'return res.status(409).json({ error:' in current:
                        match = re.search(r"error:\s*['\"]([^'\"]*)['\"]", current)
                        if match:
                            error_msg = match.group(1)
                            current = f"      throw ApiError.conflict('{error_msg}');\n"
                    elif 'return res.status(503).json({' in current:
                        current = "      throw ApiError.serviceUnavailable('Admin service not configured', 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable');\n"

                    # Adjust closing
                    if '  });' in current and brace_count == 0:
                        current = '  }));\n'

                output.append(current)

                # Check if route is complete
                if brace_count == 0 and ('});' in current or '}));' in current):
                    i += 1
                    break

                i += 1
        else:
            output.append(line)
            i += 1
    else:
        output.append(line)
        i += 1

# Write the properly fixed content
with open('/Users/bryan/develop/projects/kgay-travel-guides/server/routes/locations_fixed.ts', 'w') as f:
    f.writelines(output)

print("File fixed and saved as locations_fixed.ts")