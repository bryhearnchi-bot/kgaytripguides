# Itinerary & Schedule Data Not Displaying - Debug Investigation

## Problem Statement

Itinerary and schedule data is not displaying in the Edit Trip Modal despite being fetched from the API and passed through the data flow pipeline.

## Investigation Approach

I've added comprehensive debug logging at every critical point in the data flow to identify exactly where the data is being lost.

## Data Flow Architecture

```
API (/api/admin/trips)
  ↓
trips-management.tsx (useQuery)
  ↓
EditTripModal.tsx (receives trip prop)
  ↓
TripWizardContext.restoreFromDraft()
  ↓
CruiseItineraryPage / ResortSchedulePage (display)
```

## Debug Logging Added

### 1. API Response (trips-management.tsx, line 170)

**Location**: `/client/src/pages/admin/trips-management.tsx`
**What it logs**:

- Trip count received from API
- First trip's itineraryEntries and scheduleEntries
- Array lengths

**Look for**: `🔍 trips-management - API response received:`

### 2. EditTripModal Data Preparation (EditTripModal.tsx, line 112)

**Location**: `/client/src/components/admin/EditTripModal/EditTripModal.tsx`
**What it logs**:

- Data being prepared for restoreFromDraft
- itineraryEntries and scheduleEntries arrays
- Trip ID and name

**Look for**: `🔍 EditTripModal - Restoring draft with data:`

### 3. TripWizardContext.restoreFromDraft Receive (TripWizardContext.tsx, line 263)

**Location**: `/client/src/contexts/TripWizardContext.tsx`
**What it logs**:

- Data received by restoreFromDraft function
- itineraryEntries and scheduleEntries lengths

**Look for**: `🔍 TripWizardContext.restoreFromDraft - Received draftState:`

### 4. TripWizardContext.restoreFromDraft Set State (TripWizardContext.tsx, line 299)

**Location**: `/client/src/contexts/TripWizardContext.tsx`
**What it logs**:

- Exact state object being set via setState()
- Confirms data is being committed to state

**Look for**: `✅ TripWizardContext.restoreFromDraft - Setting state:`

### 5. CruiseItineraryPage useEffect Trigger (CruiseItineraryPage.tsx, line 58)

**Location**: `/client/src/components/admin/TripWizard/CruiseItineraryPage.tsx`
**What it logs**:

- Current itineraryEntries length in state
- Start/end dates
- Whether it will generate blank entries (THIS IS CRITICAL!)

**Look for**: `🔍 CruiseItineraryPage - useEffect triggered:`

**CRITICAL LOGS**:

- `⚠️ CruiseItineraryPage - Generating NEW blank entries` = BUG FOUND!
- `✅ CruiseItineraryPage - Skipping generation, entries already exist` = Expected behavior

## Testing Instructions

1. **Open the application** and navigate to Trips Management page
2. **Open browser console** (F12 or Cmd+Option+I)
3. **Click "Edit" on any cruise trip** that has itinerary data
4. **Watch the console logs** - they will appear in this order:

```
🔍 trips-management - API response received: {...}
🔍 EditTripModal - Restoring draft with data: {...}
🔍 TripWizardContext.restoreFromDraft - Received draftState: {...}
✅ TripWizardContext.restoreFromDraft - Setting state: {...}
🔍 CruiseItineraryPage - useEffect triggered: {...}
```

5. **Copy all console logs** and share them

## Expected Findings

### Scenario A: API Not Returning Data

```
🔍 trips-management - API response received: {
  firstTripItineraryLength: undefined  ← PROBLEM: API not returning data
}
```

**Root Cause**: Backend transformation issue or database query problem

### Scenario B: Data Lost in EditTripModal

```
🔍 trips-management - API response received: { itineraryLength: 7 }  ← Good
🔍 EditTripModal - Restoring draft with data: { itineraryLength: 0 }  ← PROBLEM
```

**Root Cause**: EditTripModal not reading trip.itineraryEntries correctly

### Scenario C: Data Lost in Context

```
🔍 EditTripModal - Restoring draft with data: { itineraryLength: 7 }  ← Good
🔍 TripWizardContext.restoreFromDraft - Received: { itineraryLength: 0 }  ← PROBLEM
```

**Root Cause**: restoreFromDraft function parameter issue

### Scenario D: Data Overwritten by useEffect (MOST LIKELY)

```
✅ TripWizardContext.restoreFromDraft - Setting state: { itineraryLength: 7 }  ← Good
🔍 CruiseItineraryPage - useEffect triggered: { itineraryLength: 0 }  ← PROBLEM
⚠️ CruiseItineraryPage - Generating NEW blank entries
```

**Root Cause**: Race condition or timing issue causing useEffect to see stale state

### Scenario E: Multiple useEffect Runs

```
✅ TripWizardContext.restoreFromDraft - Setting state: { itineraryLength: 7 }  ← Good
🔍 CruiseItineraryPage - useEffect triggered: { itineraryLength: 7 }  ← Good
✅ CruiseItineraryPage - Skipping generation, entries already exist  ← Good
🔍 CruiseItineraryPage - useEffect triggered: { itineraryLength: 0 }  ← PROBLEM: Why running again?
⚠️ CruiseItineraryPage - Generating NEW blank entries
```

**Root Cause**: Dependency array or setState causing multiple runs

## Hypotheses

### Hypothesis 1: API Transformation Error

**Check**: Is `transformTripData()` in `/server/storage.ts` correctly mapping `itinerary_entries` → `itineraryEntries`?

**Status**: ✅ VERIFIED - Lines 138-139 in storage.ts correctly transform the fields

### Hypothesis 2: EditTripModal Reading Wrong Property

**Check**: Is EditTripModal reading `trip.itineraryEntries` or `trip.itinerary_entries` (snake_case)?

**Status**: ✅ VERIFIED - Line 107 in EditTripModal.tsx uses correct camelCase `trip.itineraryEntries`

### Hypothesis 3: Context Not Preserving State

**Check**: Does `restoreFromDraft` correctly set `itineraryEntries` and `scheduleEntries`?

**Status**: ✅ VERIFIED - Lines 295-296 in TripWizardContext.tsx correctly set both fields

### Hypothesis 4: useEffect Race Condition (MOST LIKELY)

**Check**: Does CruiseItineraryPage's useEffect run before or after state is restored?

**Status**: ⚠️ NEEDS TESTING - This is the most likely culprit

**Why this is likely**:

1. EditTripModal calls `restoreFromDraft` in a useEffect
2. CruiseItineraryPage mounts and runs its useEffect
3. React batches state updates, causing timing issues
4. The useEffect might run with stale state (length: 0) before the restored state propagates

### Hypothesis 5: Dependency Array Causing Re-run

**Check**: Does the useEffect dependency array cause the effect to run multiple times?

**Status**: ⚠️ POSSIBLE - The dependency array includes `state.itineraryEntries.length`

**Why this could happen**:

1. State is initially empty (length: 0)
2. `restoreFromDraft` sets state with data (length: 7)
3. Length change (0 → 7) triggers useEffect again
4. But by this time, something has cleared the state back to 0?

## Potential Fixes (After Root Cause Confirmed)

### Fix A: Remove Auto-Generation in Edit Mode

If the component is in edit mode, don't auto-generate blank entries:

```typescript
useEffect(() => {
  // Only generate blank entries if:
  // 1. No entries exist
  // 2. Dates are set
  // 3. NOT in edit mode
  if (
    state.itineraryEntries.length === 0 &&
    state.tripData.startDate &&
    state.tripData.endDate &&
    !state.isEditMode
  ) {
    // ← Add this check
    // Generate entries...
  }
}, [state.tripData.startDate, state.tripData.endDate, state.itineraryEntries.length]);
```

### Fix B: Use useRef to Track Initialization

Prevent auto-generation if data has been restored:

```typescript
const hasRestoredData = useRef(false);

useEffect(() => {
  if (state.itineraryEntries.length > 0) {
    hasRestoredData.current = true;
  }
}, [state.itineraryEntries.length]);

useEffect(() => {
  if (
    !hasRestoredData.current &&
    state.itineraryEntries.length === 0 &&
    state.tripData.startDate &&
    state.tripData.endDate
  ) {
    // Generate entries...
  }
}, [state.tripData.startDate, state.tripData.endDate, state.itineraryEntries.length]);
```

### Fix C: Remove Length from Dependency Array

Remove `state.itineraryEntries.length` from the dependency array to prevent re-runs:

```typescript
useEffect(() => {
  if (state.itineraryEntries.length === 0 && state.tripData.startDate && state.tripData.endDate) {
    // Generate entries...
  }
}, [state.tripData.startDate, state.tripData.endDate]); // ← Remove length
```

**Risk**: This could cause the effect not to run when it should.

## Next Steps

1. ✅ **Add debug logging** (COMPLETED)
2. ⏳ **User tests and provides console logs**
3. ⏳ **Analyze logs to identify exact failure point**
4. ⏳ **Implement appropriate fix based on root cause**
5. ⏳ **Remove debug logging after fix is confirmed**

## Files Modified

1. `/client/src/pages/admin/trips-management.tsx` - Added API response logging
2. `/client/src/components/admin/EditTripModal/EditTripModal.tsx` - Added data preparation logging
3. `/client/src/contexts/TripWizardContext.tsx` - Added context state logging
4. `/client/src/components/admin/TripWizard/CruiseItineraryPage.tsx` - Added useEffect trigger logging

All changes are clearly marked with `// CRITICAL DEBUG:` comments for easy removal after debugging.
