import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

/**
 * Hook to prefetch admin data based on user permissions
 * Optimizes the admin experience by loading data before users navigate to specific tabs
 */
export function useAdminPrefetch() {
  const queryClient = useQueryClient();
  const { profile } = useSupabaseAuthContext();
  const prefetchedRef = useRef(false);

  const prefetchQuery = async (queryKey: string[], endpoint: string) => {
    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const response = await fetch(endpoint, {
            credentials: 'include'
          });
          if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
          return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes
      });
    } catch (error) {
      // Silently fail prefetch attempts to avoid disrupting UX
      console.debug(`Prefetch failed for ${endpoint}:`, error);
    }
  };

  useEffect(() => {
    // Only prefetch once per session and when user is authenticated
    if (!profile || prefetchedRef.current) return;

    const prefetchAdminData = async () => {
      // Core management data - accessible to content managers and admins
      const managementQueries = [
        { queryKey: ['ships'], endpoint: '/api/ships' },
        { queryKey: ['talent'], endpoint: '/api/talent' },
        { queryKey: ['party-themes'], endpoint: '/api/party-themes' },
        { queryKey: ['locations'], endpoint: '/api/locations' },
        { queryKey: ['trip-info-sections'], endpoint: '/api/trip-info-sections' },
        { queryKey: ['trips'], endpoint: '/api/trips' },
      ];

      // Admin-only data
      const adminQueries = [
        { queryKey: ['users'], endpoint: '/api/admin/users' },
      ];

      // Prefetch management data for content managers and above
      if (profile.role && ['super_admin', 'content_manager'].includes(profile.role)) {
        await Promise.allSettled(
          managementQueries.map(({ queryKey, endpoint }) =>
            prefetchQuery(queryKey, endpoint)
          )
        );
      }

      // Prefetch admin data for super admins only
      if (profile.role && ['super_admin'].includes(profile.role)) {
        await Promise.allSettled(
          adminQueries.map(({ queryKey, endpoint }) =>
            prefetchQuery(queryKey, endpoint)
          )
        );
      }

      prefetchedRef.current = true;
    };

    // Small delay to avoid blocking initial render
    const timeout = setTimeout(prefetchAdminData, 100);
    return () => clearTimeout(timeout);
  }, [profile, queryClient]);

  return {
    isPrefetched: prefetchedRef.current
  };
}

/**
 * Hook to get optimized query options for admin pages
 * Provides consistent caching and loading behavior across all admin queries
 */
export function useAdminQueryOptions() {
  return {
    staleTime: 5 * 60 * 1000,     // Data fresh for 5 minutes
    gcTime: 10 * 60 * 1000,       // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,   // Don't refetch on focus
    refetchOnMount: 'always' as const, // Always check for updates on mount
    retry: (failureCount: number, error: Error) => {
      // Don't retry auth errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 2; // Retry up to 2 times
    },
  };
}