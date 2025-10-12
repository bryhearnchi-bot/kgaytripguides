# Modal Interaction Flow Diagram

## Complete User Journey Map

### Path 1: View Itinerary Details

```
┌─────────────────┐
│ Itinerary List  │
│ (Collapsed)     │
└────────┬────────┘
         │ User clicks day card
         ▼
┌─────────────────────────────────────┐
│ LAYER 1: Backdrop (z-40)           │
│ ├─ Darkens screen                  │
│ └─ Click → Close if no modals open │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ LAYER 2: Itinerary Card (z-50)     │
│ ├─ Shows: Port details              │
│ ├─ Shows: Attractions                │
│ ├─ Shows: LGBT venues                │
│ ├─ Button: "View Events"            │
│ └─ Button: Close [X]                 │
└─────────────────────────────────────┘
         │
         │ User clicks "View Events"
         │ (stopPropagation prevents close)
         ▼
┌─────────────────────────────────────┐
│ LAYER 3: Events Panel (z-60)       │
│ ├─ Slides up from bottom            │
│ ├─ Shows: Event list for day        │
│ ├─ Shows: Time, venue, description  │
│ ├─ Shows: Artist buttons (purple)   │
│ └─ Button: Close [X]                 │
└─────────────────────────────────────┘
         │
         │ User clicks artist button
         │ (stopPropagation keeps events open!)
         ▼
┌─────────────────────────────────────┐
│ LAYER 4: Talent Detail (z-70)      │
│ ├─ Slides in from right             │
│ ├─ Shows: Artist photo               │
│ ├─ Shows: Bio, known for             │
│ ├─ Shows: Performance schedule       │
│ ├─ Shows: Social media links         │
│ └─ Button: Back [←]                  │
└─────────────────────────────────────┘
```

---

## Interaction Matrix

### Click Behaviors

| User Action                 | State Changes                                          | Visual Result               |
| --------------------------- | ------------------------------------------------------ | --------------------------- |
| Click day card              | `activeItem = job`                                     | Backdrop + Itinerary appear |
| Click "View Events"         | `showEventsSlideUp = true`<br>`dayEvents = events`     | Events panel slides up      |
| Click artist button         | `showTalentDetail = true`<br>`selectedTalent = artist` | Talent detail slides in     |
| Click talent back           | `showTalentDetail = false`<br>`selectedTalent = null`  | Talent detail slides out    |
| Click events close          | `showEventsSlideUp = false`<br>`dayEvents = []`        | Events panel slides down    |
| Click itinerary close       | ALL states reset                                       | Everything closes           |
| Press Escape (in talent)    | `showTalentDetail = false`                             | Talent closes               |
| Press Escape (in events)    | `showEventsSlideUp = false`                            | Events close                |
| Press Escape (in itinerary) | `activeItem = null`                                    | Itinerary closes            |
| Click backdrop              | `activeItem = null` (if safe)                          | Everything closes           |
| Click outside events        | `showEventsSlideUp = false` (if no talent)             | Events close                |

---

## State Dependency Tree

```
activeItem (Root)
    │
    ├─ Controls: Backdrop visibility
    ├─ Controls: Itinerary card visibility
    └─ Parent of ──┐
                   │
        showEventsSlideUp (Branch)
             │
             ├─ Depends on: activeItem being set
             ├─ Controls: Events panel visibility
             └─ Parent of ──┐
                            │
                 showTalentDetail (Leaf)
                      │
                      ├─ Depends on: showEventsSlideUp being true
                      └─ Controls: Talent detail visibility
```

---

## Event Propagation Flow

### ✅ CORRECT (With stopPropagation)

```
┌─────────────────────────────────────────────────┐
│ User clicks artist button                       │
└────────────────┬────────────────────────────────┘
                 ▼
        ┌────────────────────┐
        │ onClick handler     │
        │ e.stopPropagation() │ ◄── STOPS HERE!
        │ setShowTalentDetail │
        └────────────────────┘
                 ▼
        Artist detail opens
        Events panel stays open ✅
```

### ❌ WRONG (Without stopPropagation)

```
┌─────────────────────────────────────────────────┐
│ User clicks artist button                       │
└────────────────┬────────────────────────────────┘
                 ▼
        ┌────────────────────┐
        │ onClick handler     │
        │ setShowTalentDetail │
        └────────────────────┘
                 │
                 │ Event bubbles up...
                 ▼
        ┌────────────────────┐
        │ Events panel        │
        │ useOnClickOutside   │ ◄── Triggers!
        │ closes events       │
        └────────────────────┘
                 ▼
        Events close ❌
        Artist detail doesn't show ❌
```

---

## Z-Index Stack Visualization

```
┌─────────────────────────────────────────────────┐
│                                      z-[70]     │
│  ┌────────────────────────────────┐             │
│  │  Talent Detail Panel           │             │
│  │  (Slides from right)            │             │
│  └────────────────────────────────┘             │
│                                                  │
├─────────────────────────────────────────────────┤
│                                      z-[60]     │
│  ┌────────────────────────────────────────────┐ │
│  │  Events Slide-Up Panel                     │ │
│  │  (Slides from bottom)                      │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
├─────────────────────────────────────────────────┤
│                                      z-[50]     │
│           ┌─────────────────────┐               │
│           │  Itinerary Card     │               │
│           │  (Centered)         │               │
│           └─────────────────────┘               │
│                                                  │
├─────────────────────────────────────────────────┤
│                                      z-[40]     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░ Backdrop (Semi-transparent) ░░░░░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────┘
```

---

## Close Button Behavior

### Itinerary Close Button

```typescript
// Closes EVERYTHING
onClick={(e) => {
  e.stopPropagation();
  setShowTalentDetail(false);    // 1. Close talent
  setSelectedTalent(null);
  setShowEventsSlideUp(false);   // 2. Close events
  setDayEvents([]);
  setActiveItem(null);           // 3. Close itinerary
}}
```

### Events Close Button

```typescript
// Closes ONLY events (keeps itinerary open)
onClick={(e) => {
  e.stopPropagation();
  setShowEventsSlideUp(false);
  setDayEvents([]);
  // activeItem stays set ✅
}}
```

### Talent Back Button

```typescript
// Closes ONLY talent (keeps events open)
onClick={(e) => {
  e.stopPropagation();
  setShowTalentDetail(false);
  setSelectedTalent(null);
  // showEventsSlideUp stays true ✅
}}
```

---

## Escape Key Cascade

### Sequential Closing (One Layer at a Time)

```
┌─────────────────────────────────────────┐
│ User presses Escape                     │
└──────────────┬──────────────────────────┘
               ▼
        ┌─────────────┐
        │ Is talent   │──YES──► Close talent only
        │ visible?    │
        └──────┬──────┘
               │ NO
               ▼
        ┌─────────────┐
        │ Are events  │──YES──► Close events only
        │ visible?    │
        └──────┬──────┘
               │ NO
               ▼
        ┌─────────────┐
        │ Is itinerary│──YES──► Close itinerary
        │ visible?    │
        └─────────────┘
```

**Benefits:**

- Natural user experience (one step at a time)
- Allows user to navigate back gradually
- Prevents accidental closure of all layers
- Matches user mental model

---

## Pointer Events Configuration

### Backdrop

```typescript
className="fixed inset-0 z-40"  // ✅ Accepts clicks
onClick={() => {
  if (!showEventsSlideUp && !showTalentDetail) {
    setActiveItem(null);  // Only if safe
  }
}}
```

### Container Layer

```typescript
className = 'pointer-events-none fixed inset-0'; // ✅ Passes through
```

### Modal Content

```typescript
className="pointer-events-auto"  // ✅ Accepts clicks
onClick={(e) => e.stopPropagation()}  // ✅ Prevents bubbling
```

---

## Common Pitfalls Avoided

### ❌ Pitfall 1: Missing stopPropagation

**Result:** Clicks bubble up and trigger parent handlers

### ❌ Pitfall 2: Same Z-Index

**Result:** Browser can't determine click targets

### ❌ Pitfall 3: Closing All States at Once

**Result:** Race conditions and broken animations

### ❌ Pitfall 4: Missing useEffect Dependencies

**Result:** Stale closures and incorrect behavior

### ❌ Pitfall 5: No Conditional Closing Logic

**Result:** Closing parent when child is open

---

## Animation Timing

```
Open Sequence:
  Itinerary: 0ms → 300ms (fade + scale)
  Events:    300ms → 600ms (slide up)
  Talent:    600ms → 900ms (slide right)

Close Sequence:
  Talent:    0ms → 300ms (slide right)
  Events:    300ms → 600ms (slide down)
  Itinerary: 600ms → 900ms (fade + scale)
```

**All animations use:**

- Spring physics: `damping: 25, stiffness: 300`
- AnimatePresence for smooth exits
- Framer Motion for performance

---

## Success Metrics

✅ **No screen locking** after any operation
✅ **Artist buttons work** without closing events
✅ **All close methods work** correctly
✅ **Escape key works** progressively
✅ **Animations complete** smoothly
✅ **No TypeScript errors**
✅ **No console errors**
✅ **Proper z-index hierarchy**
✅ **Event propagation handled** correctly

---

**Document Version:** 1.0
**Created:** 2025-10-12
**Status:** Reference Documentation
