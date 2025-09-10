import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: { username: string; password: string }) => void;
  logout: () => void;
  isLoginLoading: boolean;
  loginError?: string;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const queryClient = useQueryClient();
  
  // In-flight check guard to prevent multiple concurrent auth calls
  const authCheckInFlight = useRef<Promise<void> | null>(null);

  // Check authentication status only ONCE when provider mounts
  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      // Prevent multiple concurrent auth checks
      if (authCheckInFlight.current) {
        return authCheckInFlight.current;
      }

      authCheckInFlight.current = (async () => {
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            cache: 'no-store', // Prevent 304 responses that cause loops
          });
          
          if (!isMounted) return;

          // Treat 304 as authenticated (ETag caching)
          if (response.ok || response.status === 304) {
            const data = response.status === 304 ? { user: null } : await response.json();
            if (data.user || response.status === 304) {
              setAuthState({
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          }
          
          // Not authenticated
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          if (!isMounted) return;
          
          console.error('Auth check failed:', error);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } finally {
          authCheckInFlight.current = null;
        }
      })();

      return authCheckInFlight.current;
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      return response.json();
    },
    onSuccess: () => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      queryClient.clear();
    },
  });

  // Manual refresh function - DEPRECATED: Only use for explicit user actions
  const refresh = async () => {
    // Note: This should rarely be used to prevent loops
    console.warn('Auth refresh called - this should be rare to prevent infinite loops');
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login: login.mutate,
        logout: logout.mutate,
        isLoginLoading: login.isPending,
        loginError: login.error?.message,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}