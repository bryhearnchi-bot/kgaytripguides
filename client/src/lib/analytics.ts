/**
 * Google Analytics utility for tracking user events and page views
 * Provides a thin wrapper around gtag.js to ensure consistent event tracking
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Check if Google Analytics is loaded and available
 */
export const isGAAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

/**
 * Track a page view event
 * Called automatically on route changes in useGATracking hook
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!isGAAvailable() || !window.gtag) return;

  window.gtag('config', 'G-H2QWVEYX0F', {
    page_path: path,
    page_title: title || document.title,
  });
};

/**
 * Track a custom event
 * @param eventName - Event identifier (e.g., 'trip_created', 'event_added')
 * @param eventData - Additional properties to track
 */
export const trackEvent = (eventName: string, eventData?: Record<string, any>): void => {
  if (!isGAAvailable() || !window.gtag) return;

  window.gtag('event', eventName, {
    ...eventData,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track user property / custom dimension
 * Use for persistent user attributes
 * @param propertyName - Property identifier
 * @param propertyValue - Property value
 */
export const setUserProperty = (
  propertyName: string,
  propertyValue: string | number | boolean
): void => {
  if (!isGAAvailable() || !window.gtag) return;

  window.gtag('set', {
    [propertyName]: propertyValue,
  });
};

/**
 * Track exception/error event
 * @param description - Error description
 * @param fatal - Whether the error was fatal
 */
export const trackException = (description: string, fatal: boolean = false): void => {
  if (!isGAAvailable() || !window.gtag) return;

  window.gtag('event', 'exception', {
    description,
    fatal,
  });
};

/**
 * Common event tracking helpers
 */
export const gaEvents = {
  // Trip Guide Events
  tripOpened: (tripId: string, tripName?: string) =>
    trackEvent('trip_opened', { trip_id: tripId, trip_name: tripName }),

  tripCreated: (tripId: string) => trackEvent('trip_created', { trip_id: tripId }),

  tripEdited: (tripId: string) => trackEvent('trip_edited', { trip_id: tripId }),

  tripDeleted: (tripId: string) => trackEvent('trip_deleted', { trip_id: tripId }),

  // Event Management
  eventAdded: (tripId: string, eventType?: string) =>
    trackEvent('event_added', { trip_id: tripId, event_type: eventType }),

  eventEdited: (tripId: string, eventId: string) =>
    trackEvent('event_edited', { trip_id: tripId, event_id: eventId }),

  eventDeleted: (tripId: string, eventId: string) =>
    trackEvent('event_deleted', { trip_id: tripId, event_id: eventId }),

  // Venue Management
  venueAdded: (tripId: string, venueType?: string) =>
    trackEvent('venue_added', { trip_id: tripId, venue_type: venueType }),

  venueEdited: (tripId: string, venueId: string) =>
    trackEvent('venue_edited', { trip_id: tripId, venue_id: venueId }),

  // Feature Usage
  wizardStarted: (tripType?: string) => trackEvent('wizard_started', { trip_type: tripType }),

  wizardCompleted: (tripId: string, tripType?: string) =>
    trackEvent('wizard_completed', { trip_id: tripId, trip_type: tripType }),

  templateSelected: (templateName: string) =>
    trackEvent('template_selected', { template_name: templateName }),

  exportInitiated: (tripId: string, format?: string) =>
    trackEvent('export_initiated', { trip_id: tripId, format }),

  // Share & Collaboration
  tripShared: (tripId: string, shareType?: string) =>
    trackEvent('trip_shared', { trip_id: tripId, share_type: shareType }),

  // Search & Discovery
  searchPerformed: (query: string, resultsCount?: number) =>
    trackEvent('search_performed', { query, results_count: resultsCount }),

  filterApplied: (filterType: string, filterValue?: string) =>
    trackEvent('filter_applied', { filter_type: filterType, filter_value: filterValue }),

  // Admin/Settings
  settingsChanged: (settingName: string, newValue?: any) =>
    trackEvent('settings_changed', { setting_name: settingName, new_value: newValue }),

  // Engagement
  contentViewed: (contentType: string, contentId?: string) =>
    trackEvent('content_viewed', { content_type: contentType, content_id: contentId }),

  // Errors
  errorOccurred: (errorType: string, errorMessage?: string) =>
    trackException(`${errorType}: ${errorMessage}`, false),
};

/**
 * Initialize GA tracking - call this on app start
 * Typically called from main.tsx or root layout component
 */
export const initializeGA = (): void => {
  if (!isGAAvailable()) {
    console.warn('Google Analytics not loaded. Make sure gtag.js script is in HTML head.');
    return;
  }

  // GA is already initialized by the gtag.js script in index.html
  // This function exists for documentation and future setup needs
};
