import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kgaytravel.guides',
  appName: 'KGay Travel Guides',
  webDir: 'dist/public',

  ios: {
    contentInset: 'always',
    backgroundColor: '#ffffff',
    scrollEnabled: true,
  },

  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    captureInput: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e40af', // Ocean blue
      showSpinner: false,
    },
  },
};

export default config;
