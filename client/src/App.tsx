import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavigationBanner from "@/components/navigation-banner";
import LandingPage from "@/pages/landing";
import CruisePage from "@/pages/cruise";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import CruisesManagement from "@/pages/admin/cruises";
import CruiseForm from "@/pages/admin/cruise-form";
import UnifiedCruiseEditor from "@/pages/admin/unified-cruise-editor";
import TalentManagement from "@/pages/admin/talent";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/cruise/:slug" component={CruisePage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/cruises" component={() => <ProtectedRoute><CruisesManagement /></ProtectedRoute>} />
      <Route path="/admin/cruises/new" component={() => <ProtectedRoute><CruiseForm isEditing={false} /></ProtectedRoute>} />
      <Route path="/admin/cruises/:id/edit" component={() => <ProtectedRoute><CruiseForm isEditing={true} /></ProtectedRoute>} />
      <Route path="/admin/cruises/unified/new" component={() => <ProtectedRoute><UnifiedCruiseEditor /></ProtectedRoute>} />
      <Route path="/admin/cruises/:id/unified" component={({ params }) => <ProtectedRoute><UnifiedCruiseEditor cruiseId={parseInt(params.id)} /></ProtectedRoute>} />
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
        <TooltipProvider>
          <NavigationBanner />
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
