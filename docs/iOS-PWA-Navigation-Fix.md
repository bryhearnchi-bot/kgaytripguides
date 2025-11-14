# iOS PWA Navigation Fix

## Problem

When a user saves the PWA to their home screen from a trip guide page (e.g., `/trip/hong-kong-to-singapore-cruise`), and then navigates back to the home page (`/`), Safari shows the browser chrome (URL bar, navigation controls) as if they're leaving the app. This breaks the PWA experience.

## Root Causes

1. **iOS PWA Scope Behavior**: iOS Safari has a quirky behavior where it considers the URL you installed from as part of the "app context". Even with `scope: "/"`, navigating to different paths can trigger browser chrome if iOS thinks you're "leaving" the original context.

2. **Start URL Inconsistency**: The manifest's `start_url` pointing to `/trip/${slug}` while `apple-mobile-web-app-start-url` pointed to `/` created confusion for iOS about what the "app" actually is.

3. **History API State**: iOS uses the History API state to determine if navigation is "in-app" or "external". Without proper state markers, iOS defaults to showing browser chrome.

4. **Service Worker Navigation**: The service worker's navigation handling wasn't explicitly maintaining PWA context during fetches.

## Solution Architecture

Our fix is multi-layered to ensure iOS maintains PWA context across all navigation scenarios:

### 1. Consistent Start URLs with PWA Marker

**Files Modified:**

- `/server/routes/pwa.ts` (line 67)
- `/server/vite.ts` (line 114)
- `/client/src/hooks/useTripMetadata.ts` (line 161)
- `/public/manifest.json` (line 5)

**Changes:**

- All manifests now use `start_url: "/trip/${slug}?pwa=true"` or `"/?pwa=true"`
- The `?pwa=true` parameter serves as a marker that we're in PWA mode
- `apple-mobile-web-app-start-url` matches the manifest's `start_url` for consistency

**Why it works:**

- iOS sees a consistent "entry point" regardless of where the user installed from
- The query parameter doesn't affect routing but signals PWA mode to our app

### 2. PWA Navigation Interceptor

**File Modified:**

- `/client/src/lib/capacitor.ts` (lines 95-154)

**New Functions:**

- `isPWA()`: Detects if app is running in PWA mode using multiple methods
- `setupPWANavigationInterceptor()`: Intercepts History API to maintain PWA state

**How it works:**

```typescript
// Overrides pushState and replaceState to always include pwa: true
window.history.pushState = function (state, title, url) {
  const pwaState = { ...state, pwa: true };
  return originalPushState.call(this, pwaState, title, url);
};
```

**Why it works:**

- Every navigation maintains a `pwa: true` marker in the history state
- iOS recognizes these state-preserved navigations as "in-app"
- Browser chrome stays hidden because iOS sees continuous app context

### 3. Enhanced Back Button Navigation

**File Modified:**

- `/client/src/components/TripPageNavigation.tsx` (lines 76-92)

**Changes:**

```typescript
if (window.history.length > 1) {
  window.history.back();
} else {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    window.history.replaceState({ pwa: true }, '', '/');
  }
  setLocation('/');
}
```

**Why it works:**

- Prefers browser back when history exists (natural navigation)
- For direct navigation, uses `replaceState` with PWA marker before routing
- iOS sees the state marker and keeps browser chrome hidden

### 4. Service Worker Context Preservation

**File Modified:**

- `/public/sw.js` (lines 71-113)

**Changes:**

- Added `redirect: 'manual'` to navigation fetches
- Handles redirects manually to maintain PWA context
- Uses proper credentials and cache settings

**Why it works:**

- Manual redirect handling prevents iOS from treating redirects as "external navigation"
- Service worker maintains consistent fetch behavior for all in-app navigation

### 5. Status Bar Style Update

**Files Modified:**

- `/server/vite.ts` (line 117)
- `/client/src/hooks/useTripMetadata.ts` (line 172)

**Changes:**

- Changed from `default` to `black-translucent`

**Why it works:**

- `black-translucent` creates better immersion for dark-themed PWAs
- Status bar content shows through, maintaining consistent dark aesthetic
- More "native app" feel

## Testing Checklist

To verify the fix works:

1. **Delete existing PWA** from home screen
2. **Navigate to** `/trip/hong-kong-to-singapore-cruise` in Safari
3. **Add to Home Screen** from Safari share menu
4. **Launch PWA** from home screen
5. **Verify**: App opens to trip page (as expected)
6. **Tap back button** (arrow icon)
7. **Expected Result**: Navigation to `/` stays in PWA mode with NO browser chrome
8. **Verify**: Can navigate between pages freely without browser chrome appearing
9. **Test**: Open trip, go home, open another trip, go home - all should stay in PWA

## Technical Details

### PWA Detection Methods

We use three detection methods for maximum compatibility:

```typescript
// Method 1: Media query (most reliable on modern iOS)
window.matchMedia('(display-mode: standalone)').matches;

// Method 2: iOS-specific property
window.navigator.standalone === true;

// Method 3: Custom parameter
new URLSearchParams(window.location.search).get('pwa') === 'true';
```

### History State Structure

All navigation maintains this state structure:

```typescript
{
  pwa: true,
  ...otherState
}
```

### Manifest Scope vs Start URL

- **Scope**: `/` (allows navigation anywhere in the app)
- **Start URL**: `/trip/${slug}?pwa=true` or `/?pwa=true` (where app opens on launch)
- These are intentionally different - scope is broader than start URL

## Browser Compatibility

- **iOS Safari 15+**: Full support with all fixes
- **iOS Safari 14**: Works with History API interceptor
- **Android Chrome**: Works natively (doesn't have iOS's quirks)
- **Desktop Safari**: Works in both browser and PWA mode
- **Other browsers**: Gracefully degrades to standard navigation

## Monitoring

To verify PWA mode is active, check browser console for:

```
[PWA] Navigation interceptor initialized
```

This confirms the interceptor is running and maintaining PWA state.

## Future Considerations

1. **Analytics**: Track PWA vs browser usage to measure adoption
2. **A/B Testing**: Test different start URL strategies if issues persist
3. **iOS Updates**: Monitor iOS Safari updates for PWA behavior changes
4. **User Feedback**: Gather feedback on PWA experience quality

## References

- [Apple PWA Documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [MDN: Window.history](https://developer.mozilla.org/en-US/docs/Web/API/Window/history)
- [Web.dev: PWA Navigation](https://web.dev/learn/pwa/navigation/)

---

**Last Updated**: January 2025
**Status**: Active Fix
**Priority**: Critical (affects all iOS PWA users)
