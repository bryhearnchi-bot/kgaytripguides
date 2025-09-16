import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

interface SupabaseProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function SupabaseProtectedRoute({ children, requireAdmin = false }: SupabaseProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useSupabaseAuthContext();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Store the current location for redirect after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/login');
      } else if (requireAdmin && !isAdmin) {
        // User is authenticated but not an admin
        navigate('/');
      }
    }
  }, [isAuthenticated, isAdmin, loading, navigate, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}