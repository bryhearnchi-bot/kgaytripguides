import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kgaytravel.guides',
  appName: 'KGay Travel Guides',
  webDir: 'dist/public',

  ios: {
    contentInset: 'always', // Respect safe area insets (status bar, notch, home indicator)
    backgroundColor: '#141A20', // Dark background matching app theme
    scrollEnabled: true,
  },

  android: {
    backgroundColor: '#141A20', // Dark background matching app theme
    allowMixedContent: true, // Allow HTTP in development
    captureInput: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e40af', // Ocean blue
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
  },
};

export default config;
