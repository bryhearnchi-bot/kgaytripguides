import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Ship } from 'lucide-react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { session, loading } = useSupabaseAuthContext();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!loading && !session) {
      setLocation('/login');
    }
  }, [session, loading, setLocation]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Ship className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect will happen via useEffect, show loading for now
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Ship className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Skip role checking for now - all authenticated users can access admin
  // TODO: Implement role checking once profile fetching is fixed

  return <>{children}</>;
}