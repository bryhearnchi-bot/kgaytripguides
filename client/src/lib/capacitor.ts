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
    // Status bar - ocean theme
    await StatusBar.setStyle({ style: Style.Light }); // Light text for dark header

    if (isAndroid) {
      await StatusBar.setBackgroundColor({ color: '#1e40af' }); // Ocean blue
    }

    // iOS: status bar overlays content, styled via CSS
  } catch (error) {
    console.error('Failed to initialize native features:', error);
  }
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
