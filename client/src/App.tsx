import { useEffect, lazy, Suspense } from 'react';
import { Switch, Route, Redirect, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
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
  const [location] = useLocation();
  const isTripPage = location.startsWith('/trip/');
  const isLandingPage = location === '/';

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

    // Add offline styles
    const offlineStyles = document.createElement('style');
    offlineStyles.textContent = `
      .offline .offline-indicator {
        display: flex !important;
      }
      .offline-indicator {
        display: none;
        position: fixed;
        bottom: calc(60px + env(safe-area-inset-bottom));
        left: 50%;
        transform: translateX(-50%);
        background: rgba(245, 158, 11, 0.95);
        color: white;
        text-align: center;
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        z-index: 9999;
        border-radius: 9999px;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        align-items: center;
        gap: 0.5rem;
      }
      .offline-indicator.hidden {
        display: none !important;
      }
      .offline-indicator-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        line-height: 1;
        padding: 0;
      }
      .offline-indicator-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    `;
    document.head.appendChild(offlineStyles);

    // Add offline indicator to DOM
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.id = 'offline-indicator';

    const text = document.createElement('span');
    text.textContent = 'You are offline';
    indicator.appendChild(text);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'offline-indicator-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => {
      indicator.classList.add('hidden');
    };
    indicator.appendChild(closeBtn);

    document.body.appendChild(indicator);

    // Show indicator again when going offline (if it was closed)
    window.addEventListener('offline', () => {
      indicator.classList.remove('hidden');
    });

    return () => {
      if (offlineStyles.parentNode) {
        offlineStyles.parentNode.removeChild(offlineStyles);
      }
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
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
