import { useEffect, lazy, Suspense } from 'react';
import { Switch, Route, Redirect } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { TimeFormatProvider } from '@/contexts/TimeFormatContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import NavigationBanner from '@/components/navigation-banner';
import { AdminLayout } from '@/components/admin/AdminLayout';

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

// Admin pages - lazy loaded
const ShipsManagement = lazy(() => import('@/pages/admin/ships'));
const LocationsManagement = lazy(() => import('@/pages/admin/locations'));
const ResortsManagement = lazy(() => import('@/pages/admin/resorts'));
const ArtistsManagement = lazy(() => import('@/pages/admin/artists'));
const ThemesManagement = lazy(() => import('@/pages/admin/themes'));
const TripInfoSectionsManagement = lazy(() => import('@/pages/admin/trip-info-sections'));
const UsersManagement = lazy(() => import('@/pages/admin/users'));
const AdminLookupTables = lazy(() => import('@/pages/admin/lookup-tables'));
const AdminProfile = lazy(() => import('@/pages/admin/profile'));
const TripDetail = lazy(() => import('@/pages/admin/trip-detail'));
const TripsManagement = lazy(() => import('@/pages/admin/trips-management'));
const InvitationsManagement = lazy(() => import('@/pages/admin/invitations'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-900">
      <div className="text-center space-y-4">
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

function App() {
  useEffect(() => {
    // Disable browser scroll restoration globally
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Add offline styles
    const offlineStyles = document.createElement('style');
    offlineStyles.textContent = `
      .offline .offline-indicator {
        display: block !important;
      }
      .offline-indicator {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f59e0b;
        color: white;
        text-align: center;
        padding: 0.5rem;
        font-size: 0.875rem;
        z-index: 9999;
      }
    `;
    document.head.appendChild(offlineStyles);

    // Add offline indicator to DOM
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.textContent = 'You are offline. Some features may be limited.';
    document.body.appendChild(indicator);

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
    <div className="min-h-screen w-full m-0 p-0">
      <QueryClientProvider client={queryClient}>
        <SupabaseAuthProvider>
          <TimeFormatProvider>
            <TooltipProvider>
              <NavigationBanner />
              <div className="pt-10 w-full">
                {' '}
                {/* Add padding to account for fixed banner */}
                <Toaster />
                <Router />
              </div>
            </TooltipProvider>
          </TimeFormatProvider>
        </SupabaseAuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
