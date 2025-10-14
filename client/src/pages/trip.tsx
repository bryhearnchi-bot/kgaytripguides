import { useRoute } from 'wouter';
import { useEffect } from 'react';
import TripGuide from '@/components/trip-guide';
import { useTripMetadata } from '@/hooks/useTripMetadata';

export default function TripPage() {
  const [match, params] = useRoute('/trip/:slug');

  // Inject trip-specific metadata and PWA manifest
  useTripMetadata(params?.slug);

  // Auto-refresh when app is opened in standalone mode (if online)
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone && navigator.onLine) {
      // Force refresh data when app is opened from home screen
      // Clear React Query cache to fetch fresh data
      const event = new CustomEvent('pwa-refresh-data');
      window.dispatchEvent(event);

      // Also reload the page if it's been cached for a while
      const lastLoad = sessionStorage.getItem('pwa-last-load');
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      if (!lastLoad || now - parseInt(lastLoad) > CACHE_DURATION) {
        sessionStorage.setItem('pwa-last-load', now.toString());
        // Soft reload - just invalidate queries instead of hard reload
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              if (name.includes('api') || name.includes('data')) {
                caches.delete(name);
              }
            });
          });
        }
      }
    }
  }, [params?.slug]);

  // Robust scroll to top implementation
  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    const forceScrollToTop = () => {
      // Multiple scroll methods for maximum compatibility
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Also try with options
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    };

    // Immediate scroll
    forceScrollToTop();

    // Use requestAnimationFrame for next paint cycle
    requestAnimationFrame(() => {
      forceScrollToTop();

      // Additional attempts with longer delays
      setTimeout(forceScrollToTop, 1);
      setTimeout(forceScrollToTop, 10);
      setTimeout(forceScrollToTop, 50);
      setTimeout(forceScrollToTop, 100);
      setTimeout(forceScrollToTop, 200);
    });
  }, [params?.slug]);

  if (!match || !params?.slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Invalid trip URL</p>
      </div>
    );
  }

  return <TripGuide slug={params.slug} />;
}
