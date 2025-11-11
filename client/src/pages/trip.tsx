import { useRoute } from 'wouter';
import { useEffect, useState } from 'react';
import TripGuide from '@/components/trip-guide';
import { TripGuideBottomNav } from '@/components/TripGuideBottomNav';
import { TripPageNavigation } from '@/components/TripPageNavigation';
import { useTripMetadata } from '@/hooks/useTripMetadata';
import { useTripData } from '@/hooks/useTripData';

export default function TripPage() {
  const [match, params] = useRoute('/trip/:slug');
  const [activeTab, setActiveTab] = useState('overview');

  // Only run hooks if we have a valid match and slug
  const slug = match && params?.slug ? params.slug : '';

  // Ensure body is scrollable (in case it got stuck from modal)
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  }, []);

  // Scroll to top when tab changes
  useEffect(() => {
    // Try multiple methods to ensure scrolling works
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Inject trip-specific metadata and PWA manifest
  useTripMetadata(slug);

  // Fetch trip data to determine cruise vs resort
  const { data: tripData, error: tripDataError, isLoading: tripDataLoading } = useTripData(slug);

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

  if (!match || !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#002147]">
        <p className="text-white">Invalid trip URL</p>
      </div>
    );
  }

  // Show loading while fetching data
  if (tripDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#002147]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading trip guide...</p>
        </div>
      </div>
    );
  }

  // Show error if trip not found
  if (tripDataError || !tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#002147]">
        <div className="text-center text-white max-w-md px-4">
          <h2 className="text-2xl font-bold mb-4">Trip Not Found</h2>
          <p className="mb-4">
            The trip "{slug}" could not be found. Please check the URL or return to the home page.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Determine if this is a cruise or resort for bottom nav
  const isCruise = !!tripData?.trip?.shipId;

  return (
    <>
      {/* Custom navigation for trip page with back button and share */}
      <TripPageNavigation
        charterCompanyLogo={tripData?.trip?.charterCompanyLogo}
        charterCompanyName={tripData?.trip?.charterCompanyName}
        tripType={isCruise ? 'cruise' : 'resort'}
        tripSlug={slug}
        tripName={tripData?.trip?.name}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCruise={isCruise}
      />

      <TripGuide
        slug={slug}
        showBottomNav={true}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <TripGuideBottomNav activeTab={activeTab} onTabChange={setActiveTab} isCruise={isCruise} />
    </>
  );
}
