# Popover Fix - Visual Test Guide

**Purpose**: Step-by-step guide to verify the popover click-through fix works correctly

---

## Setup

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Navigate to admin trips page:

   ```
   http://localhost:3001/admin/trips
   ```

3. Click "Create New Trip" button to open Trip Wizard modal

---

## Test 1: Build Method Selection (Step 1)

**Expected**: Build method cards are clickable

- [ ] Can select "Start from Scratch"
- [ ] Can select "Clone Existing Trip"
- [ ] Selection is visually indicated
- [ ] "Next" button becomes enabled after selection

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 2: Charter Company Dropdown (Step 2)

**Location**: Basic Info page, left column, first field

### Test 2A: Open and Close

- [ ] Click dropdown trigger - dropdown opens
- [ ] Click outside - dropdown closes
- [ ] Click trigger again - dropdown reopens

**Status**: ⬜ Pass / ⬜ Fail

### Test 2B: Select Item

- [ ] Open dropdown
- [ ] Hover over item - background changes to cyan
- [ ] Click item - item is selected
- [ ] Dropdown closes automatically
- [ ] Selected value shows in trigger button

**Status**: ⬜ Pass / ⬜ Fail

### Test 2C: No Click-Through

- [ ] Open dropdown
- [ ] Move mouse over dropdown items
- [ ] Click an item
- [ ] Verify NO other elements activate (no buttons, no modals, etc.)

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 3: Trip Type Dropdown (Step 2)

**Location**: Basic Info page, left column, second field

### Test 3A: Basic Interaction

- [ ] Open dropdown
- [ ] Select "Cruise" - icon appears below showing cruise ship
- [ ] Open dropdown again
- [ ] Select "Resort" - icon changes to calendar

**Status**: ⬜ Pass / ⬜ Fail

### Test 3B: Overlapping Elements

- [ ] Open Trip Type dropdown
- [ ] Verify it overlaps Trip Name field below
- [ ] Click dropdown item
- [ ] Verify Trip Name field did NOT activate
- [ ] Verify selection worked correctly

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 4: Start Date Picker (Step 2)

**Location**: Basic Info page, left column, third row (left side)

### Test 4A: Open Calendar

- [ ] Click date picker trigger - calendar opens
- [ ] Verify calendar is fully visible
- [ ] Verify calendar is positioned correctly (not cut off)

**Status**: ⬜ Pass / ⬜ Fail

### Test 4B: Select Date

- [ ] Calendar is open
- [ ] Hover over dates - background changes
- [ ] Click a date
- [ ] Date is selected (shows cyan background)
- [ ] Calendar closes automatically
- [ ] Selected date displays in trigger button

**Status**: ⬜ Pass / ⬜ Fail

### Test 4C: No Click-Through

- [ ] Open Start Date calendar
- [ ] Position window so calendar overlaps dropdown above
- [ ] Click a date in the calendar
- [ ] Verify dropdown did NOT open
- [ ] Verify date WAS selected

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 5: End Date Picker (Step 2)

**Location**: Basic Info page, left column, third row (right side)

### Repeat Test 4 Steps for End Date

- [ ] Test 4A: Open Calendar
- [ ] Test 4B: Select Date
- [ ] Test 4C: No Click-Through

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 6: Calendar Navigation

**Location**: Any date picker calendar

### Test 6A: Previous/Next Month

- [ ] Open calendar
- [ ] Click left arrow (previous month)
- [ ] Month changes, calendar stays open
- [ ] Click right arrow (next month)
- [ ] Month changes, calendar stays open

**Status**: ⬜ Pass / ⬜ Fail

### Test 6B: Multiple Interactions

- [ ] Navigate to different month
- [ ] Click a date
- [ ] Reopen calendar
- [ ] Selected date is highlighted
- [ ] Navigate to different month
- [ ] Click a different date
- [ ] New date is selected

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 7: Rapid Interactions

**Purpose**: Test for race conditions and timing issues

### Test 7A: Quick Open/Close

- [ ] Rapidly click dropdown trigger 5 times
- [ ] Dropdown opens and closes correctly each time
- [ ] No errors in console
- [ ] No visual glitches

**Status**: ⬜ Pass / ⬜ Fail

### Test 7B: Quick Selection

- [ ] Open dropdown
- [ ] Immediately click an item (don't wait for animation)
- [ ] Selection works correctly
- [ ] Dropdown closes

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 8: Multiple Popovers Open

**Purpose**: Test z-index stacking with multiple popovers

### Test 8A: Dropdown Over Dropdown

- [ ] Open Charter Company dropdown
- [ ] Without closing, try to open Trip Type dropdown
- [ ] Verify first dropdown closes when second opens
- [ ] Verify no visual overlap issues

**Status**: ⬜ Pass / ⬜ Fail

### Test 8B: Date Picker Over Dropdown

- [ ] Open a dropdown
- [ ] Without closing, open a date picker
- [ ] Verify dropdown closes automatically
- [ ] Verify date picker is fully visible and clickable

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 9: Keyboard Navigation

**Purpose**: Verify keyboard accessibility still works

### Test 9A: Tab Navigation

- [ ] Tab to dropdown trigger
- [ ] Press Enter to open
- [ ] Use arrow keys to navigate items
- [ ] Press Enter to select
- [ ] Dropdown closes, value updates

**Status**: ⬜ Pass / ⬜ Fail

### Test 9B: Escape to Close

- [ ] Open dropdown with click
- [ ] Press Escape key
- [ ] Dropdown closes
- [ ] No errors

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 10: Mobile/Touch Events (if applicable)

**Purpose**: Verify touch events work on mobile devices

### Test 10A: Touch to Open

- [ ] Tap dropdown trigger
- [ ] Dropdown opens
- [ ] Tap item
- [ ] Item selects, dropdown closes

**Status**: ⬜ Pass / ⬜ Fail

### Test 10B: Touch Outside to Close

- [ ] Tap dropdown trigger to open
- [ ] Tap outside dropdown
- [ ] Dropdown closes

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 11: Browser DevTools Verification

**Purpose**: Verify technical implementation

### Test 11A: Z-Index Check

- [ ] Open dropdown
- [ ] Open DevTools (F12)
- [ ] Inspect PopoverContent element
- [ ] Verify computed z-index = 100
- [ ] Verify z-index > Dialog z-index (50)

**Status**: ⬜ Pass / ⬜ Fail

### Test 11B: Pointer Events Check

- [ ] Inspect PopoverContent element
- [ ] Check computed styles
- [ ] Verify `pointer-events: auto`
- [ ] Inspect CommandItem
- [ ] Verify `pointer-events: auto`

**Status**: ⬜ Pass / ⬜ Fail

### Test 11C: Event Listeners

- [ ] Open DevTools Console
- [ ] Open dropdown
- [ ] Click item
- [ ] Verify no errors in console
- [ ] Verify no warnings

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 12: Edge Cases

### Test 12A: Very Long Dropdown Lists

- [ ] Create/find dropdown with 20+ items
- [ ] Open dropdown
- [ ] Scroll to bottom
- [ ] Click bottom item
- [ ] Selection works correctly

**Status**: ⬜ Pass / ⬜ Fail

### Test 12B: Dropdown at Screen Edge

- [ ] Resize browser window to small size
- [ ] Position dropdown near screen edge
- [ ] Open dropdown
- [ ] Verify dropdown repositions if needed
- [ ] Verify all items are clickable

**Status**: ⬜ Pass / ⬜ Fail

### Test 12C: Calendar at Screen Edge

- [ ] Resize browser window
- [ ] Position date picker at bottom of screen
- [ ] Open calendar
- [ ] Verify calendar repositions above trigger
- [ ] Verify dates are clickable

**Status**: ⬜ Pass / ⬜ Fail

---

## Success Criteria

**All tests must pass** with no:

- Click-through to underlying elements
- Unresponsive buttons or dates
- Console errors or warnings
- Visual glitches or overlaps
- Unexpected behavior

---

## If Tests Fail

### Debugging Steps:

1. **Check Browser Console**
   - Look for errors
   - Look for warnings about pointer events

2. **Inspect Element in DevTools**
   - Verify z-index is 100
   - Verify pointer-events is auto
   - Check for conflicting CSS

3. **Check DOM Hierarchy**
   - Verify Popover is rendering to body
   - Verify it's outside Dialog in DOM tree
   - Look for stacking context issues

4. **Review Recent Changes**
   - Check if other CSS was added
   - Look for conflicting z-index values
   - Check for pointer-events: none in parent

5. **Test in Different Browser**
   - Try Chrome, Firefox, Safari
   - Check for browser-specific issues

---

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________ Version: ___________
OS: ___________

Test 1: ⬜ Pass ⬜ Fail
Test 2: ⬜ Pass ⬜ Fail
Test 3: ⬜ Pass ⬜ Fail
Test 4: ⬜ Pass ⬜ Fail
Test 5: ⬜ Pass ⬜ Fail
Test 6: ⬜ Pass ⬜ Fail
Test 7: ⬜ Pass ⬜ Fail
Test 8: ⬜ Pass ⬜ Fail
Test 9: ⬜ Pass ⬜ Fail
Test 10: ⬜ Pass ⬜ Fail
Test 11: ⬜ Pass ⬜ Fail
Test 12: ⬜ Pass ⬜ Fail

Overall: ⬜ Pass ⬜ Fail

Notes:
___________________________________________
___________________________________________
___________________________________________
```

---

**Last Updated**: 2025-09-30
**Version**: 1.0
