const fs = require('fs');
const path = require('path');

// Files to update
const FILES = [
    'server/routes/locations.ts',
    'server/routes/media.ts',
    'server/routes/talent-categories.ts',
    'server/routes/party-themes.ts',
    'server/routes/trip-info-sections.ts',
    'server/routes/admin-users-routes.ts',
    'server/routes/invitation-routes.ts',
    'server/routes/admin-lookup-tables-routes.ts',
    'server/routes/performance.ts',
    'server/routes/public.ts',
    'server/routes/admin-sequences.ts'
];

function updateFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return { updated: false, count: 0 };
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updateCount = 0;

    // Check if asyncHandler is already imported
    if (!content.includes('import { asyncHandler }')) {
        // Add asyncHandler import
        const importPattern = /import.*from\s+["']\.\.\/middleware\/[^"']+["'];?/;
        const importMatch = content.match(importPattern);
        if (importMatch) {
            const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
            content = content.substring(0, lastImportIndex) +
                      '\nimport { asyncHandler } from "../middleware/errorHandler";' +
                      content.substring(lastImportIndex);
        }
    }

    // Check if ApiError is already imported
    if (!content.includes('import { ApiError }')) {
        const asyncHandlerImport = content.indexOf('import { asyncHandler }');
        if (asyncHandlerImport !== -1) {
            const lineEnd = content.indexOf('\n', asyncHandlerImport);
            content = content.substring(0, lineEnd) +
                      '\nimport { ApiError } from "../utils/ApiError";' +
                      content.substring(lineEnd);
        }
    }

    // Find all async route handlers with try-catch
    const routeRegex = /app\.(get|post|put|patch|delete)\((.*?),\s*async\s+\((req[^)]*)\)\s*=>\s*\{[\s\S]*?\}\s*\)\s*;/g;

    const routes = [];
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
        routes.push({
            fullMatch: match[0],
            method: match[1],
            middlewares: match[2],
            params: match[3],
            start: match.index,
            end: match.index + match[0].length
        });
    }

    // Process routes in reverse order to maintain positions
    for (let i = routes.length - 1; i >= 0; i--) {
        const route = routes[i];

        // Check if already wrapped with asyncHandler
        if (route.fullMatch.includes('asyncHandler')) continue;

        // Check if it has a try-catch block
        if (!route.fullMatch.includes('try {')) continue;

        let updatedRoute = route.fullMatch;

        // Wrap with asyncHandler
        updatedRoute = updatedRoute.replace(
            /async\s+\((req[^)]*)\)\s*=>\s*\{/,
            'asyncHandler(async ($1) => {'
        );

        // Remove try-catch wrapper and update error handling
        updatedRoute = updatedRoute.replace(
            /\{\s*try\s*\{([\s\S]*?)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\}/g,
            function(match, tryBody) {
                // Clean up the try body
                let cleaned = '{' + tryBody + '}';

                // Replace error responses with ApiError throws
                cleaned = cleaned.replace(
                    /return\s+res\.status\(404\)\.json\(\{\s*error:\s*["']([^"']+)["']\s*\}\)/g,
                    'throw ApiError.notFound("$1")'
                );
                cleaned = cleaned.replace(
                    /return\s+res\.status\(400\)\.json\(\{\s*error:\s*["']([^"']+)["']\s*\}\)/g,
                    'throw ApiError.badRequest("$1")'
                );
                cleaned = cleaned.replace(
                    /return\s+res\.status\(409\)\.json\(\{\s*error:\s*["']([^"']+)["']\s*\}\)/g,
                    'throw ApiError.conflict("$1")'
                );
                cleaned = cleaned.replace(
                    /return\s+res\.status\(503\)\.json\(\{\s*error:\s*["']([^"']+)["']\s*\}\)/g,
                    'throw ApiError.serviceUnavailable("$1")'
                );

                // Handle 500 errors - keep logging but throw
                cleaned = cleaned.replace(
                    /logger\.error\(([^;]+);\s*return\s+res\.status\(500\)\.json\(\{\s*error:\s*["']([^"']+)["']\s*\}\)/g,
                    'logger.error($1;\n      throw ApiError.internal("$2")'
                );

                // Handle standalone 500 errors
                cleaned = cleaned.replace(
                    /return\s+res\.status\(500\)\.json\(\{\s*error:\s*["']([^"']+)["']\s*\}\)/g,
                    'throw ApiError.internal("$1")'
                );

                return cleaned;
            }
        );

        // Add closing parenthesis for asyncHandler
        updatedRoute = updatedRoute.replace(/\}\s*\)\s*;$/, '}));');

        // Replace in content
        content = content.substring(0, route.start) + updatedRoute + content.substring(route.end);
        updateCount++;
    }

    if (updateCount > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated ${path.basename(filePath)}: ${updateCount} routes wrapped with asyncHandler`);
        return { updated: true, count: updateCount };
    } else {
        console.log(`✓ ${path.basename(filePath)}: No updates needed (already using asyncHandler or no try-catch blocks)`);
        return { updated: false, count: 0 };
    }
}

// Main execution
console.log('Starting async handler updates...\n');

let totalUpdated = 0;
let filesUpdated = 0;

FILES.forEach(file => {
    const filePath = path.join(__dirname, file);
    const result = updateFile(filePath);
    if (result.updated) {
        totalUpdated += result.count;
        filesUpdated++;
    }
});

console.log(`\n✅ Complete! Updated ${totalUpdated} routes across ${filesUpdated} files.`);