import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useToast } from '@/hooks/use-toast';

interface UpdateContextType {
  lastUpdated: Date;
  lastChecked: Date | null;
  updateAvailable: boolean;
  isChecking: boolean;
  isAdminRoute: boolean;
  checkForUpdates: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  applyUpdate: () => void;
  setUpdateAvailable: (available: boolean) => void;
  setIsChecking: (checking: boolean) => void;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

const LAST_UPDATED_KEY = 'app_last_updated';
const LAST_CHECKED_KEY = 'app_last_checked';
const AUTO_UPDATE_DELAY = 30000; // 30 seconds
const AUTO_REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<Date>(() => {
    const stored = localStorage.getItem(LAST_UPDATED_KEY);
    return stored ? new Date(stored) : new Date();
  });
  const [lastChecked, setLastChecked] = useState<Date | null>(() => {
    const stored = localStorage.getItem(LAST_CHECKED_KEY);
    return stored ? new Date(stored) : null;
  });
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [autoUpdateTimeout, setAutoUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasAutoRefreshed, setHasAutoRefreshed] = useState(false);

  // Detect if current route is admin
  const isAdminRoute = location.startsWith('/admin');

  // Callback when update is found
  const handleUpdateAvailable = useCallback(() => {
    setUpdateAvailable(true);

    // If in admin, don't auto-update
    if (isAdminRoute) {
      return;
    }

    // Show toast notification
    toast({
      title: '✨ New version ready',
      description: 'The app will update in 30 seconds',
      duration: 4000,
    });

    // Set up auto-update after delay
    const timeout = setTimeout(() => {
      applyUpdate();
    }, AUTO_UPDATE_DELAY);

    setAutoUpdateTimeout(timeout);
  }, [isAdminRoute, toast]);

  // Initialize service worker with callbacks
  const swState = useServiceWorker({
    onUpdateAvailable: handleUpdateAvailable,
    isAdminRoute,
  });

  // Apply update and reload
  const applyUpdate = () => {
    // Clear any pending auto-update
    if (autoUpdateTimeout) {
      clearTimeout(autoUpdateTimeout);
      setAutoUpdateTimeout(null);
    }

    if (swState.registration?.waiting) {
      // Tell the waiting service worker to activate
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Update timestamp
      const now = new Date();
      localStorage.setItem(LAST_UPDATED_KEY, now.toISOString());
      setLastUpdated(now);

      // Reload the page
      window.location.reload();
    }
  };

  // Manual check for updates
  const checkForUpdates = async () => {
    if (isChecking || !navigator.onLine) {
      if (!navigator.onLine) {
        toast({
          title: 'Offline',
          description: 'Cannot check for updates while offline',
          variant: 'destructive',
          duration: 3000,
        });
      }
      return;
    }

    setIsChecking(true);

    try {
      await swState.checkForUpdates();

      // Update last checked timestamp
      const now = new Date();
      localStorage.setItem(LAST_CHECKED_KEY, now.toISOString());
      setLastChecked(now);

      // Show feedback based on result
      if (!swState.updateAvailable && !updateAvailable) {
        toast({
          title: 'Up to date',
          description: 'You have the latest version',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Manual update check failed:', error);
      toast({
        title: 'Check failed',
        description: 'Could not check for updates',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      // Set checking to false after a short delay
      setTimeout(() => {
        setIsChecking(false);
      }, 1000);
    }
  };

  // Force refresh - clears cache and reloads
  const forceRefresh = async () => {
    if (isChecking) {
      return;
    }

    setIsChecking(true);

    try {
      // Update timestamps before reload
      const now = new Date();
      localStorage.setItem(LAST_UPDATED_KEY, now.toISOString());
      localStorage.setItem(LAST_CHECKED_KEY, now.toISOString());

      // Clear caches if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Unregister service worker to force fresh install
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      toast({
        title: 'Refreshing app...',
        description: 'Downloading latest version',
        duration: 2000,
      });

      // Give toast time to show, then reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Force refresh failed:', error);
      setIsChecking(false);
      toast({
        title: 'Refresh failed',
        description: 'Please try again',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  // Update timestamp on mount (app just loaded)
  useEffect(() => {
    const now = new Date();
    localStorage.setItem(LAST_UPDATED_KEY, now.toISOString());
    setLastUpdated(now);
  }, []);

  // Auto-refresh if app hasn't been updated in over an hour
  useEffect(() => {
    if (hasAutoRefreshed || !navigator.onLine) {
      return;
    }

    const now = new Date();
    const timeSinceUpdate = now.getTime() - lastUpdated.getTime();

    if (timeSinceUpdate > AUTO_REFRESH_THRESHOLD) {
      setHasAutoRefreshed(true);

      toast({
        title: 'Updating app...',
        description: 'Downloading latest version',
        duration: 3000,
      });

      // Auto-refresh after a short delay - inline the refresh logic
      setTimeout(async () => {
        try {
          // Update timestamps before reload
          const refreshTime = new Date();
          localStorage.setItem(LAST_UPDATED_KEY, refreshTime.toISOString());
          localStorage.setItem(LAST_CHECKED_KEY, refreshTime.toISOString());

          // Clear caches if available
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }

          // Unregister service worker to force fresh install
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
          }

          // Reload the page
          window.location.reload();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }, 1000);
    }
  }, [lastUpdated, hasAutoRefreshed, toast]);

  // Clean up auto-update timeout on unmount
  useEffect(() => {
    return () => {
      if (autoUpdateTimeout) {
        clearTimeout(autoUpdateTimeout);
      }
    };
  }, [autoUpdateTimeout]);

  // Update updateAvailable based on service worker state
  useEffect(() => {
    setUpdateAvailable(swState.updateAvailable);
  }, [swState.updateAvailable]);

  const value: UpdateContextType = {
    lastUpdated,
    lastChecked,
    updateAvailable,
    isChecking,
    isAdminRoute,
    checkForUpdates,
    forceRefresh,
    applyUpdate,
    setUpdateAvailable,
    setIsChecking,
  };

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useUpdate() {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    throw new Error('useUpdate must be used within UpdateProvider');
  }
  return context;
}
