import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { TimeFormatProvider } from "@/contexts/TimeFormatContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavigationBanner from "@/components/navigation-banner";
import LandingPage from "@/pages/landing";
import TripPage from "@/pages/trip";
import AdminDashboard from "@/pages/admin/dashboard";
import ShipsManagement from "@/pages/admin/ships";
import LocationsManagement from "@/pages/admin/locations";
import ArtistsManagement from "@/pages/admin/artists";
import ThemesManagement from "@/pages/admin/themes";
import InfoSectionsManagement from "@/pages/admin/info-sections";
import UsersManagement from "@/pages/admin/users";
import AdminSettings from "@/pages/admin/settings";
import AdminProfile from "@/pages/admin/profile";
import CruiseWizard from "@/pages/admin/cruise-wizard";
import CruiseDetail from "@/pages/admin/cruise-detail";
import ActiveCruises from "@/pages/admin/cruises-active";
import PastCruises from "@/pages/admin/cruises-past";
import NotFound from "@/pages/not-found";
import ImageTest from "@/pages/image-test";
import { AuthCallback } from "@/pages/auth/AuthCallback";
import LoginPage from "@/pages/auth/login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/image-test" component={ImageTest} />
      <Route path="/trip/:slug" component={TripPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/admin" component={() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/dashboard" component={() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/ships" component={() => <ProtectedRoute><ShipsManagement /></ProtectedRoute>} />
      <Route path="/admin/locations" component={() => <ProtectedRoute><LocationsManagement /></ProtectedRoute>} />
      <Route path="/admin/artists" component={() => <ProtectedRoute><ArtistsManagement /></ProtectedRoute>} />
      <Route path="/admin/themes" component={() => <ProtectedRoute><ThemesManagement /></ProtectedRoute>} />
      <Route path="/admin/info-sections" component={() => <ProtectedRoute><InfoSectionsManagement /></ProtectedRoute>} />
      <Route path="/admin/users" component={() => <ProtectedRoute><UsersManagement /></ProtectedRoute>} />
      <Route path="/admin/settings" component={() => <ProtectedRoute><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/profile" component={() => <ProtectedRoute><AdminProfile /></ProtectedRoute>} />
      <Route path="/admin/cruises/new" component={() => <ProtectedRoute><CruiseWizard /></ProtectedRoute>} />
      <Route path="/admin/cruises/:id/edit" component={() => <ProtectedRoute><CruiseWizard isEditing={true} /></ProtectedRoute>} />
      <Route path="/admin/cruises/:id" component={() => <ProtectedRoute><CruiseDetail /></ProtectedRoute>} />
      <Route path="/admin/cruises/active" component={() => <ProtectedRoute><ActiveCruises /></ProtectedRoute>} />
      <Route path="/admin/cruises/past" component={() => <ProtectedRoute><PastCruises /></ProtectedRoute>} />
      <Route path="/admin" component={() => <ProtectedRoute><NewAdminDashboard /></ProtectedRoute>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Unregister service worker to fix CSP blocking images
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister().then(() => {
            console.log('Service Worker unregistered:', registration.scope);
          });
        });
      });
    }

    // Disable browser scroll restoration globally
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
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
