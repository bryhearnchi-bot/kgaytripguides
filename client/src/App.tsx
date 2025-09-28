import { useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { TimeFormatProvider } from "@/contexts/TimeFormatContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavigationBanner from "@/components/navigation-banner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboardContent from "@/components/admin/AdminDashboardContent";
import LandingPage from "@/pages/landing";
import TripPage from "@/pages/trip";
import ShipsManagement from "@/pages/admin/ships";
import LocationsManagement from "@/pages/admin/locations";
import ResortsManagement from "@/pages/admin/resorts";
import ArtistsManagement from "@/pages/admin/artists";
import ThemesManagement from "@/pages/admin/themes";
import TripInfoSectionsManagement from "@/pages/admin/trip-info-sections";
import UsersManagement from "@/pages/admin/users";
import AdminLookupTables from "@/pages/admin/lookup-tables";
import AdminProfile from "@/pages/admin/profile";
import TripWizard from "@/pages/admin/trip-wizard";
import TripDetail from "@/pages/admin/trip-detail";
import TripsManagement from "@/pages/admin/trips-management";
import InvitationsManagement from "@/pages/admin/invitations";
import NotFound from "@/pages/not-found";
import ImageTest from "@/pages/image-test";
import { AuthCallback } from "@/pages/auth/AuthCallback";
import LoginPage from "@/pages/auth/login";
import AccountSetup from "@/pages/auth/AccountSetup";

function Router() {
  return (
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
      <Route path="/admin/ships" component={() => <ProtectedRoute><AdminLayout><ShipsManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/resorts" component={() => <ProtectedRoute><AdminLayout><ResortsManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/locations" component={() => <ProtectedRoute><AdminLayout><LocationsManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/artists" component={() => <ProtectedRoute><AdminLayout><ArtistsManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/themes" component={() => <ProtectedRoute><AdminLayout><ThemesManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/trip-info-sections" component={() => <ProtectedRoute><AdminLayout><TripInfoSectionsManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/users" component={() => <ProtectedRoute><AdminLayout><UsersManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/invitations" component={() => <ProtectedRoute><AdminLayout><InvitationsManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/lookup-tables" component={() => <ProtectedRoute><AdminLayout><AdminLookupTables /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/profile" component={() => <ProtectedRoute><AdminLayout><AdminProfile /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/trips" component={() => <ProtectedRoute><AdminLayout><TripsManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/trips/new" component={() => <ProtectedRoute><AdminLayout><TripWizard /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/trips/:id/edit" component={() => <ProtectedRoute><AdminLayout><TripWizard isEditing={true} /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/trips/:id" component={() => <ProtectedRoute><AdminLayout><TripDetail /></AdminLayout></ProtectedRoute>} />
      <Route component={NotFound} />
    </Switch>
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
              <div className="pt-10 w-full"> {/* Add padding to account for fixed banner */}
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
