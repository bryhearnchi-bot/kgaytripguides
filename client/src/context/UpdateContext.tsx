import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useToast } from '@/hooks/use-toast';

interface UpdateContextType {
  lastUpdated: Date;
  updateAvailable: boolean;
  isChecking: boolean;
  isAdminRoute: boolean;
  checkForUpdates: () => Promise<void>;
  applyUpdate: () => void;
  setUpdateAvailable: (available: boolean) => void;
  setIsChecking: (checking: boolean) => void;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

const LAST_UPDATED_KEY = 'app_last_updated';
const AUTO_UPDATE_DELAY = 30000; // 30 seconds

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<Date>(() => {
    const stored = localStorage.getItem(LAST_UPDATED_KEY);
    return stored ? new Date(stored) : new Date();
  });
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [autoUpdateTimeout, setAutoUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

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
      return;
    }

    setIsChecking(true);

    try {
      await swState.checkForUpdates();
    } catch (error) {
      console.error('Manual update check failed:', error);
    } finally {
      // Set checking to false after a short delay
      setTimeout(() => {
        setIsChecking(false);
      }, 1000);
    }
  };

  // Update timestamp on mount (app just loaded)
  useEffect(() => {
    const now = new Date();
    localStorage.setItem(LAST_UPDATED_KEY, now.toISOString());
    setLastUpdated(now);
  }, []);

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
    updateAvailable,
    isChecking,
    isAdminRoute,
    checkForUpdates,
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
