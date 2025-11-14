# Adding Fields to Trip Edit Modal

**Complete Guide for Adding New Fields to the Trip Wizard / Edit Trip Modal**

This document explains the exact steps required to add a new field to the Trip Edit Modal system. Follow ALL steps to ensure the field appears correctly and data is preserved.

---

## The Problem

When adding a new field (like `bookingUrl` or `mapUrl`) to trips, the field must be added in **multiple locations** throughout the codebase. Missing even one location will cause the field to not display or data to be lost when saving.

---

## Required Changes Checklist

When adding a new field to trip data, you MUST make changes in the following locations:

### ✅ 1. Database Schema

**File:** `server/schemas/trips.ts`

Add the field to the `updateTripSchema`:

```typescript
export const updateTripSchema = z.object({
  // ... existing fields ...

  // Content
  heroImageUrl: urlSchema.optional().or(z.literal('')),
  mapUrl: urlSchema.optional().or(z.literal('')),
  bookingUrl: urlSchema.optional().or(z.literal('')), // ← ADD YOUR FIELD HERE

  // ... rest of schema ...
});
```

**Location:** Around line 180-182

---

### ✅ 2. Storage Layer Transformation

**File:** `server/storage.ts`

Ensure the field is transformed from `snake_case` to `camelCase`:

**a) Add to `transformTripData` function:**

```typescript
export class TripStorage implements ITripStorage {
  transformTripData(dbTrip: any): Trip {
    // ... existing transformations ...

    return {
      // ... other fields ...
      heroImageUrl: dbTrip.hero_image_url,
      mapUrl: dbTrip.map_url,
      bookingUrl: dbTrip.booking_url, // ← ADD YOUR FIELD HERE
      // ... rest of fields ...
    };
  }
}
```

**Location:** Around line 130-132

**b) Import transformation utility:**

```typescript
import { transformObjectToSnakeCase } from './utils/field-transformers';
```

**Location:** Line 6

**c) Update `updateTrip` to use snake_case transformation:**

```typescript
async updateTrip(id: number, data: any): Promise<Trip> {
  const supabaseAdmin = getSupabaseAdmin();
  // Transform camelCase to snake_case for database
  const snakeCaseData = transformObjectToSnakeCase(data);
  const { data: trip, error } = await supabaseAdmin
    .from('trips')
    .update({ ...snakeCaseData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return this.transformTripData(trip);
}
```

**Location:** Lines 181-194

---

### ✅ 3. TripWizardContext - TypeScript Interface

**File:** `client/src/contexts/TripWizardContext.tsx`

Add the field to the `TripData` interface:

```typescript
interface TripData {
  id?: number;
  charterCompanyId?: number;
  tripTypeId?: number;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  heroImageUrl: string;
  mapUrl: string;
  bookingUrl?: string; // ← ADD YOUR FIELD HERE
  description: string;
  highlights: string;
}
```

**Location:** Lines 7-20

---

### ✅ 4. TripWizardContext - Initial State

**File:** `client/src/contexts/TripWizardContext.tsx`

Add the field to the `initialState`:

```typescript
const initialState: TripWizardState = {
  currentPage: 0,
  draftId: null,
  tripType: null,
  buildMethod: null,
  tripData: {
    name: '',
    slug: '',
    startDate: '',
    endDate: '',
    heroImageUrl: '',
    mapUrl: '',
    bookingUrl: '', // ← ADD YOUR FIELD HERE
    description: '',
    highlights: '',
  },
  // ... rest of initial state ...
};
```

**Location:** Lines 148-174

---

### ✅ 5. TripWizardContext - restoreFromDraft Function

**File:** `client/src/contexts/TripWizardContext.tsx`

**CRITICAL:** Add the field to the `restoreFromDraft` function:

```typescript
const restoreFromDraft = (draftState: Partial<TripWizardState>) => {
  const newState = {
    // ... other fields ...
    tripData: {
      id: draftState.tripData?.id,
      name: draftState.tripData?.name ?? '',
      slug: draftState.tripData?.slug ?? '',
      startDate: draftState.tripData?.startDate ?? '',
      endDate: draftState.tripData?.endDate ?? '',
      heroImageUrl: draftState.tripData?.heroImageUrl ?? '',
      mapUrl: draftState.tripData?.mapUrl ?? '',
      bookingUrl: draftState.tripData?.bookingUrl ?? '', // ← ADD YOUR FIELD HERE
      description: draftState.tripData?.description ?? '',
      highlights: draftState.tripData?.highlights ?? '',
      charterCompanyId: draftState.tripData?.charterCompanyId,
      tripTypeId: draftState.tripData?.tripTypeId,
    },
    // ... rest of state ...
  };

  setState(newState);
};
```

**Location:** Lines 374-412

**⚠️ WARNING:** Missing this step will cause data loss! The field will not be loaded into the context when editing an existing trip.

---

### ✅ 6. EditTripModal - Data Loading

**File:** `client/src/components/admin/EditTripModal/EditTripModal.tsx`

Add the field when creating the `editState` object:

```typescript
const editState = {
  currentPage: 0,
  tripType,
  buildMethod: 'manual' as const,
  tripData: {
    id: trip.id,
    charterCompanyId: trip.charterCompanyId,
    tripTypeId: trip.tripTypeId,
    name: trip.name,
    slug: trip.slug,
    startDate: formatDate(trip.startDate),
    endDate: formatDate(trip.endDate),
    heroImageUrl: trip.heroImageUrl || '',
    mapUrl: trip.mapUrl || '',
    bookingUrl: trip.bookingUrl || '', // ← ADD YOUR FIELD HERE
    description: trip.description || '',
    highlights: Array.isArray(trip.highlights) ? trip.highlights.join('\n') : trip.highlights || '',
  },
  // ... rest of state ...
};
```

**Location:** Lines 139-158

---

### ✅ 7. EditTripModal - Save Function

**File:** `client/src/components/admin/EditTripModal/EditTripModal.tsx`

Add the field to the `updatePayload`:

```typescript
const handleSaveTrip = async () => {
  try {
    const updatePayload: any = {
      id: trip.id,
      name: state.tripData.name,
      slug: state.tripData.slug,
      charterCompanyId: state.tripData.charterCompanyId,
      tripTypeId: state.tripType === 'cruise' ? 1 : 2,
      startDate: state.tripData.startDate,
      endDate: state.tripData.endDate,
      heroImageUrl: state.tripData.heroImageUrl || undefined,
      mapUrl: state.tripData.mapUrl || undefined,
      bookingUrl: state.tripData.bookingUrl || undefined,  // ← ADD YOUR FIELD HERE
      description: state.tripData.description || undefined,
      highlights: state.tripData.highlights || undefined,
    };

    // ... save logic ...
  }
};
```

**Location:** Lines 217-233

---

### ✅ 8. BasicInfoPage - UI Form Field

**File:** `client/src/components/admin/TripWizard/BasicInfoPage.tsx`

Add the actual form input field where you want it to appear:

```tsx
{
  /* Booking URL */
}
<div className="space-y-1">
  <label className="text-xs font-semibold text-white/90">Booking URL</label>
  <Input
    placeholder="https://example.com/booking"
    value={state.tripData.bookingUrl || ''}
    onChange={e => updateTripData({ bookingUrl: e.target.value })}
    className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
  />
  <p className="text-[10px] text-white/50 mt-0.5">URL where users can book this trip</p>
</div>;
```

**Location:** Lines 402-412 (or wherever you want the field to appear in the form)

**Note:** For image fields, use `ImageUploadField` component instead of `Input`.

---

## Common Mistakes to Avoid

### ❌ Missing `restoreFromDraft`

**Problem:** Field appears in the form but shows as empty when editing existing trips.

**Solution:** Add the field to the `restoreFromDraft` function in `TripWizardContext.tsx`.

### ❌ Missing Initial State

**Problem:** TypeScript errors or field is undefined.

**Solution:** Add the field to `initialState` in `TripWizardContext.tsx`.

### ❌ Missing Backend Transformation

**Problem:** Field saves as empty or doesn't save at all.

**Solution:** Ensure `transformObjectToSnakeCase` is used in `storage.ts` `updateTrip` function.

### ❌ Missing Schema Validation

**Problem:** API rejects the update with validation errors.

**Solution:** Add the field to `updateTripSchema` in `server/schemas/trips.ts`.

---

## Testing Checklist

After adding a new field, test the following:

1. ✅ **Create New Trip:** Field appears in the Trip Wizard and can be filled in
2. ✅ **Save New Trip:** Field value is saved to the database
3. ✅ **Edit Existing Trip:** Field appears in Edit Modal with existing value populated
4. ✅ **Update Field:** Can change the field value and save successfully
5. ✅ **Preserve Field:** Editing other fields doesn't clear this field's value
6. ✅ **View Trip:** Field value displays correctly in the public trip guide

---

## Quick Reference: All File Locations

1. `server/schemas/trips.ts` - Schema validation (~line 180)
2. `server/storage.ts` - Database transformation (~line 6, 130, 181)
3. `client/src/contexts/TripWizardContext.tsx` - Interface (~line 17)
4. `client/src/contexts/TripWizardContext.tsx` - Initial state (~line 160)
5. `client/src/contexts/TripWizardContext.tsx` - restoreFromDraft (~line 392)
6. `client/src/components/admin/EditTripModal/EditTripModal.tsx` - Load data (~line 152)
7. `client/src/components/admin/EditTripModal/EditTripModal.tsx` - Save data (~line 230)
8. `client/src/components/admin/TripWizard/BasicInfoPage.tsx` - UI form field (~line 402)

---

## Example: Adding a New Field "earlyBirdDeadline"

```typescript
// 1. server/schemas/trips.ts
earlyBirdDeadline: z.string().optional(),

// 2. server/storage.ts - transformTripData
earlyBirdDeadline: dbTrip.early_bird_deadline,

// 3. TripWizardContext.tsx - interface
earlyBirdDeadline?: string;

// 4. TripWizardContext.tsx - initialState
earlyBirdDeadline: '',

// 5. TripWizardContext.tsx - restoreFromDraft
earlyBirdDeadline: draftState.tripData?.earlyBirdDeadline ?? '',

// 6. EditTripModal.tsx - editState
earlyBirdDeadline: trip.earlyBirdDeadline || '',

// 7. EditTripModal.tsx - updatePayload
earlyBirdDeadline: state.tripData.earlyBirdDeadline || undefined,

// 8. BasicInfoPage.tsx - UI
<Input
  value={state.tripData.earlyBirdDeadline || ''}
  onChange={e => updateTripData({ earlyBirdDeadline: e.target.value })}
/>
```

---

## Summary

Adding a field requires updates in **8 locations**:

- 2 backend files (schema + storage)
- 3 frontend context locations (interface + initial state + restore)
- 2 modal component locations (load + save)
- 1 UI form component

**Always follow the pattern of existing fields like `mapUrl` or `heroImageUrl`.**

---

_Last Updated: November 2025_
_Related Issue: Booking URL field not showing in Edit Trip Modal_
