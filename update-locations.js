const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'server/routes/locations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Pattern to match async route handlers with try-catch blocks
const routePattern = /app\.(get|post|put|patch|delete)\((.*?),\s*async\s+\((req[^)]*)\)\s*=>\s*\{(\s*try\s*\{[\s\S]*?\}\s*catch[^}]+\}[\s\S]*?)\}\)/g;

// Replace with asyncHandler wrapped version
content = content.replace(routePattern, (match, method, middlewares, params, body) => {
  // Check if this route already uses asyncHandler
  if (middlewares.includes('asyncHandler')) {
    return match;
  }

  // Remove try-catch blocks and transform the body
  let cleanBody = body;

  // Remove the outer try-catch wrapper
  cleanBody = cleanBody.replace(/^\s*try\s*\{([\s\S]*)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*\}$/m, '$1');

  // Replace return res.status(...).json(...) with throw ApiError patterns where appropriate
  cleanBody = cleanBody.replace(/return\s+res\.status\(404\)\.json\(\{[^}]*error:\s*["']([^"']+)["'][^}]*\}\)/g, 'throw ApiError.notFound("$1")');
  cleanBody = cleanBody.replace(/return\s+res\.status\(400\)\.json\(\{[^}]*error:\s*["']([^"']+)["'][^}]*\}\)/g, 'throw ApiError.badRequest("$1")');
  cleanBody = cleanBody.replace(/return\s+res\.status\(409\)\.json\(\{[^}]*error:\s*["']([^"']+)["'][^}]*\}\)/g, 'throw ApiError.conflict("$1")');
  cleanBody = cleanBody.replace(/return\s+res\.status\(503\)\.json\(\{[^}]*error:\s*["']([^"']+)["'][^}]*\}\)/g, 'throw ApiError.serviceUnavailable("$1")');

  // For 500 errors with logging, convert to throw ApiError.internal
  cleanBody = cleanBody.replace(/logger\.error\(([^;]+);\s*return\s+res\.status\(500\)\.json\(\{[^}]*error:\s*["']([^"']+)["'][^}]*\}\)/g,
    'logger.error($1;\n      throw ApiError.internal("$2")');

  // Build the new route with asyncHandler
  return `app.${method}(${middlewares}, asyncHandler(async (${params}) => {${cleanBody}}))`;
});

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated locations.ts with asyncHandler');