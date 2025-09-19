import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          // Exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            // Navigate to login with generic error message
            navigate('/login?error=Authentication failed');
            return;
          }
        }

        // Check if we have a session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Successfully authenticated
          // Check if there's a redirect URL stored
          let redirectTo = sessionStorage.getItem('redirectAfterLogin');

          if (!redirectTo) {
            // Default redirect - go to admin dashboard for admin users
            redirectTo = '/admin/dashboard';
          }

          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectTo);
        } else {
          // No session, redirect to login
          navigate('/login');
        }
      } catch (error) {
        // Navigate to login with generic error message
        navigate('/login?error=Authentication failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
        <p className="text-gray-600 mt-2">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}