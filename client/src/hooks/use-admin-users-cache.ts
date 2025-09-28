/**
 * Client-side caching hook for admin users data
 * Provides intelligent caching and prefetching to eliminate flickering
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

interface AdminUsersQuery {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
  page?: number;
  limit?: number;
}

interface User {
  id: string;
  username: string | null;
  email: string;
  name: {
    first: string;
    last: string;
  } | null;
  role: string;
  is_active: boolean;
  account_status: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Cache configuration
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 30 * 1000; // 30 seconds

// Generate query key
function getUsersQueryKey(query: AdminUsersQuery): string[] {
  return ['admin', 'users', JSON.stringify(query)];
}

// Fetch function
async function fetchAdminUsers(query: AdminUsersQuery, authHeaders?: Record<string, string>): Promise<UsersResponse> {
  const params = new URLSearchParams();

  if (query.search) params.append('search', query.search);
  if (query.role && query.role !== 'all') params.append('role', query.role);
  if (query.status && query.status !== 'all') params.append('status', query.status);
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());

  const response = await fetch(`/api/admin/users?${params}`, {
    credentials: 'include',
    headers: {
      ...authHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  return response.json();
}

// Prefetch common queries
const COMMON_QUERIES: AdminUsersQuery[] = [
  { page: 1, limit: 20 }, // Default view
  { page: 1, limit: 20, status: 'active' }, // Active users
  { page: 1, limit: 20, role: 'super_admin' }, // Super admin users
  { page: 1, limit: 20, role: 'content_manager' }, // Content managers
];

export function useAdminUsersCache() {
  const queryClient = useQueryClient();
  const { profile, session } = useSupabaseAuthContext();

  // Check if user can manage users
  const canManageUsers = profile?.role && ['super_admin', 'content_manager'].includes(profile.role);

  // Prefetch common queries on mount (only if authenticated and has permissions)
  useEffect(() => {
    if (!canManageUsers || !session?.access_token || !profile) {
      return;
    }

    // Add a delay to ensure auth is fully established
    const timeoutId = setTimeout(() => {
      const authHeaders = session.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const prefetchPromises = COMMON_QUERIES.map((query) => {
        const queryKey = getUsersQueryKey(query);

        // Only prefetch if not already cached
        if (!queryClient.getQueryData(queryKey)) {
          return queryClient.prefetchQuery({
            queryKey,
            queryFn: () => fetchAdminUsers(query, authHeaders),
            staleTime: STALE_TIME,
            gcTime: CACHE_TIME,
          });
        }
        return Promise.resolve();
      });

      Promise.all(prefetchPromises).catch((error) => {
        console.warn('Failed to prefetch admin users data:', error);
      });
    }, 500); // 500ms delay to ensure auth is ready

    return () => clearTimeout(timeoutId);
  }, [queryClient, canManageUsers, session?.access_token, profile]);

  // Prefetch adjacent pages
  const prefetchAdjacentPages = useCallback(
    (currentQuery: AdminUsersQuery, totalPages: number) => {
      const currentPage = currentQuery.page || 1;

      // Prefetch next page
      if (currentPage < totalPages) {
        const nextQuery = { ...currentQuery, page: currentPage + 1 };
        queryClient.prefetchQuery({
          queryKey: getUsersQueryKey(nextQuery),
          queryFn: () => fetchAdminUsers(nextQuery),
          staleTime: STALE_TIME,
          gcTime: CACHE_TIME,
        });
      }

      // Prefetch previous page
      if (currentPage > 1) {
        const prevQuery = { ...currentQuery, page: currentPage - 1 };
        queryClient.prefetchQuery({
          queryKey: getUsersQueryKey(prevQuery),
          queryFn: () => fetchAdminUsers(prevQuery),
          staleTime: STALE_TIME,
          gcTime: CACHE_TIME,
        });
      }
    },
    [queryClient]
  );

  // Warm cache for filter combinations
  const warmCache = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users/warm-cache', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('Failed to warm cache:', response.statusText);
      }
    } catch (error) {
      console.warn('Failed to warm cache:', error);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['admin', 'users'] });
  }, [queryClient]);

  return {
    prefetchAdjacentPages,
    warmCache,
    clearCache,
  };
}

export function useAdminUsers(query: AdminUsersQuery) {
  const { prefetchAdjacentPages } = useAdminUsersCache();
  const { profile, session } = useSupabaseAuthContext();

  // Check if user can manage users
  const canManageUsers = profile?.role && ['super_admin', 'content_manager'].includes(profile.role);

  const authHeaders = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const result = useQuery({
    queryKey: getUsersQueryKey(query),
    queryFn: () => fetchAdminUsers(query, authHeaders),
    enabled: canManageUsers && !!session?.access_token,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    // Keep previous data while fetching new data to prevent flickering
    placeholderData: (previousData) => previousData,
  });

  // Prefetch adjacent pages when data loads successfully
  useEffect(() => {
    if (result.isSuccess && result.data?.pagination) {
      prefetchAdjacentPages(query, result.data.pagination.pages);
    }
  }, [result.isSuccess, result.data, query, prefetchAdjacentPages]);

  return result;
}

// Hook for optimistic updates
export function useAdminUserMutations() {
  const queryClient = useQueryClient();

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  }, [queryClient]);

  const updateUserOptimistically = useCallback(
    (userId: string, updates: Partial<User>) => {
      queryClient.setQueriesData(
        { queryKey: ['admin', 'users'] },
        (oldData: UsersResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            users: oldData.users.map((user) =>
              user.id === userId ? { ...user, ...updates } : user
            ),
          };
        }
      );
    },
    [queryClient]
  );

  const addUserOptimistically = useCallback(
    (newUser: User) => {
      queryClient.setQueriesData(
        { queryKey: ['admin', 'users'] },
        (oldData: UsersResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            users: [newUser, ...oldData.users],
            pagination: {
              ...oldData.pagination,
              total: oldData.pagination.total + 1,
            },
          };
        }
      );
    },
    [queryClient]
  );

  const removeUserOptimistically = useCallback(
    (userId: string) => {
      queryClient.setQueriesData(
        { queryKey: ['admin', 'users'] },
        (oldData: UsersResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            users: oldData.users.filter((user) => user.id !== userId),
            pagination: {
              ...oldData.pagination,
              total: oldData.pagination.total - 1,
            },
          };
        }
      );
    },
    [queryClient]
  );

  return {
    invalidateUsers,
    updateUserOptimistically,
    addUserOptimistically,
    removeUserOptimistically,
  };
}