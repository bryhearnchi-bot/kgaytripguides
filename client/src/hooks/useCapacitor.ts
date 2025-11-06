import { Capacitor } from '@capacitor/core';
import { useMemo } from 'react';

export function useCapacitor() {
  const platform = useMemo(() => {
    const p = Capacitor.getPlatform();
    return {
      isNative: Capacitor.isNativePlatform(),
      isIOS: p === 'ios',
      isAndroid: p === 'android',
      isWeb: p === 'web',
      platform: p,
      canShare: Capacitor.isPluginAvailable('Share'),
      canHaptics: Capacitor.isPluginAvailable('Haptics'),
      canCamera: Capacitor.isPluginAvailable('Camera'),
      canStatusBar: Capacitor.isPluginAvailable('StatusBar'),
      canSplashScreen: Capacitor.isPluginAvailable('SplashScreen'),
      canPreferences: Capacitor.isPluginAvailable('Preferences'),
    };
  }, []);

  return platform;
}
