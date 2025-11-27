# Image Optimization Plan

## Status: COMPLETED (2025-11-26)

All phases have been implemented. See the Implementation Summary at the bottom.

---

## The Problem

- All images are served at **full resolution** regardless of where they're displayed
- A 50x50px admin thumbnail loads the same 1920x1080 image as a hero section
- No WebP/AVIF format optimization
- No lazy loading on most images
- PWA/offline mode downloads full-res images

## The Solution: Supabase Storage Image Transformations

Supabase Storage (Pro plan) has **built-in image transformation** - you just change the URL structure:

```
# Current (full image)
https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/trips/hero.jpg

# Optimized (resized + WebP)
https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/render/image/public/app-images/trips/hero.jpg?width=400&quality=80
```

---

## Implementation Plan

### Phase 1: Create Image Utility Functions - [x] COMPLETED

**Created `/client/src/lib/image-utils.ts`**

```typescript
// Generate optimized image URLs with Supabase transformations
export function getOptimizedImageUrl(
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill';
  }
): string;
```

**Preset sizes for common use cases:**

| Preset      | Dimensions | Quality | Use Case                        |
| ----------- | ---------- | ------- | ------------------------------- |
| `thumbnail` | 80x80      | 70      | Admin tables, small icons       |
| `card`      | 400x300    | 80      | Event cards, party cards        |
| `profile`   | 200x200    | 80      | Talent profile images           |
| `hero`      | 1200x800   | 85      | Hero sections (+ 2x for retina) |
| `full`      | 1920x1280  | 90      | Full-screen galleries           |

---

### Phase 2: Create OptimizedImage Component - [x] COMPLETED

**Created `/client/src/components/ui/OptimizedImage.tsx`**

Features:

- Accepts `preset` prop for easy sizing
- Generates responsive `srcset` for retina displays
- Adds `loading="lazy"` by default
- Sets explicit `width`/`height` to prevent layout shift
- Falls back gracefully for non-Supabase URLs
- Optional blur placeholder while loading

---

### Phase 3: Update Components (Priority Order) - [x] COMPLETED

**High Impact (large images, frequently viewed):**

1. [x] `StandardizedHero.tsx` - Trip hero backgrounds
2. [x] `EventCard.tsx` - Event thumbnails
3. [x] `PartyCard.tsx` - Party theme images
4. [x] `TalentModal.tsx` - Talent profile photos

**Medium Impact:**

5. [x] `OverviewTab.tsx` - Ship/resort images
6. [x] `ItineraryTab.tsx` - Itinerary stop images
7. [x] `JobListingComponent.tsx` - Event images in schedule

**Admin (lower traffic but still helps):**

8. [x] `admin-table-config.tsx` (createImageColumn) - Table thumbnails (80x80)

---

### Phase 4: Optimize Offline/PWA Storage - [x] COMPLETED

Updated `OfflineStorageContext.tsx` to:

- [x] Download medium-resolution images instead of full-res
- [x] Use `card` preset for most images
- [x] Cache version bumped to v5 to trigger re-download
- [x] Significantly reduced offline cache size

---

### Phase 5: Add Loading States (Optional Enhancement)

- [ ] Blur placeholder while images load (OptimizedImage supports this, not widely used yet)
- [ ] Skeleton loading states for image-heavy sections
- [ ] Progressive image loading for hero images

---

## Expected Results

| Metric            | Before    | After (Estimated) |
| ----------------- | --------- | ----------------- |
| Thumbnail size    | 500KB-2MB | 5-15KB            |
| Card image size   | 500KB-2MB | 30-60KB           |
| Hero image size   | 2-5MB     | 150-300KB         |
| Initial page load | Slow      | 60-80% faster     |
| Offline cache     | 100MB+    | 10-20MB           |

---

## Prerequisites to Check

1. **Supabase Plan** - [x] VERIFIED - Image transformations work on this project's Supabase instance.

2. **Test the endpoint** - [x] VERIFIED - Transformation URLs work:
   ```
   https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/render/image/public/app-images/[any-image]?width=100
   ```

---

## Implementation Summary

### Files Created:

- `/client/src/lib/image-utils.ts` - Core utility functions
- `/client/src/components/ui/OptimizedImage.tsx` - Reusable component

### Files Modified:

- `StandardizedHero.tsx` - Hero image optimization
- `EventCard.tsx` - Event thumbnail and modal images
- `PartyCard.tsx` - Party theme images
- `TalentModal.tsx` - Talent profile photos
- `OverviewTab.tsx` - Ship/trip/map images
- `ItineraryTab.tsx` - Itinerary stop images
- `JobListingComponent.tsx` - Event detail images
- `admin-table-config.tsx` - Admin table thumbnails
- `OfflineStorageContext.tsx` - Offline cache downloads optimized images (v5)

### Usage Examples:

```typescript
// Import the utilities
import { getOptimizedImageUrl, IMAGE_PRESETS } from '@/lib/image-utils';

// Use a preset
const cardUrl = getOptimizedImageUrl(originalUrl, IMAGE_PRESETS.card);

// Custom dimensions
const customUrl = getOptimizedImageUrl(originalUrl, { width: 300, height: 200, quality: 85 });

// Use the OptimizedImage component
<OptimizedImage src={imageUrl} preset="card" alt="Event" />
```
