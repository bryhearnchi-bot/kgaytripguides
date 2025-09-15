import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { TimeFormatProvider } from "@/contexts/TimeFormatContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavigationBanner from "@/components/navigation-banner";
import LandingPage from "@/pages/landing";
import TripPage from "@/pages/trip";
import AdminLogin from "@/pages/admin/login";
import ForgotPassword from "@/pages/admin/forgot-password";
import ResetPassword from "@/pages/admin/reset-password";
import AdminDashboard from "@/pages/admin/dashboard";
import TripsManagement from "@/pages/admin/trips";
import TripForm from "@/pages/admin/trip-form";
import TalentManagement from "@/pages/admin/talent";
import NotFound from "@/pages/not-found";
import ImageTest from "@/pages/image-test";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/image-test" component={ImageTest} />
      <Route path="/trip/:slug" component={TripPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/forgot-password" component={ForgotPassword} />
      <Route path="/admin/reset-password/:token" component={ResetPassword} />
      <Route path="/admin/dashboard" component={() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/trips" component={() => <ProtectedRoute><TripsManagement /></ProtectedRoute>} />
      <Route path="/admin/trips/new" component={() => <ProtectedRoute><TripForm isEditing={false} /></ProtectedRoute>} />
      <Route path="/admin/trips/:id/edit" component={() => <ProtectedRoute><TripForm isEditing={true} /></ProtectedRoute>} />
      <Route path="/admin/talent" component={() => <ProtectedRoute><TalentManagement /></ProtectedRoute>} />
      <Route path="/admin" component={() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
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
        <AuthProvider>
          <TimeFormatProvider>
            <TooltipProvider>
              <NavigationBanner />
              <div className="pt-10 w-full"> {/* Add padding to account for fixed banner */}
                <Toaster />
                <Router />
              </div>
            </TooltipProvider>
          </TimeFormatProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
