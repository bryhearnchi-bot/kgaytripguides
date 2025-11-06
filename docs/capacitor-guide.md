# Capacitor Guide for KGay Travel Guides

## Table of Contents

1. [What is Capacitor?](#what-is-capacitor)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Development Workflow](#development-workflow)
5. [Essential Plugins](#essential-plugins)
6. [Configuration](#configuration)
7. [Testing on Devices](#testing-on-devices)
8. [Common Gotchas](#common-gotchas)
9. [Performance Optimization](#performance-optimization)
10. [Building for Release](#building-for-release)

---

## What is Capacitor?

**Capacitor is a native runtime for web apps** created by the Ionic team. It turns your React PWA into real iOS and Android apps that can be published to the App Store and Play Store.

### Technical Architecture

```
┌─────────────────────────────────────────┐
│         Native App Container             │
│  ┌───────────────────────────────────┐  │
│  │       WKWebView (iOS)             │  │
│  │    or WebView (Android)           │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Your React App            │  │  │
│  │  │   (HTML/CSS/JS)             │  │  │
│  │  │   - Components              │  │  │
│  │  │   - Routing                 │  │  │
│  │  │   - Business Logic          │  │  │
│  │  └─────────────────────────────┘  │  │
│  │              ↕                     │  │
│  │      Capacitor Bridge              │  │
│  │  (JavaScript ↔ Native)             │  │
│  └───────────────────────────────────┘  │
│              ↕                           │
│      Native APIs & Plugins               │
│  - Camera, Filesystem, Push, etc.        │
└─────────────────────────────────────────┘
```

### Key Concepts

- Your React app runs in a **native WebView** (not Safari/Chrome)
- **Capacitor Bridge** enables JavaScript to call native code
- **Plugins** expose native APIs (camera, storage, etc.) to your JavaScript
- Apps are **real native apps**, not mobile websites
- You get **App Store/Play Store distribution** while keeping your React codebase

### Why Capacitor for This Project?

1. **90%+ code reuse** - Keep your entire React/TypeScript codebase
2. **Fast time to market** - Ships in weeks, not months
3. **Single codebase** - Maintain one app for web, iOS, and Android
4. **Progressive enhancement** - Add native features incrementally
5. **PWA-friendly** - Works great with your existing PWA infrastructure

---

## Prerequisites

### For iOS Development

**You MUST have:**

- **Mac computer** running macOS 12 or later
- **Xcode 14+** (free from App Store, ~15GB download)
  - Download from: App Store → Search "Xcode" → Install
- **CocoaPods** (dependency manager for iOS)
  ```bash
  sudo gem install cocoapods
  ```
- **Apple Developer Account**
  - Free tier: Test on your own devices
  - Paid ($99/year): Publish to App Store, TestFlight beta testing

**Can test on:**

- iOS Simulator (included with Xcode, no device needed)
- Your own iPhone/iPad (free, just need Apple ID)
- TestFlight beta testers (requires paid Developer Account)

### For Android Development

**You can use Mac, Windows, or Linux:**

- **Android Studio** (free, ~4GB download)
  - Download from: https://developer.android.com/studio
  - Includes Android SDK and emulators
- **Java JDK 17** (included with Android Studio)

**Can test on:**

- Android Emulator (included with Android Studio)
- Any Android device with USB debugging enabled (free)
- Play Console beta testing (requires one-time $25 developer fee)

### Checking Prerequisites

```bash
# Check if Xcode is installed (macOS only)
xcode-select --version

# Check if CocoaPods is installed
pod --version

# Check if Java is installed
java -version

# Check if Android Studio's tools are in PATH
adb --version
```

---

## Installation & Setup

### Step 1: Install Capacitor (5 minutes)

```bash
# Navigate to your project root
cd /path/to/kgay-travel-guides

# Install Capacitor packages
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init
```

**You'll be prompted for:**

- **App name:** `KGay Travel Guides`
- **App ID:** `com.kgaytravel.guides` (reverse domain notation, used in app stores)
- **Web asset directory:** `dist/public` (your Vite build output)

This creates:

- `capacitor.config.ts` - Main configuration file
- Updates `package.json` with Capacitor dependencies

### Step 2: Add iOS Platform (10 minutes)

```bash
# Add iOS native project
npx cap add ios
```

This creates:

- `ios/` folder with complete Xcode project
- `ios/App/App.xcworkspace` - Xcode workspace (this is what you open)
- `ios/Podfile` - CocoaPods dependencies
- Native Swift/Objective-C boilerplate code

**First iOS build:**

```bash
# Build your web app
npm run build

# Copy web assets to iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

**In Xcode:**

1. Wait for indexing to complete (~1-2 minutes)
2. Click on "App" in the left sidebar (project settings)
3. Go to "Signing & Capabilities" tab
4. Select your Team (your Apple ID)
5. Choose a simulator from the device dropdown (e.g., "iPhone 15 Pro")
6. Click the ▶️ Play button (or press Cmd+R)
7. **Your app launches!** 🎉

### Step 3: Add Android Platform (10 minutes)

```bash
# Add Android native project
npx cap add android
```

This creates:

- `android/` folder with complete Android Studio project
- `android/app/build.gradle` - Build configuration
- `android/app/src/main/AndroidManifest.xml` - App manifest
- Native Java/Kotlin boilerplate code

**First Android build:**

```bash
# Copy web assets to Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

**In Android Studio:**

1. Wait for Gradle sync to complete (~2-5 minutes first time)
2. If prompted to update Gradle or Android SDK, accept
3. Click "AVD Manager" toolbar button (phone with Android icon)
4. Create a virtual device if you don't have one:
   - Click "Create Virtual Device"
   - Choose "Pixel 7" or similar
   - Download a system image (API 33 or 34 recommended)
5. Click the ▶️ Run button (green triangle)
6. Select your emulator
7. **Your app launches!** 🎉

### Step 4: Update package.json Scripts

Add these convenience scripts to `package.json`:

```json
{
  "scripts": {
    "build": "vite build",

    "cap:sync": "npm run build && npx cap sync",
    "cap:ios": "npm run cap:sync && npx cap open ios",
    "cap:android": "npm run cap:sync && npx cap open android",

    "cap:serve:ios": "npx cap run ios --livereload --external",
    "cap:serve:android": "npx cap run android --livereload --external"
  }
}
```

Now you can use:

- `npm run cap:ios` - Build, sync, and open Xcode
- `npm run cap:android` - Build, sync, and open Android Studio
- `npm run cap:serve:ios` - Run with live reload (dev mode)

---

## Development Workflow

### Daily Development Workflow

```bash
# Terminal 1: Run your React dev server as usual
npm run dev

# Make changes to your React code...
# Vite hot-reloads in the browser as normal

# When ready to test in native apps:
npm run build           # Build production bundle
npx cap sync           # Copy to iOS and Android

# Then in Xcode or Android Studio, press Run (▶️)
```

### Live Reload in Native Apps (Advanced)

For faster iteration, you can configure native apps to load from your dev server:

**capacitor.config.ts:**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kgaytravel.guides',
  appName: 'KGay Travel Guides',
  webDir: 'dist/public',

  // Development only: load from local server
  server: {
    url: 'http://localhost:3001',
    cleartext: true, // Allow HTTP in development
  },
};

export default config;
```

**Important:** Remove or comment out the `server` config before building for production!

Or use the command:

```bash
npm run cap:serve:ios
# This automatically configures live reload
```

### When to Sync

Run `npx cap sync` when you:

- Add or update Capacitor plugins
- Change `capacitor.config.ts`
- Want to test latest web build in native app
- Update native permissions (iOS Info.plist, Android AndroidManifest.xml)

---

## Essential Plugins

### Core Plugins (Official Capacitor)

All plugins are installed with npm and work on both iOS and Android.

#### 1. Status Bar

Style the native status bar (top of screen with time, battery, etc.).

```bash
npm install @capacitor/status-bar
```

**Usage:**

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// Set to dark icons (for light backgrounds)
await StatusBar.setStyle({ style: Style.Light });

// Set to light icons (for dark backgrounds)
await StatusBar.setStyle({ style: Style.Dark });

// Android: set background color
await StatusBar.setBackgroundColor({ color: '#1e40af' });

// Hide status bar
await StatusBar.hide();

// Show status bar
await StatusBar.show();
```

#### 2. Splash Screen

Native launch screen while your app loads.

```bash
npm install @capacitor/splash-screen
```

**Usage:**

```typescript
import { SplashScreen } from '@capacitor/splash-screen';

// Show splash (usually automatic)
await SplashScreen.show({
  showDuration: 2000,
  autoHide: true,
});

// Hide splash manually (after app is ready)
await SplashScreen.hide();
```

**Configuration in capacitor.config.ts:**

```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    backgroundColor: '#1e40af',
    androidSplashResourceName: 'splash',
    androidScaleType: 'CENTER_CROP',
    showSpinner: false,
    iosSpinnerStyle: 'small',
    spinnerColor: '#ffffff'
  }
}
```

#### 3. App

Access app information and handle lifecycle events.

```bash
npm install @capacitor/app
```

**Usage:**

```typescript
import { App } from '@capacitor/app';

// Get app info
const info = await App.getInfo();
console.log('App version:', info.version);
console.log('App ID:', info.id);

// Listen for app state changes
App.addListener('appStateChange', ({ isActive }) => {
  if (isActive) {
    console.log('App came to foreground');
    // Refresh data, resume music, etc.
  } else {
    console.log('App went to background');
    // Pause operations, save state, etc.
  }
});

// Listen for app URL opens (deep linking)
App.addListener('appUrlOpen', event => {
  // event.url = "kgaytravel://trips/aqua-2025"
  const slug = event.url.split('trips/')[1];
  // Navigate to trip in your app
});

// Handle back button (Android)
App.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    App.exitApp(); // Exit if can't go back
  } else {
    window.history.back(); // Navigate back
  }
});
```

#### 4. Preferences (Secure Storage)

Store data securely using native Keychain (iOS) or Keystore (Android).

```bash
npm install @capacitor/preferences
```

**Usage:**

```typescript
import { Preferences } from '@capacitor/preferences';

// Set a value
await Preferences.set({
  key: 'authToken',
  value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
});

// Get a value
const { value } = await Preferences.get({ key: 'authToken' });
console.log('Token:', value);

// Remove a value
await Preferences.remove({ key: 'authToken' });

// Clear all values
await Preferences.clear();

// Get all keys
const { keys } = await Preferences.keys();
console.log('Stored keys:', keys);
```

**Use this for:**

- Authentication tokens (more secure than localStorage)
- User preferences
- Sensitive data

#### 5. Haptics

Provide tactile feedback (vibration).

```bash
npm install @capacitor/haptics
```

**Usage:**

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Light impact (button tap)
await Haptics.impact({ style: ImpactStyle.Light });

// Medium impact
await Haptics.impact({ style: ImpactStyle.Medium });

// Heavy impact (important action)
await Haptics.impact({ style: ImpactStyle.Heavy });

// Notification feedback
import { NotificationType } from '@capacitor/haptics';
await Haptics.notification({ type: NotificationType.Success });
await Haptics.notification({ type: NotificationType.Warning });
await Haptics.notification({ type: NotificationType.Error });

// Vibrate (simple)
await Haptics.vibrate();
```

**Add to:**

- Button presses
- Navigation transitions
- Form submissions
- Pull-to-refresh
- Success/error states

#### 6. Share

Native share sheet (share links, text, files).

```bash
npm install @capacitor/share
```

**Usage:**

```typescript
import { Share } from '@capacitor/share';

// Check if sharing is available
const canShare = await Share.canShare();

// Share a URL
await Share.share({
  title: 'Check out Aqua 2025!',
  text: 'Join us for an amazing LGBTQ+ cruise experience',
  url: 'https://atlantisevents.com/trips/aqua-2025',
  dialogTitle: 'Share Trip',
});

// Share with files
await Share.share({
  title: 'Trip Itinerary',
  files: ['/path/to/itinerary.pdf'],
  dialogTitle: 'Share Itinerary',
});
```

#### 7. Camera (Optional)

Access device camera and photo library.

```bash
npm install @capacitor/camera
```

**Usage:**

```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// Take a photo
const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Uri, // File URI
  source: CameraSource.Camera, // Force camera (not library)
});

console.log('Photo path:', photo.path);
console.log('Photo webPath:', photo.webPath);

// Choose from library
const libraryPhoto = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  resultType: CameraResultType.Base64, // Base64 string
  source: CameraSource.Photos,
});

// Prompt user to choose camera or library
const userPhoto = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Uri,
  source: CameraSource.Prompt,
});
```

**Use for:**

- Profile picture uploads
- Trip image uploads
- Talent photo uploads

#### 8. Push Notifications (Optional)

Native push notifications (requires backend setup).

```bash
npm install @capacitor/push-notifications
```

**Usage:**

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Request permission
const permission = await PushNotifications.requestPermissions();

if (permission.receive === 'granted') {
  // Register with APNs (iOS) or FCM (Android)
  await PushNotifications.register();
}

// Listen for registration token
PushNotifications.addListener('registration', token => {
  console.log('Push token:', token.value);
  // Send token to your server
});

// Listen for push notifications
PushNotifications.addListener('pushNotificationReceived', notification => {
  console.log('Push received:', notification);
});

// Handle notification tap
PushNotifications.addListener('pushNotificationActionPerformed', action => {
  console.log('Push action:', action);
  // Navigate to relevant screen
});
```

**Requires:**

- iOS: APNs certificate from Apple Developer
- Android: Firebase Cloud Messaging (FCM) setup
- Backend to send notifications

---

## Configuration

### capacitor.config.ts

Main configuration file for Capacitor.

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kgaytravel.guides',
  appName: 'KGay Travel Guides',
  webDir: 'dist/public',

  // iOS-specific configuration
  ios: {
    contentInset: 'always', // Handle safe areas (notch, etc.)
    backgroundColor: '#ffffff',
    scrollEnabled: true,
    allowsLinkPreview: false,
  },

  // Android-specific configuration
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false, // HTTPS only
    captureInput: true, // Keyboard behavior
    webContentsDebuggingEnabled: false, // Set true for debugging
  },

  // Plugin configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e40af',
      showSpinner: false,
    },

    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    StatusBar: {
      style: 'dark', // or 'light'
      backgroundColor: '#1e40af',
    },
  },

  // Development server (remove for production)
  // server: {
  //   url: 'http://localhost:3001',
  //   cleartext: true
  // }
};

export default config;
```

### iOS Configuration

**ios/App/App/Info.plist** - iOS permissions and settings

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- App name -->
  <key>CFBundleDisplayName</key>
  <string>KGay Travel Guides</string>

  <!-- Camera permission -->
  <key>NSCameraUsageDescription</key>
  <string>Upload photos for your trip</string>

  <!-- Photo library permission -->
  <key>NSPhotoLibraryUsageDescription</key>
  <string>Choose photos from your library</string>

  <!-- Location permission (if needed) -->
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>Show your location on the map</string>

  <!-- URL schemes for deep linking -->
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLSchemes</key>
      <array>
        <string>kgaytravel</string>
      </array>
    </dict>
  </array>

  <!-- Universal Links (for https:// deep links) -->
  <key>com.apple.developer.associated-domains</key>
  <array>
    <string>applinks:atlantisevents.com</string>
  </array>
</dict>
</plist>
```

### Android Configuration

**android/app/src/main/AndroidManifest.xml** - Android permissions and settings

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

    <application
        android:label="KGay Travel Guides"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Deep linking: kgaytravel:// URLs -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="kgaytravel" />
            </intent-filter>

            <!-- App Links: https:// URLs -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="atlantisevents.com" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## Testing on Devices

### iOS: Testing on Simulator

**No account needed, completely free.**

1. Open Xcode (`npx cap open ios`)
2. Click the device dropdown (next to "App" in toolbar)
3. Choose any simulator (e.g., "iPhone 15 Pro")
4. Press ▶️ Run (or Cmd+R)
5. Simulator launches with your app

**Limitations:**

- No camera access
- No push notifications
- May behave differently than real device

### iOS: Testing on Your iPhone

**Requires free Apple ID.**

1. **Connect iPhone to Mac** via USB cable
2. **Unlock iPhone** and tap "Trust This Computer"
3. **In Xcode:**
   - Click device dropdown
   - Select your iPhone (appears at top)
   - Press ▶️ Run
4. **On iPhone first time only:**
   - App installs but won't open (untrusted developer)
   - Settings → General → VPN & Device Management
   - Tap your Apple ID
   - Tap "Trust"
5. **Now open app** on iPhone - works!

**Notes:**

- App expires after 7 days (free account) - just rebuild
- Paid Developer Account ($99/year) = apps last 1 year

### Android: Testing on Emulator

**Completely free.**

1. **Open Android Studio** (`npx cap open android`)
2. **AVD Manager** (phone icon in toolbar)
3. **Create Virtual Device** if you don't have one:
   - Choose "Pixel 7" or similar
   - Click "Next"
   - Download a system image (API 33 or 34 recommended)
   - Click "Finish"
4. **Click ▶️ Run** (green triangle)
5. **Select your emulator**
6. Emulator launches with your app

### Android: Testing on Real Device

**Completely free.**

1. **Enable Developer Mode on your Android phone:**
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - You'll see "You are now a developer!"
2. **Enable USB Debugging:**
   - Settings → System → Developer Options
   - Toggle "USB Debugging" on
3. **Connect phone to computer** via USB
4. **Allow USB debugging** (prompt on phone)
5. **In Android Studio:**
   - Click ▶️ Run
   - Select your device (appears in list)
6. App installs and launches!

---

## Common Gotchas

### 1. CORS Errors (False Alarm)

**Problem:** You see CORS errors in native app console.

**Reality:** CORS doesn't apply to native apps! If you're seeing connection issues, it's not CORS.

**Solution:** Check:

- Is `VITE_API_URL` pointing to the right server?
- Is the API server running and accessible?
- Are you using the production API URL in native builds?

```typescript
// Detect platform and use appropriate API URL
import { Capacitor } from '@capacitor/core';

const API_URL = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_API_URL_NATIVE || 'https://your-production-api.com'
  : import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### 2. Service Worker Conflicts

**Problem:** Service worker caches prevent native app updates.

**Solution:** Disable service worker in native apps.

```typescript
import { Capacitor } from '@capacitor/core';

// Only register service worker on web
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 3. Assets Not Loading (404 Errors)

**Problem:** Images, fonts, or other assets return 404.

**Solution:** Use relative paths, not absolute.

```typescript
// ❌ BAD - Won't work in native
<img src="/assets/logo.png" />

// ✅ GOOD - Works everywhere
<img src="./assets/logo.png" />

// ✅ BEST - Use Vite imports
import logo from '@/assets/logo.png';
<img src={logo} />
```

### 4. White Screen on Launch

**Problem:** App shows white screen, then works.

**Solution:** Show splash screen while app loads.

```typescript
// In your app's entry point (main.tsx or App.tsx)
import { SplashScreen } from '@capacitor/splash-screen';

// Hide splash after app is ready
useEffect(() => {
  // Wait for initial data to load
  async function init() {
    await loadInitialData();
    await SplashScreen.hide();
  }
  init();
}, []);
```

### 5. Safe Area Issues (Notch, etc.)

**Problem:** Content hidden behind iPhone notch or Android gesture bar.

**Solution:** Use safe area insets.

```css
/* Global CSS */
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
  --safe-area-inset-right: env(safe-area-inset-right);
}

/* Apply to fixed headers */
.header {
  padding-top: calc(1rem + var(--safe-area-inset-top));
}

/* Apply to fixed footers/navigation */
.bottom-nav {
  padding-bottom: calc(1rem + var(--safe-area-inset-bottom));
}
```

```html
<!-- In index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### 6. Keyboard Pushing Content

**Problem:** Keyboard covers input fields.

**Solution:** Capacitor handles this automatically, but you can customize:

```typescript
// In capacitor.config.ts
android: {
  captureInput: true, // Enable keyboard handling
}
```

If still issues, use `KeyboardResize` plugin or scroll input into view.

### 7. Different Behavior: Web vs Native

**Problem:** Some features work on web but not native (or vice versa).

**Solution:** Detect platform and adjust:

```typescript
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const isIOS = Capacitor.getPlatform() === 'ios';
const isAndroid = Capacitor.getPlatform() === 'android';
const isWeb = Capacitor.getPlatform() === 'web';

if (isNative) {
  // Use native APIs
  import { Camera } from '@capacitor/camera';
  const photo = await Camera.getPhoto({...});
} else {
  // Use web APIs
  const file = await input.files[0];
}
```

### 8. localhost Not Accessible

**Problem:** Native app can't reach `http://localhost:3001`.

**Solution:** Use your computer's IP address for live reload:

```typescript
// capacitor.config.ts (development only)
server: {
  url: 'http://192.168.1.100:3001', // Your computer's local IP
  cleartext: true
}
```

Find your IP:

- macOS: System Preferences → Network
- Windows: `ipconfig`
- Linux: `ip addr`

---

## Performance Optimization

### 1. Reduce Bundle Size

Your app is already well-optimized (161KB gzipped), but for native:

```typescript
// Ensure code splitting is working
const TripGuide = lazy(() => import('@/pages/TripGuide'));
```

Check build output:

```bash
npm run build
# Look for chunk sizes in output
```

### 2. Optimize Images

Already using lazy loading, but can add:

```typescript
// Use Capacitor's built-in caching
import { CapacitorHttp } from '@capacitor/core';

const response = await CapacitorHttp.get({
  url: imageUrl,
  headers: { 'Cache-Control': 'max-age=86400' },
});
```

### 3. Smooth Animations

Test animations in WebView. If janky:

```css
/* Add hardware acceleration */
.animated-element {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}
```

Reduce complex animations or use native alternatives.

### 4. List Performance

For long lists (talent, events), add virtualization:

```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={talents.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TalentCard talent={talents[index]} />
    </div>
  )}
</FixedSizeList>
```

### 5. Database Queries

Already optimized with indexes. For native apps, consider adding local caching:

```typescript
import { Preferences } from '@capacitor/preferences';

// Cache API responses locally
async function getCachedTrips() {
  const { value } = await Preferences.get({ key: 'trips_cache' });
  if (value) {
    return JSON.parse(value);
  }

  const trips = await fetchTripsFromAPI();
  await Preferences.set({
    key: 'trips_cache',
    value: JSON.stringify(trips),
  });

  return trips;
}
```

---

## Building for Release

### iOS: Build for TestFlight

**Prerequisites:**

- Paid Apple Developer Account ($99/year)
- App Store Connect account
- App ID created in Developer Portal

**Steps:**

1. **Open Xcode** (`npx cap open ios`)

2. **Configure Signing:**
   - Click "App" in sidebar
   - "Signing & Capabilities" tab
   - Select your team
   - Ensure "Automatically manage signing" is checked

3. **Set Build Target:**
   - Change scheme to "Any iOS Device (arm64)"
   - Or select a specific device if connected

4. **Archive:**
   - Product → Archive
   - Wait for build to complete (~2-5 minutes)

5. **Distribute:**
   - Organizer window appears
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Click "Upload"
   - Wait for upload (~5-10 minutes)

6. **TestFlight:**
   - Open App Store Connect (https://appstoreconnect.apple.com)
   - Select your app
   - Click "TestFlight" tab
   - Wait for build to process (~15-30 minutes)
   - Add internal testers (up to 100)
   - Or create external test group (up to 10,000)

**Common Issues:**

- **Missing compliance:** Export compliance required
- **Icon issues:** Ensure all icon sizes provided
- **Missing capabilities:** Enable in Xcode signing settings

### Android: Build for Play Console

**Prerequisites:**

- Google Play Developer account ($25 one-time fee)
- App created in Play Console

**Steps:**

1. **Open Android Studio** (`npx cap open android`)

2. **Create Keystore** (first time only):

   ```bash
   # Generate keystore
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

   # Enter password and details
   # SAVE THIS KEYSTORE SECURELY! You need it for all future updates.
   ```

3. **Configure Signing:**
   - Build → Generate Signed Bundle/APK
   - Choose "Android App Bundle"
   - Create new or choose existing keystore
   - Enter passwords
   - Choose "release" build variant
   - Click "Finish"

4. **Wait for Build:**
   - Build completes in ~2-5 minutes
   - AAB file saved to `android/app/release/app-release.aab`

5. **Upload to Play Console:**
   - Open Play Console (https://play.google.com/console)
   - Select your app
   - "Release" → "Testing" → "Internal testing"
   - Create new release
   - Upload AAB file
   - Add release notes
   - Review and rollout

6. **Beta Testing:**
   - Create email list of testers
   - Or get shareable link
   - Testers opt-in via Play Store

**Common Issues:**

- **Missing keystore:** You MUST keep the keystore file secure
- **Version code:** Must increment for each upload
- **Missing permissions:** Ensure all declared in AndroidManifest.xml

---

## Quick Reference

### Essential Commands

```bash
# Setup
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android

# Development
npm run build           # Build web app
npx cap sync           # Copy to native projects
npx cap open ios       # Open Xcode
npx cap open android   # Open Android Studio

# Live reload
npx cap run ios --livereload
npx cap run android --livereload

# Plugins
npm install @capacitor/[plugin-name]
npx cap sync           # Sync new plugins

# Updates
npm update @capacitor/core @capacitor/cli
npx cap sync
```

### Platform Detection

```typescript
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'ios', 'android', 'web'
const isIOS = platform === 'ios';
const isAndroid = platform === 'android';
```

### File Paths

```typescript
// Native projects
ios/App/App.xcworkspace          # Open this in Xcode (not .xcodeproj)
ios/App/App/Info.plist            # iOS configuration
ios/App/App/Assets.xcassets       # App icons, splash screens

android/app/build.gradle          # Android build config
android/app/src/main/AndroidManifest.xml  # Android configuration
android/app/src/main/res/         # Resources (icons, etc.)
```

---

## Resources

### Official Documentation

- Capacitor Docs: https://capacitorjs.com/docs
- iOS Deployment: https://capacitorjs.com/docs/ios
- Android Deployment: https://capacitorjs.com/docs/android
- Plugin API: https://capacitorjs.com/docs/apis

### Apple Resources

- App Store Connect: https://appstoreconnect.apple.com
- Developer Portal: https://developer.apple.com
- TestFlight: https://developer.apple.com/testflight/

### Android Resources

- Play Console: https://play.google.com/console
- Android Developer: https://developer.android.com

### Community

- Capacitor Forum: https://forum.ionicframework.com/c/capacitor
- Discord: https://ionic.link/discord
- GitHub: https://github.com/ionic-team/capacitor

---

**Last Updated:** November 2025
**Capacitor Version:** 6.0+
**Project:** KGay Travel Guides
