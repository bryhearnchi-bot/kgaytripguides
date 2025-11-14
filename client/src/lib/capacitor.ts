import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isWeb = Capacitor.getPlatform() === 'web';

export async function initializeNativeFeatures() {
  if (!isNative) return;

  try {
    // Status bar - Oxford Blue background with light text
    await StatusBar.setStyle({ style: Style.Light }); // Light text for dark header

    if (isAndroid) {
      // On Android, use dark blue to match navigation bar
      await StatusBar.setBackgroundColor({ color: '#001a35' }); // Dark blue
      await StatusBar.setOverlaysWebView({ overlay: true }); // Allow content to extend under status bar
    }

    // iOS: status bar automatically overlays content with our setup
  } catch (error) {
    console.error('Failed to initialize native features:', error);
  }
}

/**
 * Ensures the correct meta tags are set for Safari iOS status bar and address bar
 * This handles both regular Safari browsing and PWA mode
 *
 * For iOS 15+ Safari:
 * - theme-color: Controls the address bar color in regular Safari browsing
 * - apple-mobile-web-app-status-bar-style: Controls status bar in PWA mode
 */
export function ensureThemeMetaTags() {
  const themeColor = '#001a35'; // Oxford Blue

  // 1. Set theme-color for Safari iOS 15+ address bar (regular browsing mode)
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.setAttribute('name', 'theme-color');
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.setAttribute('content', themeColor);

  // 2. Set apple-mobile-web-app-status-bar-style for PWA mode
  // Options:
  // 'default' = white status bar (NOT suitable for dark apps)
  // 'black' = solid black status bar with white text (safe but very dark)
  // 'black-translucent' = translucent status bar, content shows through (best for dark apps)
  let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!statusBarMeta) {
    statusBarMeta = document.createElement('meta');
    statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(statusBarMeta);
  }
  // Use 'black-translucent' to allow the dark blue background to show through
  statusBarMeta.setAttribute('content', 'black-translucent');

  // 3. Ensure viewport meta includes viewport-fit=cover for notch support
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    const content = viewportMeta.getAttribute('content') || '';
    if (!content.includes('viewport-fit=cover')) {
      viewportMeta.setAttribute('content', `${content}, viewport-fit=cover`);
    }
  }
}

/**
 * Alias for ensureThemeMetaTags for backwards compatibility
 */
export function setThemeColor() {
  ensureThemeMetaTags();
}

export function setupNavigationHandlers() {
  if (!isNative) return;

  // Handle Android back button
  if (isAndroid) {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  }
}

/**
 * Detects if the app is running in PWA mode (standalone display mode)
 * Works for both iOS and Android PWAs
 */
export function isPWA(): boolean {
  // Method 1: Check display-mode media query (most reliable)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Method 2: iOS-specific check
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  // Method 3: Check for ?pwa=true parameter (our custom indicator)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('pwa') === 'true') {
    return true;
  }

  return false;
}

/**
 * CRITICAL iOS PWA Fix: Intercepts navigation to maintain PWA context
 * This prevents iOS from showing browser chrome during in-app navigation
 *
 * How it works:
 * 1. All navigation uses History API with PWA state markers
 * 2. iOS recognizes these navigations as "in-app" rather than "leaving app"
 * 3. Browser chrome stays hidden throughout the user journey
 */
export function setupPWANavigationInterceptor() {
  // Only run in PWA mode
  if (!isPWA()) return;

  // Mark current state as PWA
  if (window.history.state?.pwa !== true) {
    window.history.replaceState({ ...window.history.state, pwa: true }, '', window.location.href);
  }

  // Intercept all internal navigation events
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  // Override pushState to always include PWA marker
  window.history.pushState = function (state, title, url) {
    const pwaState = { ...state, pwa: true };
    return originalPushState.call(this, pwaState, title, url);
  };

  // Override replaceState to always include PWA marker
  window.history.replaceState = function (state, title, url) {
    const pwaState = { ...state, pwa: true };
    return originalReplaceState.call(this, pwaState, title, url);
  };

  console.log('[PWA] Navigation interceptor initialized');
}
