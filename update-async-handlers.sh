#!/bin/bash

# Function to update a single file
update_file() {
    local file=$1
    echo "Processing $file..."

    # Check if asyncHandler is already imported
    if ! grep -q "import.*asyncHandler" "$file"; then
        # Add asyncHandler import after other imports from middleware
        sed -i '' '/import.*from "..\/middleware/a\
import { asyncHandler } from "../middleware/errorHandler";' "$file"

        # Also add ApiError import if not present
        if ! grep -q "import.*ApiError" "$file"; then
            sed -i '' '/import.*asyncHandler/a\
import { ApiError } from "../utils/ApiError";' "$file"
        fi
    fi

    # Create temporary file for processing
    cp "$file" "$file.tmp"

    # Use node to process the file
    node -e "
    const fs = require('fs');
    let content = fs.readFileSync('$file.tmp', 'utf8');

    // Pattern to match async route handlers with try-catch
    const pattern = /app\.(get|post|put|patch|delete)\((.*?),\s*async\s+\((req[^)]*)\)\s*=>\s*\{\s*try\s*\{/g;

    // Find all matches and their positions
    let matches = [];
    let match;
    while ((match = pattern.exec(content)) !== null) {
        matches.push({
            start: match.index,
            method: match[1],
            middlewares: match[2],
            params: match[3]
        });
    }

    // Process from end to beginning to maintain positions
    for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i];

        // Find the complete route handler
        let braceCount = 0;
        let inHandler = false;
        let endPos = m.start;

        for (let j = m.start; j < content.length; j++) {
            if (content[j] === '{') {
                braceCount++;
                inHandler = true;
            } else if (content[j] === '}') {
                braceCount--;
                if (inHandler && braceCount === 0) {
                    // Found the end of the handler
                    endPos = j + 2; // Include ')' after '}'
                    break;
                }
            }
        }

        // Extract the handler
        const handler = content.substring(m.start, endPos);

        // Check if already wrapped with asyncHandler
        if (handler.includes('asyncHandler')) continue;

        // Transform the handler
        let newHandler = handler;

        // Replace the async pattern with asyncHandler
        newHandler = newHandler.replace(
            /app\.(\w+)\((.*?),\s*async\s+\((req[^)]*)\)\s*=>\s*\{/,
            'app.$1($2, asyncHandler(async ($3) => {'
        );

        // Find and remove the try-catch wrapper
        newHandler = newHandler.replace(
            /\{\s*try\s*\{([\s\S]*?)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\}\)/,
            function(match, tryBody) {
                // Clean up the try body
                let cleaned = tryBody;

                // Replace error responses with ApiError throws
                cleaned = cleaned.replace(
                    /return\s+res\.status\(404\)\.json\(\{\s*error:\s*[\"']([^\"']+)[\"']\s*\}\)/g,
                    'throw ApiError.notFound(\"$1\")'
                );
                cleaned = cleaned.replace(
                    /return\s+res\.status\(400\)\.json\(\{\s*error:\s*[\"']([^\"']+)[\"']\s*\}\)/g,
                    'throw ApiError.badRequest(\"$1\")'
                );
                cleaned = cleaned.replace(
                    /return\s+res\.status\(409\)\.json\(\{\s*error:\s*[\"']([^\"']+)[\"']\s*\}\)/g,
                    'throw ApiError.conflict(\"$1\")'
                );
                cleaned = cleaned.replace(
                    /return\s+res\.status\(503\)\.json\(\{\s*error:\s*[\"']([^\"']+)[\"']\s*\}\)/g,
                    'throw ApiError.serviceUnavailable(\"$1\")'
                );

                // For 500 errors after logging
                cleaned = cleaned.replace(
                    /return\s+res\.status\(500\)\.json\(\{\s*error:\s*[\"']([^\"']+)[\"']\s*\}\)/g,
                    'throw ApiError.internal(\"$1\")'
                );

                return '{' + cleaned + '}))';
            }
        );

        // Replace in content
        content = content.substring(0, m.start) + newHandler + content.substring(endPos);
    }

    fs.writeFileSync('$file', content, 'utf8');
    " 2>/dev/null

    # Clean up temp file
    rm -f "$file.tmp"

    echo "Updated $file"
}

# Files to update
FILES=(
    "server/routes/locations.ts"
    "server/routes/media.ts"
    "server/routes/talent-categories.ts"
    "server/routes/party-themes.ts"
    "server/routes/trip-info-sections.ts"
    "server/routes/admin-users-routes.ts"
    "server/routes/invitation-routes.ts"
    "server/routes/admin-lookup-tables-routes.ts"
    "server/routes/performance.ts"
    "server/routes/public.ts"
    "server/routes/admin-sequences.ts"
)

# Update each file
for file in "${FILES[@]}"; do
    if [ -f "/Users/bryan/develop/projects/kgay-travel-guides/$file" ]; then
        update_file "/Users/bryan/develop/projects/kgay-travel-guides/$file"
    else
        echo "File not found: $file"
    fi
done

echo "All files updated!"