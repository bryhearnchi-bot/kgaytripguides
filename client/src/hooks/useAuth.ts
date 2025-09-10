import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const queryClient = useQueryClient();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const user = await response.json();
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

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
    onSuccess: async (data) => {
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      // Also refresh auth status to ensure cookies are working
      await checkAuthStatus();
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

  return {
    ...authState,
    login: login.mutate,
    logout: logout.mutate,
    isLoginLoading: login.isPending,
    loginError: login.error?.message,
    refresh: checkAuthStatus,
  };
}