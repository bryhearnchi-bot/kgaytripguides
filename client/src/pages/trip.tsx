import { useRoute, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import TripGuide from '@/components/trip-guide';
import { TripGuideBottomNav } from '@/components/TripGuideBottomNav';
import { TripPageNavigation } from '@/components/TripPageNavigation';
import { useTripMetadata } from '@/hooks/useTripMetadata';
import { useTripData } from '@/hooks/useTripData';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Settings from '@/pages/settings';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

export default function TripPage() {
  const [match, params] = useRoute('/trip/:slug');
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const { profile } = useSupabaseAuthContext();

  // Sheet swipe state
  const [sheetTouchStart, setSheetTouchStart] = useState<number | null>(null);
  const [sheetTouchEnd, setSheetTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

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

  // Handle tab changes - intercept settings to show sheet instead
  const handleTabChange = (tab: string) => {
    if (tab === 'settings') {
      setShowSettingsSheet(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Handle navigation from Settings sheet
  const handleNavigateFromSheet = (path: string) => {
    setShowSettingsSheet(false);
    setTimeout(() => {
      setLocation(path);
    }, 100);
  };

  // Sheet swipe handlers for bottom sheet
  const onSheetTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollableParent = target.closest('.overflow-y-auto');

    // Only allow swipe-to-close if we're at the top of scrolled content or on non-scrollable area
    if (scrollableParent && scrollableParent.scrollTop > 0) {
      setSheetTouchStart(null);
      return;
    }

    setSheetTouchEnd(null);
    setSheetTouchStart(e.targetTouches[0].clientY);
  };

  const onSheetTouchMove = (e: React.TouchEvent) => {
    if (sheetTouchStart === null) return;
    setSheetTouchEnd(e.targetTouches[0].clientY);
  };

  const onSheetTouchEnd = () => {
    if (!sheetTouchStart || !sheetTouchEnd) return;

    const distance = sheetTouchStart - sheetTouchEnd;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isDownSwipe) {
      // Swipe down - close the settings sheet
      setShowSettingsSheet(false);
    }

    // Reset state
    setSheetTouchStart(null);
    setSheetTouchEnd(null);
  };

  return (
    <>
      {/* Custom navigation for trip page with back button and share */}
      <TripPageNavigation
        charterCompanyLogo={tripData?.trip?.charterCompanyLogo}
        charterCompanyName={tripData?.trip?.charterCompanyName}
        tripType={isCruise ? 'cruise' : 'resort'}
        tripSlug={slug}
        tripName={tripData?.trip?.name}
        tripId={tripData?.trip?.id}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCruise={isCruise}
      />

      <TripGuide
        slug={slug}
        showBottomNav={true}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <TripGuideBottomNav activeTab={activeTab} onTabChange={handleTabChange} isCruise={isCruise} />

      {/* Settings Sheet */}
      <Sheet open={showSettingsSheet} onOpenChange={setShowSettingsSheet}>
        <SheetContent
          side="bottom"
          className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] bg-[#002147] border-white/10 text-white p-0 rounded-t-3xl overflow-hidden [&>button]:top-2 [&>button]:right-2 [&>button]:w-12 [&>button]:h-12"
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}
        >
          <VisuallyHidden>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Manage your profile and app preferences</SheetDescription>
          </VisuallyHidden>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative h-full overflow-y-auto pt-4">
            <div className="[&>div]:pt-0 [&>div]:min-h-0">
              <Settings
                onNavigate={handleNavigateFromSheet}
                tripId={tripData?.trip?.id}
                tripSlug={slug}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
