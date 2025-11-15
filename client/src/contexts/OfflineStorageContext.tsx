import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

interface OfflineTripStatus {
  enabled: boolean;
  downloadedAt?: string;
  size?: number; // in bytes
  downloading?: boolean;
  progress?: number; // 0-100
  error?: string;
}

interface OfflineStorageContextType {
  // Check if offline is enabled for a trip
  isOfflineEnabled: (tripId: number) => boolean;

  // Get full status for a trip
  getTripStatus: (tripId: number) => OfflineTripStatus;

  // Enable offline access (triggers download)
  enableOfflineForTrip: (tripId: number, tripSlug: string) => Promise<void>;

  // Disable offline access (clears cache)
  disableOfflineForTrip: (tripId: number) => Promise<void>;

  // Check if alert has been dismissed for a trip
  isAlertDismissed: (tripId: number) => boolean;

  // Dismiss the offline alert for a trip
  dismissAlert: (tripId: number) => void;

  // Check if we're in PWA mode
  isPWAMode: boolean;

  // Get download progress
  downloadProgress: number;
  isDownloading: boolean;
}

const OfflineStorageContext = createContext<OfflineStorageContextType | undefined>(undefined);

const STORAGE_KEY = 'offline-trips-status';
const DISMISSED_KEY = 'offline-alerts-dismissed';

interface OfflineStorageProviderProps {
  children: ReactNode;
}

export function OfflineStorageProvider({ children }: OfflineStorageProviderProps) {
  const [tripStatuses, setTripStatuses] = useState<Record<number, OfflineTripStatus>>({});
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const [isPWAMode, setIsPWAMode] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Detect PWA mode
  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsPWAMode(standalone);
  }, []);

  // Load saved statuses from localStorage
  useEffect(() => {
    const savedStatuses = localStorage.getItem(STORAGE_KEY);
    if (savedStatuses) {
      try {
        const parsed = JSON.parse(savedStatuses);
        setTripStatuses(parsed);
      } catch {
        // Invalid JSON, ignore
      }
    }

    const savedDismissed = localStorage.getItem(DISMISSED_KEY);
    if (savedDismissed) {
      try {
        const parsed = JSON.parse(savedDismissed);
        setDismissedAlerts(new Set(parsed));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save statuses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tripStatuses));
  }, [tripStatuses]);

  // Save dismissed alerts to localStorage
  useEffect(() => {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(dismissedAlerts)));
  }, [dismissedAlerts]);

  const isOfflineEnabled = useCallback(
    (tripId: number) => {
      return tripStatuses[tripId]?.enabled || false;
    },
    [tripStatuses]
  );

  const getTripStatus = useCallback(
    (tripId: number): OfflineTripStatus => {
      return tripStatuses[tripId] || { enabled: false };
    },
    [tripStatuses]
  );

  const isAlertDismissed = useCallback(
    (tripId: number) => {
      return dismissedAlerts.has(tripId);
    },
    [dismissedAlerts]
  );

  const dismissAlert = useCallback((tripId: number) => {
    setDismissedAlerts(prev => {
      const newSet = new Set(prev);
      newSet.add(tripId);
      return newSet;
    });
  }, []);

  // Download all trip data and images for offline access
  const downloadTripData = async (tripId: number, tripSlug: string): Promise<number> => {
    let totalSize = 0;
    const cache = await caches.open(`trip-${tripId}-offline`);

    // List of API endpoints to cache (using correct endpoint patterns)
    // Cache BOTH the complete endpoint (used by main trip page) AND individual endpoints (used by some components)
    const apiEndpoints = [
      `/api/trips/${tripSlug}`, // Basic trip info
      `/api/trips/${tripSlug}/complete`, // Main trip page uses this - includes all data
      `/api/trips/${tripId}/itinerary`, // Individual endpoint for components
      `/api/trips/${tripId}/events`, // Individual endpoint for components
      `/api/trips/${tripId}/talent`, // Individual endpoint for components
      `/api/trip-info-sections/trip/${tripId}/all`, // Info sections (used by InfoTab)
      `/api/faqs/trip/${tripId}`, // FAQs (used by InfoTab)
    ];

    const imageUrls: string[] = [];

    // Fetch all API data first to collect image URLs
    let completedRequests = 0;
    const totalRequests = apiEndpoints.length;

    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const clonedResponse = response.clone();
          await cache.put(endpoint, clonedResponse);

          const data = await response.json();
          const jsonSize = JSON.stringify(data).length;
          totalSize += jsonSize;

          // Extract image URLs from the data
          if (endpoint.includes('/complete')) {
            // Complete endpoint - extract all images from the comprehensive data
            // Trip images
            if (data.trip?.heroImageUrl) imageUrls.push(data.trip.heroImageUrl);
            if (data.trip?.mapUrl) imageUrls.push(data.trip.mapUrl);
            if (data.trip?.charterCompanyLogo) imageUrls.push(data.trip.charterCompanyLogo);

            // Ship images
            if (data.ship?.imageUrl) imageUrls.push(data.ship.imageUrl);

            // Itinerary images
            if (Array.isArray(data.itinerary)) {
              data.itinerary.forEach((item: any) => {
                if (item.imageUrl) imageUrls.push(item.imageUrl);
                if (item.portImageUrl) imageUrls.push(item.portImageUrl);
                if (item.itineraryImageUrl) imageUrls.push(item.itineraryImageUrl);
                if (item.locationImageUrl) imageUrls.push(item.locationImageUrl);
                if (item.location?.imageUrl) imageUrls.push(item.location.imageUrl);
              });
            }

            // Event images
            if (Array.isArray(data.events)) {
              data.events.forEach((event: any) => {
                if (event.imageUrl) imageUrls.push(event.imageUrl);
                if (event.partyTheme?.imageUrl) imageUrls.push(event.partyTheme.imageUrl);
              });
            }

            // Talent images
            if (Array.isArray(data.talent)) {
              data.talent.forEach((talent: any) => {
                if (talent.profileImageUrl) imageUrls.push(talent.profileImageUrl);
              });
            }

            // Party theme images
            if (Array.isArray(data.partyThemes)) {
              data.partyThemes.forEach((theme: any) => {
                if (theme.imageUrl) imageUrls.push(theme.imageUrl);
              });
            }
          } else if (endpoint.includes('/trips/') && !endpoint.includes('/complete')) {
            // Basic trip info endpoint
            if (data.heroImageUrl) imageUrls.push(data.heroImageUrl);
            if (data.mapUrl) imageUrls.push(data.mapUrl);
            if (data.charterCompanyLogo) imageUrls.push(data.charterCompanyLogo);

            // Get ship image if ship ID exists
            if (data.shipId) {
              try {
                const shipResponse = await fetch(`/api/ships/${data.shipId}`);
                if (shipResponse.ok) {
                  const shipData = await shipResponse.json();
                  if (shipData.imageUrl) imageUrls.push(shipData.imageUrl);
                }
              } catch {
                // Skip ship image if fetch fails
              }
            }
          }

          if (endpoint.includes('/itinerary')) {
            if (Array.isArray(data)) {
              data.forEach(
                (item: {
                  imageUrl?: string;
                  portImageUrl?: string;
                  itineraryImageUrl?: string;
                  locationImageUrl?: string;
                  location?: { imageUrl?: string };
                }) => {
                  // Cache all possible image URLs for itinerary stops
                  if (item.imageUrl) imageUrls.push(item.imageUrl);
                  if (item.portImageUrl) imageUrls.push(item.portImageUrl);
                  if (item.itineraryImageUrl) imageUrls.push(item.itineraryImageUrl);
                  if (item.locationImageUrl) imageUrls.push(item.locationImageUrl);
                  if (item.location?.imageUrl) imageUrls.push(item.location.imageUrl);
                }
              );
            }
          }

          if (endpoint.includes('/events')) {
            if (Array.isArray(data)) {
              data.forEach((event: { imageUrl?: string; partyTheme?: { imageUrl?: string } }) => {
                if (event.imageUrl) imageUrls.push(event.imageUrl);
                if (event.partyTheme?.imageUrl) imageUrls.push(event.partyTheme.imageUrl);
              });
            }
          }

          if (endpoint.includes('/talent')) {
            if (Array.isArray(data)) {
              data.forEach(
                (talent: { artist?: { imageUrl?: string }; profileImageUrl?: string }) => {
                  if (talent.artist?.imageUrl) imageUrls.push(talent.artist.imageUrl);
                  if (talent.profileImageUrl) imageUrls.push(talent.profileImageUrl);
                }
              );
            }
          }
        }
        completedRequests++;
        setDownloadProgress(
          Math.round((completedRequests / (totalRequests + imageUrls.length)) * 100)
        );
      } catch {
        // Continue with other endpoints if one fails
        completedRequests++;
      }
    }

    // Remove duplicate image URLs
    const uniqueImageUrls = Array.from(new Set(imageUrls.filter(url => url && url.length > 0)));

    // Download all images
    const totalItems = totalRequests + uniqueImageUrls.length;
    for (const imageUrl of uniqueImageUrls) {
      try {
        const response = await fetch(imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          totalSize += blob.size;

          // Cache the image
          const clonedResponse = new Response(blob, {
            headers: response.headers,
          });
          await cache.put(imageUrl, clonedResponse);
        }
        completedRequests++;
        setDownloadProgress(Math.round((completedRequests / totalItems) * 100));
      } catch {
        // Skip failed image downloads
        completedRequests++;
      }
    }

    return totalSize;
  };

  const enableOfflineForTrip = useCallback(async (tripId: number, tripSlug: string) => {
    setIsDownloading(true);
    setDownloadProgress(0);

    // Update status to downloading
    setTripStatuses(prev => ({
      ...prev,
      [tripId]: {
        ...prev[tripId],
        enabled: false,
        downloading: true,
        progress: 0,
        error: undefined,
      },
    }));

    try {
      const size = await downloadTripData(tripId, tripSlug);

      // Update status to enabled
      setTripStatuses(prev => ({
        ...prev,
        [tripId]: {
          enabled: true,
          downloadedAt: new Date().toISOString(),
          size,
          downloading: false,
          progress: 100,
        },
      }));

      // Also remove from dismissed alerts since they've enabled it
      setDismissedAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(tripId);
        return newSet;
      });
    } catch (error) {
      setTripStatuses(prev => ({
        ...prev,
        [tripId]: {
          ...prev[tripId],
          enabled: false,
          downloading: false,
          error: error instanceof Error ? error.message : 'Download failed',
        },
      }));
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, []);

  const disableOfflineForTrip = useCallback(async (tripId: number) => {
    // Clear the cache
    try {
      await caches.delete(`trip-${tripId}-offline`);
    } catch {
      // Cache deletion failed, but continue
    }

    // Update status
    setTripStatuses(prev => ({
      ...prev,
      [tripId]: {
        enabled: false,
      },
    }));
  }, []);

  const value: OfflineStorageContextType = {
    isOfflineEnabled,
    getTripStatus,
    enableOfflineForTrip,
    disableOfflineForTrip,
    isAlertDismissed,
    dismissAlert,
    isPWAMode,
    downloadProgress,
    isDownloading,
  };

  return <OfflineStorageContext.Provider value={value}>{children}</OfflineStorageContext.Provider>;
}

export function useOfflineStorage() {
  const context = useContext(OfflineStorageContext);
  if (context === undefined) {
    throw new Error('useOfflineStorage must be used within an OfflineStorageProvider');
  }
  return context;
}
