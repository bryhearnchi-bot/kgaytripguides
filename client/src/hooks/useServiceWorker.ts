import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isInstalled: boolean;
  isWaiting: boolean;
  isOffline: boolean;
  updateAvailable: boolean;
  isStandalone: boolean;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isWaiting: false,
    isOffline: !navigator.onLine,
    updateAvailable: false,
    isStandalone: false,
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // TEMPORARILY DISABLED - Service Worker is blocking images due to CSP
    console.log('Service Worker registration disabled to fix image loading');
    return;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    // Check if app is running in standalone mode
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setState(prev => ({ ...prev, isStandalone: standalone }));
    };

    checkStandalone();

    // Register service worker
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
      .then((reg) => {
        console.log('Service Worker registered:', reg);
        setRegistration(reg);

        // Check if there's a waiting service worker
        if (reg.waiting) {
          setState(prev => ({ ...prev, updateAvailable: true, isWaiting: true }));
        }

        // Listen for service worker state changes
        reg.addEventListener('updatefound', () => {
          console.log('Service Worker update found');
          const newWorker = reg.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New service worker available
                  setState(prev => ({ ...prev, updateAvailable: true, isWaiting: true }));
                } else {
                  // Service worker installed for the first time
                  setState(prev => ({ ...prev, isInstalled: true }));
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // Listen for service worker controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed - reloading');
      window.location.reload();
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
    mediaQuery.addListener(handleDisplayModeChange);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeListener(handleDisplayModeChange);
    };
  }, []);

  const skipWaiting = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setState(prev => ({ ...prev, updateAvailable: false, isWaiting: false }));
    }
  };

  const checkForUpdates = async () => {
    if (registration) {
      try {
        await registration.update();
        console.log('Service Worker update check completed');
      } catch (error) {
        console.error('Service Worker update check failed:', error);
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