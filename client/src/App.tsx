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
import CruisePage from "@/pages/cruise";
import AdminLogin from "@/pages/admin/login";
import ForgotPassword from "@/pages/admin/forgot-password";
import ResetPassword from "@/pages/admin/reset-password";
import AdminDashboard from "@/pages/admin/dashboard";
import CruisesManagement from "@/pages/admin/cruises";
import CruiseForm from "@/pages/admin/cruise-form";
import TalentManagement from "@/pages/admin/talent";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/cruise/:slug" component={CruisePage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/forgot-password" component={ForgotPassword} />
      <Route path="/admin/reset-password/:token" component={ResetPassword} />
      <Route path="/admin/dashboard" component={() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/cruises" component={() => <ProtectedRoute><CruisesManagement /></ProtectedRoute>} />
      <Route path="/admin/cruises/new" component={() => <ProtectedRoute><CruiseForm isEditing={false} /></ProtectedRoute>} />
      <Route path="/admin/cruises/:id/edit" component={() => <ProtectedRoute><CruiseForm isEditing={true} /></ProtectedRoute>} />
      <Route path="/admin/talent" component={() => <ProtectedRoute><TalentManagement /></ProtectedRoute>} />
      <Route path="/admin" component={() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TimeFormatProvider>
          <TooltipProvider>
            <NavigationBanner />
            <Toaster />
            <Router />
          </TooltipProvider>
        </TimeFormatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
