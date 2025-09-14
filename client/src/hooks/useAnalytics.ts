import { useEffect, useCallback } from 'react';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

interface PageViewEvent {
  page: string;
  title?: string;
  properties?: Record<string, any>;
}

class Analytics {
  private sessionId: string;
  private userId?: string;
  private initialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private initialize() {
    if (this.initialized) return;

    // Initialize Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        send_page_view: false // We'll send page views manually
      });
    }

    this.initialized = true;
  }

  setUserId(userId: string) {
    this.userId = userId;

    // Set user ID in Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        user_id: userId
      });
    }
  }

  track(event: string, properties: Record<string, any> = {}) {
    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent
      },
      sessionId: this.sessionId,
      userId: this.userId
    };

    // Send to backend analytics
    this.sendToBackend(eventData);

    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, {
        ...properties,
        session_id: this.sessionId,
        user_id: this.userId
      });
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', eventData);
    }
  }

  pageView(page: string, title?: string, properties: Record<string, any> = {}) {
    const pageViewData: PageViewEvent = {
      page,
      title: title || document.title,
      properties: {
        ...properties,
        timestamp: Date.now(),
        referrer: document.referrer
      }
    };

    this.track('page_view', pageViewData);

    // Send page view to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: title || document.title,
        page_location: window.location.href,
        page_path: page,
        session_id: this.sessionId,
        user_id: this.userId
      });
    }
  }

  private async sendToBackend(eventData: AnalyticsEvent) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
    } catch (error) {
      // Silently fail - don't let analytics errors break the app
      console.warn('Failed to send analytics event:', error);
    }
  }
}

// Global analytics instance
const analytics = new Analytics();

// React hook for analytics
export const useAnalytics = () => {
  const track = useCallback((event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties);
  }, []);

  const pageView = useCallback((page: string, title?: string, properties?: Record<string, any>) => {
    analytics.pageView(page, title, properties);
  }, []);

  const setUserId = useCallback((userId: string) => {
    analytics.setUserId(userId);
  }, []);

  // Track page views automatically
  useEffect(() => {
    const path = window.location.pathname;
    const title = document.title;
    pageView(path, title);
  }, [pageView]);

  return {
    track,
    pageView,
    setUserId
  };
};

// Specific tracking functions
export const usePageTracking = () => {
  const { pageView } = useAnalytics();

  useEffect(() => {
    // Track initial page load
    const path = window.location.pathname;
    const title = document.title;
    pageView(path, title);

    // Track back/forward navigation
    const handlePopState = () => {
      const newPath = window.location.pathname;
      const newTitle = document.title;
      pageView(newPath, newTitle);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pageView]);
};

export const useErrorTracking = () => {
  const { track } = useAnalytics();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      track('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      track('unhandled_promise_rejection', {
        reason: event.reason?.toString() || 'Unknown rejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [track]);
};

export const usePerformanceTracking = () => {
  const { track } = useAnalytics();

  useEffect(() => {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        track('core_web_vital', {
          metric: 'LCP',
          value: lastEntry.startTime,
          url: window.location.href
        });
      });

      // Track First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          track('core_web_vital', {
            metric: 'FID',
            value: entry.processingStart - entry.startTime,
            url: window.location.href
          });
        });
      });

      // Track Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
      });

      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        fidObserver.observe({ type: 'first-input', buffered: true });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (error) {
        // Browser doesn't support these metrics
        console.warn('Performance Observer not supported:', error);
      }

      // Send CLS when page is hidden
      const sendCLS = () => {
        track('core_web_vital', {
          metric: 'CLS',
          value: clsValue,
          url: window.location.href
        });
      };

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          sendCLS();
        }
      });

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, [track]);
};

// User interaction tracking
export const useInteractionTracking = () => {
  const { track } = useAnalytics();

  const trackClick = useCallback((element: string, properties?: Record<string, any>) => {
    track('click', {
      element,
      ...properties
    });
  }, [track]);

  const trackFormSubmit = useCallback((form: string, properties?: Record<string, any>) => {
    track('form_submit', {
      form,
      ...properties
    });
  }, [track]);

  const trackSearch = useCallback((query: string, properties?: Record<string, any>) => {
    track('search', {
      query,
      ...properties
    });
  }, [track]);

  return {
    trackClick,
    trackFormSubmit,
    trackSearch
  };
};

// E-commerce tracking (for future use)
export const useEcommerceTracking = () => {
  const { track } = useAnalytics();

  const trackPurchase = useCallback((transactionId: string, items: any[], properties?: Record<string, any>) => {
    track('purchase', {
      transaction_id: transactionId,
      items,
      ...properties
    });
  }, [track]);

  const trackAddToCart = useCallback((item: any, properties?: Record<string, any>) => {
    track('add_to_cart', {
      item,
      ...properties
    });
  }, [track]);

  return {
    trackPurchase,
    trackAddToCart
  };
};

// Export the analytics instance for direct use
export { analytics };

// Type declaration for Google Analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}