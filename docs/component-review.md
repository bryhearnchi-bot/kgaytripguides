# Component Review and Remediation Plan

**Date**: November 26, 2025
**Status**: Completed (Phase 1-3)

---

## Executive Summary

A comprehensive review of the `/client/src/components/` directory (205+ component files) revealed:

- **0 unused components** - The codebase is well-maintained
- **6 major duplication patterns** requiring refactoring
- **~1,700+ lines of code** that can be consolidated
- **7 new reusable components** recommended

---

## Table of Contents

1. [Critical Issues](#critical-issues)
2. [High Priority Refactoring](#high-priority-refactoring)
3. [Medium Priority Improvements](#medium-priority-improvements)
4. [Implementation Plan](#implementation-plan)
5. [New Components to Create](#new-components-to-create)
6. [Files Affected](#files-affected)

---

## Critical Issues

### 1. Duplicate Social Media Icon Components

**Impact**: ~100 lines of identical code in 2 files

**Current State**:

- `EventCard.tsx` (lines 48-92): Defines `InstagramIcon`, `XIcon`, `TikTokIcon`, `LinktreeIcon`, `getSocialIcon()`
- `TalentCard.tsx` (lines 45-89): Identical definitions

**Problem**: Any icon update requires changes in multiple files.

**Solution**: Extract to `/client/src/components/ui/SocialIcons.tsx`

```typescript
// New file: /client/src/components/ui/SocialIcons.tsx
export const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    {/* SVG path */}
  </svg>
);

export const XIcon = ({ className }: { className?: string }) => (/* ... */);
export const TikTokIcon = ({ className }: { className?: string }) => (/* ... */);
export const LinktreeIcon = ({ className }: { className?: string }) => (/* ... */);

export const getSocialIcon = (platform: string): React.ReactNode => {
  switch (platform.toLowerCase()) {
    case 'instagram': return <InstagramIcon className="w-4 h-4" />;
    case 'x':
    case 'twitter': return <XIcon className="w-4 h-4" />;
    case 'tiktok': return <TikTokIcon className="w-4 h-4" />;
    case 'linktree': return <LinktreeIcon className="w-4 h-4" />;
    default: return null;
  }
};
```

---

## High Priority Refactoring

### 2. Card Action Button Pattern

**Impact**: 6+ button instances across 4 components

**Current State**: Inline button styling repeated:

```tsx
// Repeated in EventCard, PartyCard, TalentCard, JobListingComponent
<button className="flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/20 transition-all">
  <Icon className="w-3.5 h-3.5" />
  <span>Label</span>
</button>
```

**Solution**: Create `/client/src/components/ui/CardActionButton.tsx`

```typescript
interface CardActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function CardActionButton({ icon, label, onClick, disabled, className }: CardActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-1.5 py-1 rounded-full",
        "text-xs font-semibold bg-white/5 hover:bg-white/10",
        "text-white border border-white/20 transition-all",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
```

**Files to Update**:

- [x] `EventCard.tsx` (3 buttons) - Completed 2025-11-26
- [x] `PartyCard.tsx` (2 buttons) - Completed 2025-11-26
- [x] `TalentCard.tsx` (2 buttons) - Completed 2025-11-26
- [x] `JobListingComponent.tsx` (2 buttons) - Completed 2025-11-26
- [x] `OverviewTab.tsx` (1 button) - Completed 2025-11-26
- [x] `ScheduleTab.tsx` (4 buttons) - Completed 2025-11-26

---

### 3. Generic Selector Component

**Impact**: ~1,500 lines of code across 6 components

**Current State**: Nearly identical selector components:
| Component | Lines | Location |
|-----------|-------|----------|
| `CruiseLineSelector.tsx` | 262 | `/admin/selectors/` |
| `ResortSelector.tsx` | 356 | `/admin/selectors/` |
| `ResortCompanySelector.tsx` | 274 | `/admin/selectors/` |
| `LocationSelector.tsx` | 358 | `/admin/selectors/` |
| `AmenitySelector.tsx` | 249 | `/admin/selectors/` |
| `SimpleSelector.tsx` | 155 | `/admin/selectors/` |

All share:

- Identical popover/command structure
- Same modal styling patterns
- Similar create/select workflows

**Solution**: Create `/client/src/components/admin/GenericSelector.tsx`

```typescript
interface GenericSelectorProps<T> {
  items: T[];
  selectedId?: number | null;
  onSelectionChange: (id: number | null, item?: T) => void;
  getItemLabel: (item: T) => string;
  getItemId: (item: T) => number;
  searchPlaceholder?: string;
  placeholder?: string;
  label?: string;
  allowCreate?: boolean;
  createForm?: React.ReactNode;
  createFormTitle?: string;
  isLoading?: boolean;
}

export function GenericSelector<T>({ ... }: GenericSelectorProps<T>) {
  // Consolidated selector logic
}
```

**Migration Plan**:

1. [ ] Create `GenericSelector` component
2. [ ] Refactor `SimpleSelector` to use `GenericSelector`
3. [ ] Refactor `CruiseLineSelector` to use `GenericSelector`
4. [ ] Refactor `ResortSelector` to use `GenericSelector`
5. [ ] Refactor `ResortCompanySelector` to use `GenericSelector`
6. [ ] Refactor `LocationSelector` to use `GenericSelector`
7. [ ] Refactor `AmenitySelector` to use `GenericSelector`

---

## Medium Priority Improvements

### 4. Extract Modal Field Styles

**Impact**: 45 lines duplicated in 5+ components

**Current State**: `modalFieldStyles` CSS string repeated in multiple selector files:

```typescript
const modalFieldStyles = `
  [&_label]:text-white
  [&_label]:font-medium
  [&_input]:bg-white/10
  // ... 40+ more lines
`;
```

**Solution**: Create `/client/src/lib/adminStyles.ts`

```typescript
export const ADMIN_MODAL_FIELD_STYLES = `
  [&_label]:text-white
  [&_label]:font-medium
  [&_input]:bg-white/10
  // consolidated styles
`;

export const ADMIN_CARD_STYLES = 'bg-white/5 backdrop-blur-md rounded-xl border border-white/20';
```

**Files to Update**:

- [x] `CruiseLineSelector.tsx` - Completed 2025-11-26
- [x] `ResortSelector.tsx` - Completed 2025-11-26
- [x] `ResortCompanySelector.tsx` - Completed 2025-11-26
- [x] `LocationSelector.tsx` - Completed 2025-11-26
- [x] `AmenitySelector.tsx` - Completed 2025-11-26

---

### 5. Duplicate formatDateKey Function

**Impact**: ~25 lines duplicated in 2 files

**Current State**:

- `EventCard.tsx` (lines 22-45): `formatDateKey()` function
- `TalentCard.tsx` (lines 19-42): Identical function

**Solution**: Add to `/client/src/lib/timeFormat.ts`

```typescript
// Add to existing timeFormat.ts
export function formatDateKey(dateKey: string): string {
  // Handle week identifiers (e.g., "Week 1", "Week 2")
  if (dateKey.toLowerCase().startsWith('week')) {
    return dateKey;
  }
  // Handle actual dates
  const date = parseLocalDate(dateKey);
  if (!date || isNaN(date.getTime())) {
    return dateKey;
  }
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
```

---

### 6. Adopt OptimizedImage Component

**Impact**: Improved image loading across 6+ components

**Current State**: `getOptimizedImageUrl()` utility is used manually in 13+ files, but the new `OptimizedImage` component provides better functionality with:

- Automatic placeholder support
- Fallback image handling
- Built-in srcSet generation
- Lazy loading

**Files to Refactor**:

- [ ] `EventCard.tsx`
- [ ] `PartyCard.tsx`
- [ ] `TalentCard.tsx`
- [ ] `OverviewTab.tsx`
- [ ] `ItineraryTab.tsx`
- [ ] `TalentModal.tsx`

**Before**:

```tsx
<img src={getOptimizedImageUrl(imageUrl, { width: 400, height: 300 })} alt={name} loading="lazy" />
```

**After**:

```tsx
<OptimizedImage
  src={imageUrl}
  alt={name}
  width={400}
  height={300}
  placeholder="/images/placeholder.png"
/>
```

---

## Implementation Plan

### Phase 1: Critical - COMPLETED 2025-11-26

- [x] Create `SocialIcons.tsx` component
- [x] Update `EventCard.tsx` to use shared social icons
- [x] Update `TalentCard.tsx` to use shared social icons

### Phase 2: High Priority - COMPLETED 2025-11-26

- [x] Create `CardActionButton.tsx` component (with `variant` prop for elevated/default styles)
- [x] Update all card components to use `CardActionButton`
  - EventCard, TalentCard, PartyCard, JobListingComponent, OverviewTab, ScheduleTab
- [ ] Create `GenericSelector.tsx` component (deferred - existing selectors work well)
- [ ] Migrate one selector (e.g., `SimpleSelector`) as proof of concept (deferred)

### Phase 3: Medium Priority - COMPLETED 2025-11-26

- [x] Extract `ADMIN_MODAL_FIELD_STYLES` to `adminStyles.ts`
- [x] Update all selector components to use shared styles
  - CruiseLineSelector, ResortSelector, ResortCompanySelector, LocationSelector, AmenitySelector
- [x] Add `formatDateKey()` to `timeFormat.ts`
- [x] Update `EventCard` and `TalentCard` to use shared utility

### Phase 4: Migration (Future)

- [ ] Migrate remaining selector components to `GenericSelector` (if needed)
- [ ] Adopt `OptimizedImage` in card components (optional - current approach works well)
- [ ] Final testing and cleanup

---

## New Components to Create

| Component              | Location                        | Priority | Est. Lines |
| ---------------------- | ------------------------------- | -------- | ---------- |
| `SocialIcons.tsx`      | `/client/src/components/ui/`    | Critical | ~80        |
| `CardActionButton.tsx` | `/client/src/components/ui/`    | High     | ~30        |
| `GenericSelector.tsx`  | `/client/src/components/admin/` | High     | ~200       |
| `adminStyles.ts`       | `/client/src/lib/`              | Medium   | ~50        |

---

## Files Affected

### Components to Modify

| File                        | Changes Required                          |
| --------------------------- | ----------------------------------------- |
| `EventCard.tsx`             | Remove social icons, use shared utilities |
| `TalentCard.tsx`            | Remove social icons, use shared utilities |
| `PartyCard.tsx`             | Use `CardActionButton`                    |
| `JobListingComponent.tsx`   | Use `CardActionButton`                    |
| `CruiseLineSelector.tsx`    | Use `GenericSelector` or shared styles    |
| `ResortSelector.tsx`        | Use `GenericSelector` or shared styles    |
| `ResortCompanySelector.tsx` | Use `GenericSelector` or shared styles    |
| `LocationSelector.tsx`      | Use `GenericSelector` or shared styles    |
| `AmenitySelector.tsx`       | Use `GenericSelector` or shared styles    |
| `SimpleSelector.tsx`        | Use `GenericSelector` or shared styles    |

### New Files to Create

| File                                               | Purpose                         |
| -------------------------------------------------- | ------------------------------- |
| `/client/src/components/ui/SocialIcons.tsx`        | Shared social media icons       |
| `/client/src/components/ui/CardActionButton.tsx`   | Reusable card action button     |
| `/client/src/components/admin/GenericSelector.tsx` | Configurable selector component |
| `/client/src/lib/adminStyles.ts`                   | Shared admin styling constants  |

---

## Success Metrics

After implementation:

- [x] Zero duplicate social icon definitions - **DONE** (SocialIcons.tsx)
- [x] Single source of truth for card action buttons - **DONE** (CardActionButton.tsx)
- [ ] Selector components reduced from ~1,500 lines to ~200 lines + config (deferred - shared styles approach used instead)
- [x] All modal field styles in one location - **DONE** (adminStyles.ts)
- [x] `formatDateKey()` has single definition - **DONE** (timeFormat.ts)
- [ ] `OptimizedImage` used consistently for images (optional future enhancement)

---

## Notes

- The codebase has **no unused components** - it's well-maintained
- Trip guide modals are intentionally domain-specific (not candidates for consolidation)
- Enhanced\*Table components are intentionally specialized for their domains
- shadcn/ui components should remain separate (standard library)
