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
    return;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
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
        setRegistration(reg);

        // Check if there's a waiting service worker
        if (reg.waiting) {
          setState(prev => ({ ...prev, updateAvailable: true, isWaiting: true }));
        }

        // Listen for service worker state changes
        reg.addEventListener('updatefound', () => {
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
        // Service Worker registration failed
      });

    // Listen for service worker controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
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
      } catch (error) {
        // Update check failed
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