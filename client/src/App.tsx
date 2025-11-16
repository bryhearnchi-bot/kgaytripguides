import { useEffect, lazy, Suspense } from 'react';
import { Switch, Route, Redirect, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { TimeFormatProvider } from '@/contexts/TimeFormatContext';
import { UpdateProvider } from '@/context/UpdateContext';
import { OfflineStorageProvider } from '@/contexts/OfflineStorageContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import NavigationBanner from '@/components/navigation-banner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import BottomSafeArea from '@/components/BottomSafeArea';
import BottomNavigation from '@/components/BottomNavigation';
import { SplashScreen } from '@capacitor/splash-screen';
import {
  isNative,
  initializeNativeFeatures,
  ensureThemeMetaTags,
  setupNavigationHandlers,
  setupPWANavigationInterceptor,
  isPWA,
} from '@/lib/capacitor';

// Lazy load all route components for code splitting
const LandingPage = lazy(() => import('@/pages/landing'));
const TripPage = lazy(() => import('@/pages/trip'));
const LoginPage = lazy(() => import('@/pages/auth/login'));
const AuthCallback = lazy(() =>
  import('@/pages/auth/AuthCallback').then(m => ({ default: m.AuthCallback }))
);
const AccountSetup = lazy(() => import('@/pages/auth/AccountSetup'));
const NotFound = lazy(() => import('@/pages/not-found'));
const ImageTest = lazy(() => import('@/pages/image-test'));
const LandingMockupsPage = lazy(() => import('@/pages/landing-mockups'));
const PastTrips = lazy(() => import('@/pages/past-trips'));
const MyStuff = lazy(() => import('@/pages/my-stuff'));
const Alerts = lazy(() => import('@/pages/alerts'));
const Settings = lazy(() => import('@/pages/settings'));

// Admin pages - lazy loaded
const ShipsManagement = lazy(() => import('@/pages/admin/ships'));
const LocationsManagement = lazy(() => import('@/pages/admin/locations'));
const ResortsManagement = lazy(() => import('@/pages/admin/resorts'));
const ArtistsManagement = lazy(() => import('@/pages/admin/artists'));
const ThemesManagement = lazy(() => import('@/pages/admin/themes'));
const TripInfoSectionsManagement = lazy(() => import('@/pages/admin/trip-info-sections'));
const FAQsManagement = lazy(() => import('@/pages/admin/faqs'));
const UsersManagement = lazy(() => import('@/pages/admin/users'));
const AdminLookupTables = lazy(() => import('@/pages/admin/lookup-tables'));
const AdminProfile = lazy(() => import('@/pages/admin/profile'));
const TripDetail = lazy(() => import('@/pages/admin/trip-detail'));
const TripsManagement = lazy(() => import('@/pages/admin/trips-management'));
const InvitationsManagement = lazy(() => import('@/pages/admin/invitations'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#002147] relative">
      <div className="text-center space-y-4 relative z-10">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-blue-400/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"></div>
        </div>
        <p className="text-white/80 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/image-test" component={ImageTest} />
        <Route path="/landing-mockups" component={LandingMockupsPage} />
        <Route path="/past-trips" component={PastTrips} />
        <Route path="/my-stuff" component={MyStuff} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/settings" component={Settings} />
        <Route path="/trip/:slug" component={TripPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/setup-account/:token" component={AccountSetup} />
        <Route path="/profile" component={() => <Redirect to="/admin/profile" />} />
        <Route path="/admin" component={() => <Redirect to="/admin/trips" />} />
        <Route path="/admin/dashboard" component={() => <Redirect to="/admin/trips" />} />
        <Route
          path="/admin/ships"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <ShipsManagement />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/resorts"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <ResortsManagement />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/locations"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <LocationsManagement />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/artists"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <ArtistsManagement />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/themes"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <ThemesManagement />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/trip-info-sections"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <TripInfoSectionsManagement />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/faqs"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <FAQsManagement />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/users"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <UsersManagement />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/invitations"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <InvitationsManagement />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/lookup-tables"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <AdminLookupTables />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/profile"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <AdminProfile />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/trips"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <TripsManagement />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/trips/:id"
          component={() => (
            <ProtectedRoute>
              <AdminLayout>
                <TripDetail />
              </AdminLayout>
            </ProtectedRoute>
          )}
        />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// Wrapper component to conditionally show NavigationBanner
function AppContent() {
  const [location, setLocation] = useLocation();
  const isTripPage = location.startsWith('/trip/');
  const isLandingPage = location === '/';

  // In offline PWA mode, treat the "home" of the app as the best trip (current or next upcoming).
  // When the app opens on "/" or any non-trip route while offline in PWA, automatically redirect
  // to the most relevant trip guide if we have trip data cached.
  useEffect(() => {
    if (!isPWA()) return;
    if (typeof navigator === 'undefined' || navigator.onLine) return;

    // Don't redirect if we're already on a trip page
    if (location.startsWith('/trip/')) return;

    // Avoid multiple redirects in a single session
    const redirectKey = 'offline-trip-redirect-done';
    if (sessionStorage.getItem(redirectKey) === '1') return;
    sessionStorage.setItem(redirectKey, '1');

    const loadAndRedirect = async () => {
      try {
        const response = await fetch('/api/trips');
        if (!response.ok) return;

        const trips: any[] = await response.json();
        if (!Array.isArray(trips) || trips.length === 0) return;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const classifyTrip = (trip: any): 'upcoming' | 'current' | 'past' => {
          const start = new Date(trip.startDate);
          const end = new Date(trip.endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);

          if (now < start) return 'upcoming';
          if (now > end) return 'past';
          return 'current';
        };

        const currentTrips = trips.filter(trip => classifyTrip(trip) === 'current');
        const upcomingTrips = trips.filter(trip => classifyTrip(trip) === 'upcoming');

        const sortByStart = (a: any, b: any) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime();

        let bestTrip: any | null = null;
        if (currentTrips.length > 0) {
          currentTrips.sort(sortByStart);
          bestTrip = currentTrips[0];
        } else if (upcomingTrips.length > 0) {
          upcomingTrips.sort(sortByStart);
          bestTrip = upcomingTrips[0];
        }

        if (bestTrip?.slug) {
          setLocation(`/trip/${bestTrip.slug}?pwa=true`);
        }
      } catch {
        // If anything fails (no cache, parse error, etc.), silently stay on the current route.
      }
    };

    void loadAndRedirect();
  }, [location, setLocation]);

  return (
    <div className="relative z-10">
      {/* Hide NavigationBanner on trip pages - they use custom TripPageNavigation */}
      {!isTripPage && <NavigationBanner />}
      <div className="w-full">
        <Toaster />
        <Router />
      </div>
      {/* Hide BottomNavigation on trip pages and landing page */}
      {!isTripPage && !isLandingPage && <BottomNavigation />}
      <BottomSafeArea />
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize native features (status bar, etc.) for Capacitor apps
    if (isNative) {
      initializeNativeFeatures();
      setupNavigationHandlers();
      SplashScreen.hide();
    }

    // Ensure theme meta tags are set correctly for Safari iOS
    // This handles both regular Safari browsing and PWA mode
    ensureThemeMetaTags();

    // CRITICAL iOS PWA Fix: Setup navigation interceptor to maintain PWA context
    // This prevents iOS from showing browser chrome during navigation
    setupPWANavigationInterceptor();

    // Disable browser scroll restoration globally
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Handle offline/online status with Sonner toasts
    let offlineToastId: string | number | undefined;

    const handleOffline = () => {
      // Show offline toast using Sonner
      offlineToastId = toast.warning('You are offline', {
        description: 'Some features may be unavailable',
        duration: 5000, // Show for 5 seconds
        id: 'offline-status', // Unique ID to prevent duplicates
        dismissible: true, // Allow user to close it
        closeButton: true, // Show close button
      });
    };

    const handleOnline = () => {
      // Dismiss the offline toast
      if (offlineToastId) {
        toast.dismiss(offlineToastId);
      }
      // Show brief online notification
      toast.success('Back online', {
        description: 'All features restored',
        duration: 3000,
      });
    };

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (offlineToastId) {
        toast.dismiss(offlineToastId);
      }
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#002147] m-0 p-0 relative">
      <QueryClientProvider client={queryClient}>
        <SupabaseAuthProvider>
          <TimeFormatProvider>
            <OfflineStorageProvider>
              <UpdateProvider>
                <TooltipProvider>
                  <AppContent />
                </TooltipProvider>
              </UpdateProvider>
            </OfflineStorageProvider>
          </TimeFormatProvider>
        </SupabaseAuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
