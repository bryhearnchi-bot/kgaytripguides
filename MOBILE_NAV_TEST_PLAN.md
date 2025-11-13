# Mobile Navigation Auto-Hide - Testing Plan

## Quick Test (5 minutes)

### Setup

1. Deploy to Railway or run locally with `npm run dev`
2. Open on iPhone (Safari, Chrome, or PWA)
3. Navigate to landing page (trip list)

### Test Scenarios

#### ✅ Basic Scroll Down/Up

1. Scroll down 100-200px
   - **Expected**: Both top and bottom nav hide smoothly
2. Scroll up any amount
   - **Expected**: Both nav bars immediately reappear

#### ✅ iOS Bounce Scroll

1. Pull down at top of page (rubber-band effect)
   - **Expected**: Nav stays visible (no flickering)
2. Release
   - **Expected**: Nav remains visible

#### ✅ Slow Scroll

1. Scroll down very slowly (1-2 pixels at a time)
   - **Expected**: Nav hides once you pass ~50px threshold
   - Should not flicker or hide/show repeatedly

#### ✅ Fast Scroll

1. Flick/swipe down quickly
   - **Expected**: Nav hides smoothly, no lag
2. Flick/swipe up quickly
   - **Expected**: Nav appears smoothly

#### ✅ PWA Mode Specific

1. Install app to home screen
2. Open from home screen
3. Repeat all scroll tests
   - **Expected**: Same behavior as browser
   - Status bar integration should not interfere

#### ✅ Route Changes

1. Hide nav by scrolling down
2. Tap a trip card (route change)
   - **Expected**: Nav should be visible on new page
3. Scroll in trip guide
   - **Expected**: Auto-hide works on trip page too

### Visual Checklist

- [ ] No flash of wrong position on page load
- [ ] Smooth 60fps animation (no jank)
- [ ] No white gaps during hide/show
- [ ] Safe area (notch, home indicator) properly handled
- [ ] Backdrop blur effect maintained during animation
- [ ] No layout shift when hiding/showing

## Detailed Test (Full QA)

### iOS Safari

#### Portrait Mode

- [ ] iPhone 13+ (with notch)
- [ ] iPhone SE (no notch)
- [ ] Scroll down → Nav hides
- [ ] Scroll up → Nav shows
- [ ] Bounce scroll → No flicker
- [ ] Page refresh → Nav visible on load
- [ ] Landscape rotation → Nav adapts correctly

#### Landscape Mode

- [ ] Same device tests as portrait
- [ ] Notch handling (if applicable)
- [ ] Safe areas respected

### iOS Chrome

- [ ] All portrait tests
- [ ] All landscape tests
- [ ] Chrome toolbar interaction
- [ ] Address bar hide/show doesn't interfere

### PWA Mode - iOS

- [ ] Install from Safari (Add to Home Screen)
- [ ] Open from home screen
- [ ] Status bar integration correct
- [ ] All scroll behaviors work
- [ ] Safe areas correct
- [ ] Splash screen → nav transition smooth

### PWA Mode - Android

- [ ] Install from Chrome
- [ ] Open from home screen
- [ ] System UI integration correct
- [ ] All scroll behaviors work

### Edge Cases

#### Minimal Scroll Room

1. Open page with little content (short trip list)
   - [ ] Nav hides if possible
   - [ ] No errors in console
   - [ ] Smooth behavior

#### Bottom of Page

1. Scroll to very bottom
2. Try to scroll more (bounce)
   - [ ] Nav handles gracefully
   - [ ] No position glitches

#### Rapid Route Changes

1. Hide nav by scrolling
2. Quickly navigate between pages
   - [ ] Nav resets correctly each time
   - [ ] No stuck hidden state

#### Device Rotation During Scroll

1. Start scrolling (hide nav)
2. Rotate device mid-scroll
   - [ ] Nav responds correctly after rotation
   - [ ] No layout issues

#### Tab Switch and Return

1. Hide nav by scrolling
2. Switch to another tab/app
3. Return to app
   - [ ] Nav state preserved or reset reasonably
   - [ ] No visual glitches

### Performance Checks

#### DevTools (Safari/Chrome)

- [ ] Open performance monitor
- [ ] Scroll up/down repeatedly
- [ ] Check FPS stays at/near 60fps
- [ ] Check for layout thrashing
- [ ] Verify GPU compositing (green layer)

#### Console Logs

- [ ] No errors during scroll
- [ ] No warnings about forced reflow
- [ ] requestAnimationFrame working correctly

#### Memory

- [ ] No memory leaks during repeated scrolling
- [ ] Event listeners properly cleaned up

### Accessibility

- [ ] VoiceOver (iOS) - Can navigate to nav items
- [ ] TalkBack (Android) - Can navigate to nav items
- [ ] High contrast mode - Nav still visible
- [ ] Large text mode - Nav scales correctly
- [ ] Reduce motion - Animation respects preference

## Known Limitations

1. **Scroll Threshold**: Nav won't hide until 50px scroll (intentional for stability)
2. **Desktop**: Auto-hide only works on mobile (`xl:hidden` class)
3. **Very Short Pages**: May not hide if page height is minimal

## Rollback Triggers

If any of these occur, consider rollback:

- [ ] Nav gets stuck hidden
- [ ] Severe performance issues (< 30fps)
- [ ] Layout breaks on specific devices
- [ ] iOS safe areas broken
- [ ] PWA mode completely broken

## Success Criteria

✅ **Must Have**

- Smooth 60fps animation on iPhone 13+
- No flicker during iOS bounce scroll
- Nav visible after route changes
- Safe areas respected
- Works in PWA mode

✅ **Nice to Have**

- Works on older iOS versions (iOS 14+)
- Smooth on Android
- No console warnings

## Bug Reporting Template

If issues found:

```
**Device**: iPhone 13 Pro / iOS 17.2
**Browser**: Safari / Chrome / PWA
**Issue**: Nav gets stuck hidden after...
**Steps to Reproduce**:
1. Open app
2. Scroll down 200px
3. ...

**Expected**: Nav should reappear
**Actual**: Nav stays hidden

**Console Errors**: (paste any errors)
**Screenshot**: (if applicable)
```

---

**Test Started**: ******\_\_\_******
**Tested By**: ******\_\_\_******
**Result**: ⬜ Pass / ⬜ Fail / ⬜ Pass with Minor Issues
**Notes**:
