#!/usr/bin/env node

/**
 * Script to apply React Query optimizations to admin pages
 * This automates the repetitive task of updating all admin pages with consistent patterns
 */

const fs = require('fs');
const path = require('path');

const adminPagesDir = '/Users/bryan/develop/projects/kgay-travel-guides/client/src/pages/admin';

// List of admin page files to optimize
const adminPages = [
  'locations.tsx',
  'users.tsx',
  'trip-info-sections.tsx',
  'trips-management.tsx',
  'profile.tsx'
];

// Import statements to add
const importsToAdd = `import { useAdminQueryOptions } from '@/hooks/use-admin-prefetch';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';`;

function optimizeAdminPage(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already optimized
  if (content.includes('useAdminQueryOptions')) {
    console.log(`${path.basename(filePath)} already optimized`);
    return;
  }

  console.log(`Optimizing ${path.basename(filePath)}...`);

  // 1. Add imports after the last existing import
  const lastImportMatch = content.match(/import .* from .*;\n(?!import)/);
  if (lastImportMatch) {
    const insertPoint = lastImportMatch.index + lastImportMatch[0].length;
    content = content.slice(0, insertPoint) + importsToAdd + '\n' + content.slice(insertPoint);
  }

  // 2. Add adminQueryOptions hook
  const functionMatch = content.match(/export default function \w+\(\) \{\n(\s+)/);
  if (functionMatch) {
    const indent = functionMatch[1];
    const insertPoint = functionMatch.index + functionMatch[0].length;
    const hookLine = `${indent}const adminQueryOptions = useAdminQueryOptions();\n`;
    content = content.slice(0, insertPoint) + hookLine + content.slice(insertPoint);
  }

  // 3. Update useQuery calls to include optimization options
  content = content.replace(
    /const { data: (\w+) = \[\], isLoading } = useQuery<[^>]+>\(\{[\s\S]*?\}\);/g,
    (match, dataVar) => {
      return match
        .replace('isLoading }', 'isLoading, isPlaceholderData }')
        .replace(/\}\);$/, ',\n    ...adminQueryOptions,\n    placeholderData: []\n  });');
    }
  );

  // 4. Add skeleton loading before the return statement
  const returnMatch = content.match/(\n\s+)return \(\n(\s+)<div className="space-y-8">/;
  if (returnMatch) {
    const indent = returnMatch[1];
    const skeletonCode = `${indent}// Show skeleton while loading initial data
${indent}if (isLoading && ${getDataVariableName(content)}.length === 0) {
${indent}  return <AdminTableSkeleton rows={5} />;
${indent}}
`;
    content = content.replace(returnMatch[0], skeletonCode + returnMatch[0]);
  }

  // Write the optimized content back to the file
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${path.basename(filePath)} optimized successfully`);
}

function getDataVariableName(content) {
  const match = content.match(/const { data: (\w+) = \[\]/);
  return match ? match[1] : 'data';
}

// Process each admin page
console.log('🚀 Starting admin pages optimization...\n');

adminPages.forEach(filename => {
  const filePath = path.join(adminPagesDir, filename);
  try {
    optimizeAdminPage(filePath);
  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error.message);
  }
});

console.log('\n✨ Admin pages optimization complete!');