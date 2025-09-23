# 📋 Non-Migration TypeScript Errors & Fix Plan

## Overview
These are TypeScript errors that exist in the codebase but are NOT related to the schema migration (cruises→trips, ports→locations, users→profiles). These should be fixed after the migration is complete to achieve a clean codebase.

## Error Categories & Fix Plans

### 1. 🧪 Test Infrastructure Issues
**Files Affected**:
- `client/src/components/__tests__/*.tsx`

**Issues**:
- Missing test type definitions (@types/jest or @types/mocha)
- Missing OptimizedImage component
- Implicit any types in test files

**Fix Plan**:
```bash
npm install --save-dev @types/jest
# OR
npm install --save-dev @types/mocha
```
Then add to tsconfig.json types array.

---

### 2. 🔄 Duplicate Class Definitions
**File**: `server/storage.ts`

**Issue**:
- Lines 233 & 266 have duplicate `ProfileStorage` class definitions

**Impact**: TypeScript complains but JavaScript uses the second definition

**Fix Plan**:
- Will be resolved in Phase 5 (Cleanup) when removing backward compatibility code
- No immediate action needed

---

### 3. 🎨 Frontend Component Type Issues

#### ArtistDatabaseManager.tsx
**Issues**:
- `talentCategoryId` property doesn't exist in Artist type
- Implicit any types

**Fix Plan**:
```typescript
// Update Artist interface to include talentCategoryId
interface Artist {
  // ... existing fields
  talentCategoryId?: number;
}
```

#### BulkOperations.tsx
**Issues**:
- Possibly undefined values in comparisons

**Fix Plan**:
```typescript
// Add null checks
if (aValue !== undefined && bValue !== undefined) {
  // comparison logic
}
```

#### EventManagement.tsx
**Issues**:
- Using undefined as index type

**Fix Plan**:
```typescript
// Add guard clause
if (eventId !== undefined) {
  // use eventId as index
}
```

#### LocationManagement.tsx
**Issues**:
- Type conflicts between different Location definitions
- Unknown types in ReactNode assignments

**Fix Plan**:
- Unify Location type definitions across the app
- Add proper type assertions for unknown values

---

### 4. 🖥️ Server-Side Issues

#### server/add-test-cruises.ts
**Issue**:
- References old 'cruises' export that doesn't exist

**Fix Plan**:
```typescript
// Change from:
import { cruises } from './storage';
// To:
import { trips } from './storage';
```

#### server/auth.ts
**Issue**:
- Line 137: Reference to undefined 'User' type

**Fix Plan**:
```typescript
// Already fixed in Phase 2 - needs verification
// Should use 'Profile' instead of 'User'
```

#### server/cache/CacheManager.ts
**Issue**:
- Iterator issues with Map - needs downlevelIteration flag

**Fix Plan**:
Update tsconfig.json:
```json
{
  "compilerOptions": {
    "downlevelIteration": true,
    // OR
    "target": "es2015" // or higher
  }
}
```

---

### 5. 🔧 Configuration Issues

#### vite.config.ts
**Issue**:
- Invalid 'treeshake' option in build configuration

**Fix Plan**:
Remove or correct the treeshake option in vite.config.ts

#### server/OptimizedStorage.ts
**Issues**:
- References to non-existent tables (parties, eventTalent)
- Property 'locationName' missing in itinerary type

**Fix Plan**:
- Remove references to deleted tables
- Update type definitions to match current schema

#### server/storage/PartyThemeStorage.ts
**Issues**:
- Missing table imports
- Undefined references

**Fix Plan**:
- Import required tables from schema
- Fix all undefined references

---

## Priority Order for Fixes

### 🔴 High Priority (Breaks functionality)
1. server/add-test-cruises.ts - Update to use trips
2. server/auth.ts - Fix User type reference
3. Test infrastructure - Add @types/jest

### 🟡 Medium Priority (Type safety issues)
1. Frontend component type issues
2. Cache manager iteration issues
3. OptimizedStorage table references

### 🟢 Low Priority (Cleanup)
1. Duplicate ProfileStorage (Phase 5)
2. Implicit any types in examples
3. vite.config.ts treeshake option

---

## Execution Plan

### Step 1: Quick Fixes (15 minutes)
```bash
# Install test types
npm install --save-dev @types/jest

# Fix add-test-cruises.ts imports
# Fix auth.ts User reference
```

### Step 2: Type System Updates (30 minutes)
- Update Artist interface
- Add null checks to BulkOperations
- Fix Location type conflicts

### Step 3: Configuration Updates (15 minutes)
- Update tsconfig.json for iteration
- Fix vite.config.ts

### Step 4: Schema Alignment (45 minutes)
- Update OptimizedStorage.ts
- Fix PartyThemeStorage.ts
- Align all type definitions with current schema

---

## Success Criteria

✅ Migration is complete when:
1. `npm run check` shows 0 errors (excluding test files if needed)
2. All components compile without type errors
3. Server starts without warnings
4. Build completes successfully

---

## Notes

- Most of these errors existed before the migration
- Focus on migration completion first
- Fix these in a separate cleanup phase
- Some errors may resolve themselves once types are properly aligned

---

*Last Updated: December 23, 2024*