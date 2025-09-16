import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Ship } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Listen for auth changes first since getSession() might hang
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('ProtectedRoute: Auth state change:', event, session?.user?.email);
      setSession(session);
      setLoading(false); // Set loading to false when we get auth state

      if (!session) {
        setLocation('/login');
      }
    });

    // Also try getSession with a timeout
    const timeoutId = setTimeout(() => {
      console.log('ProtectedRoute: Session check timed out');
      setLoading(false);
    }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeoutId);
      console.log('ProtectedRoute: Got session:', session?.user?.email);
      setSession(session);
      setLoading(false);

      if (!session) {
        setLocation('/login');
      }
    }).catch(error => {
      clearTimeout(timeoutId);
      console.error('ProtectedRoute: Error getting session:', error);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [setLocation]);

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