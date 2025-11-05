import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isInstalled: boolean;
  isWaiting: boolean;
  isOffline: boolean;
  updateAvailable: boolean;
  isStandalone: boolean;
}

interface UseServiceWorkerOptions {
  onUpdateFound?: () => void;
  onUpdateAvailable?: () => void;
  checkInterval?: number; // in milliseconds
  isAdminRoute?: boolean;
}

const UPDATE_CHECK_INTERVAL = 3 * 60 * 1000; // 3 minutes
const MIN_BACKGROUND_TIME = 60 * 1000; // 1 minute

export function useServiceWorker(options: UseServiceWorkerOptions = {}) {
  const {
    onUpdateFound,
    onUpdateAvailable,
    checkInterval = UPDATE_CHECK_INTERVAL,
    isAdminRoute = false,
  } = options;

  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isWaiting: false,
    isOffline: !navigator.onLine,
    updateAvailable: false,
    isStandalone: false,
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Only register in production
    if (import.meta.env.DEV) {
      return;
    }

    // Check if app is running in standalone mode
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      setState(prev => ({ ...prev, isStandalone: standalone }));
    };

    checkStandalone();

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      .then(reg => {
        setRegistration(reg);

        // Check if there's a waiting service worker
        if (reg.waiting) {
          setState(prev => ({ ...prev, updateAvailable: true, isWaiting: true }));
          onUpdateAvailable?.();
        }

        // Listen for service worker state changes
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          onUpdateFound?.();

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New service worker available
                  setState(prev => ({ ...prev, updateAvailable: true, isWaiting: true }));
                  onUpdateAvailable?.();
                } else {
                  // Service worker installed for the first time
                  setState(prev => ({ ...prev, isInstalled: true }));
                }
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });

    // Listen for service worker controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Only reload if not in admin
      if (!isAdminRoute) {
        window.location.reload();
      }
    });

    // Listen for app installation
    const handleAppInstalled = () => {
      setState(prev => ({ ...prev, isInstalled: true, isStandalone: true }));
    };

    // Listen for online/offline events
    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkStandalone();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, [isAdminRoute, onUpdateFound, onUpdateAvailable]);

  // Set up periodic update checks
  useEffect(() => {
    if (!registration || import.meta.env.DEV) {
      return;
    }

    const checkForUpdates = async () => {
      // Skip if offline
      if (!navigator.onLine) {
        return;
      }

      // Skip auto-check in admin (but still download in background)
      try {
        await registration.update();
      } catch (error) {
        console.error('Update check failed:', error);
      }
    };

    // Check immediately on mount
    checkForUpdates();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkForUpdates, checkInterval);

    return () => clearInterval(intervalId);
  }, [registration, checkInterval]);

  // Set up visibility change detection
  useEffect(() => {
    if (!registration || import.meta.env.DEV) {
      return;
    }

    let lastVisibilityChange = Date.now();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const timeAway = Date.now() - lastVisibilityChange;

        // Only check if away for more than 1 minute and online
        if (timeAway > MIN_BACKGROUND_TIME && navigator.onLine) {
          try {
            await registration.update();
          } catch (error) {
            console.error('Update check on visibility change failed:', error);
          }
        }
      } else {
        lastVisibilityChange = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [registration]);

  const skipWaiting = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setState(prev => ({ ...prev, updateAvailable: false, isWaiting: false }));
    }
  };

  const checkForUpdates = async () => {
    if (registration && navigator.onLine) {
      try {
        await registration.update();
      } catch (error) {
        console.error('Manual update check failed:', error);
      }
    }
  };

  return {
    ...state,
    skipWaiting,
    checkForUpdates,
    registration,
  };
}
