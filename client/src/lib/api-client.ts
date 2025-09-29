/**
 * API Client Utility for Admin Panel
 *
 * Provides a consistent way to make authenticated API calls
 * with proper headers including Bearer token from Supabase
 */

import { supabase } from './supabase';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Makes an authenticated API request with proper headers
 * @param url The API endpoint URL
 * @param options Fetch options
 * @returns The fetch response
 */
export async function apiClient(url: string, options: FetchOptions = {}): Promise<Response> {
  const { requireAuth = true, headers = {}, ...restOptions } = options;

  // Get the current session from Supabase
  const { data: { session } } = await supabase.auth.getSession();

  // Debug logging for profile update debugging
  if (url.includes('/profile')) {
    console.log('API Client Debug:', {
      url,
      method: restOptions.method,
      hasSession: !!session,
      hasToken: !!session?.access_token,
      tokenLength: session?.access_token?.length || 0,
      requireAuth
    });
  }

  // Build headers
  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  // Add content type for non-FormData bodies
  if (restOptions.body && !(restOptions.body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Add Authorization header if we have a session
  if (requireAuth && session?.access_token) {
    requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
  }

  // Make the request
  return fetch(url, {
    ...restOptions,
    headers: requestHeaders,
    credentials: 'include', // Include cookies for backward compatibility
  });
}

/**
 * Helper functions for common HTTP methods
 */
export const api = {
  async get(url: string, options?: FetchOptions) {
    return apiClient(url, { ...options, method: 'GET' });
  },

  async post(url: string, body?: any, options?: FetchOptions) {
    return apiClient(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async put(url: string, body?: any, options?: FetchOptions) {
    return apiClient(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async patch(url: string, body?: any, options?: FetchOptions) {
    return apiClient(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async delete(url: string, options?: FetchOptions) {
    return apiClient(url, { ...options, method: 'DELETE' });
  },
};

export default apiClient;