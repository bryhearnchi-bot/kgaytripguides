# Image Optimization Plan

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

### Phase 1: Create Image Utility Functions

**Create `/client/src/lib/image-utils.ts`**

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

### Phase 2: Create OptimizedImage Component

**Create `/client/src/components/ui/OptimizedImage.tsx`**

Features:

- Accepts `preset` prop for easy sizing
- Generates responsive `srcset` for retina displays
- Adds `loading="lazy"` by default
- Sets explicit `width`/`height` to prevent layout shift
- Falls back gracefully for non-Supabase URLs
- Optional blur placeholder while loading

---

### Phase 3: Update Components (Priority Order)

**High Impact (large images, frequently viewed):**

1. `StandardizedHero.tsx` - Trip hero backgrounds
2. `EventCard.tsx` - Event thumbnails
3. `PartyCard.tsx` - Party theme images
4. `TalentModal.tsx` - Talent profile photos

**Medium Impact:** 5. `OverviewTab.tsx` - Ship/resort images 6. `ItineraryTab.tsx` - Itinerary stop images 7. `JobListingComponent.tsx` - Event images in schedule

**Admin (lower traffic but still helps):** 8. `StandardAdminTable.tsx` - Table thumbnails (50x50) 9. Various admin forms with image previews

---

### Phase 4: Optimize Offline/PWA Storage

Update `OfflineStorageContext.tsx` to:

- Download medium-resolution images instead of full-res
- Use `card` preset for most images
- Use `thumbnail` preset for admin/list views
- Significantly reduce offline cache size

---

### Phase 5: Add Loading States (Optional Enhancement)

- Blur placeholder while images load
- Skeleton loading states for image-heavy sections
- Progressive image loading for hero images

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

1. **Supabase Plan** - Image transformations require Pro plan or higher. Need to verify your plan supports this.

2. **Test the endpoint** - Before implementing, test that transformation URLs work:
   ```
   https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/render/image/public/app-images/[any-image]?width=100
   ```

---

## Alternatives If Supabase Transformations Unavailable

If you're not on Supabase Pro:

1. **Cloudflare Images** - $5/month, excellent transformations
2. **imgix** - Premium option, very powerful
3. **Sharp preprocessing** - Resize on upload (requires storage for multiple sizes)
4. **Cloudinary** - Free tier available, good transforms

---

## Recommendation

Start with Phase 1 & 2 (utility functions + component), then roll out to high-impact components in Phase 3. This gives you the infrastructure, then you can incrementally update components without a big-bang change.
