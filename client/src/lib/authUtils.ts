import { supabase } from './supabase';

/**
 * Enhanced error types for API responses
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  NO_SESSION = 'NO_SESSION',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Get authorization headers with fresh session token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    throw new ApiError('Failed to get authentication session', AuthErrorType.NO_SESSION);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else {
    throw new ApiError('No authentication token available', AuthErrorType.NO_SESSION);
  }

  return headers;
}

/**
 * Enhanced fetch wrapper with authentication and error handling
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Get authentication headers
    const authHeaders = await getAuthHeaders();

    // Merge headers
    const headers = {
      ...authHeaders,
      ...options.headers
    };

    // Make request with authentication
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    // Handle authentication errors
    if (response.status === 401) {
      throw new ApiError('Authentication failed', AuthErrorType.INVALID_TOKEN, 401);
    }

    if (response.status === 403) {
      throw new ApiError('Insufficient permissions', AuthErrorType.INSUFFICIENT_PERMISSIONS, 403);
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network connection failed', AuthErrorType.NETWORK_ERROR);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      AuthErrorType.UNKNOWN_ERROR
    );
  }
}

/**
 * Make authenticated GET request
 */
export async function authenticatedGet<T>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, { method: 'GET' });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(errorData.error || 'Request failed', undefined, response.status);
  }

  return response.json();
}

/**
 * Make authenticated POST request
 */
export async function authenticatedPost<T>(url: string, data?: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(errorData.error || 'Request failed', undefined, response.status);
  }

  return response.json();
}

/**
 * Make authenticated PUT request
 */
export async function authenticatedPut<T>(url: string, data?: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(errorData.error || 'Request failed', undefined, response.status);
  }

  return response.json();
}

/**
 * Make authenticated DELETE request
 */
export async function authenticatedDelete(url: string): Promise<void> {
  const response = await authenticatedFetch(url, { method: 'DELETE' });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(errorData.error || 'Request failed', undefined, response.status);
  }

  // Handle 204 No Content response
  if (response.status === 204) {
    return;
  }

  return response.json();
}

/**
 * Custom ApiError class
 */
export class ApiError extends Error {
  public code?: string;
  public status?: number;
  public details?: any;

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Check if user has admin role
 */
export async function requireAdminRole(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new ApiError('Authentication required', AuthErrorType.NO_SESSION);
  }

  // Check user role from profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    throw new ApiError('Unable to verify user permissions', AuthErrorType.INSUFFICIENT_PERMISSIONS);
  }

  if (profile.role !== 'admin') {
    throw new ApiError('Admin access required', AuthErrorType.INSUFFICIENT_PERMISSIONS);
  }
}

/**
 * Handle API errors consistently across components
 */
export function handleApiError(error: unknown, toast: any): void {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    switch (error.code) {
      case AuthErrorType.NO_SESSION:
        toast({
          title: 'Authentication Required',
          description: 'Please log in to continue.',
          variant: 'destructive'
        });
        // Optionally redirect to login
        break;

      case AuthErrorType.INVALID_TOKEN:
      case AuthErrorType.TOKEN_EXPIRED:
        toast({
          title: 'Session Expired',
          description: 'Please log in again.',
          variant: 'destructive'
        });
        // Force logout
        supabase.auth.signOut();
        break;

      case AuthErrorType.INSUFFICIENT_PERMISSIONS:
        toast({
          title: 'Access Denied',
          description: 'You don\'t have permission to perform this action.',
          variant: 'destructive'
        });
        break;

      case AuthErrorType.NETWORK_ERROR:
        toast({
          title: 'Connection Error',
          description: 'Please check your internet connection and try again.',
          variant: 'destructive'
        });
        break;

      default:
        toast({
          title: 'Error',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive'
        });
    }
  } else {
    toast({
      title: 'Error',
      description: 'An unexpected error occurred. Please try again.',
      variant: 'destructive'
    });
  }
}

/**
 * Retry mechanism for failed requests
 */
export async function retryAuthenticatedRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry authentication errors
      if (error instanceof ApiError && [
        AuthErrorType.NO_SESSION,
        AuthErrorType.INVALID_TOKEN,
        AuthErrorType.INSUFFICIENT_PERMISSIONS
      ].includes(error.code as AuthErrorType)) {
        throw error;
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError!;
}