/**
 * CSRF Token Management Utility
 *
 * Handles fetching and managing CSRF tokens for protected API endpoints.
 * Uses double-submit cookie pattern for CSRF protection.
 */

/**
 * Gets the CSRF token from cookies or fetches a new one if needed
 * @returns The CSRF token string
 */
export async function getCsrfToken(): Promise<string> {
  // Try to get token from cookie first
  let csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('_csrf='))
    ?.split('=')[1];

  // If no token in cookie, fetch one from the server
  if (!csrfToken) {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }

    const data = await response.json();
    csrfToken = data.csrfToken;

    // Store token in cookie for future requests
    document.cookie = `_csrf=${encodeURIComponent(csrfToken)}; path=/; max-age=3600; samesite=strict`;
  }

  return csrfToken;
}

/**
 * Adds CSRF token to request headers
 * @param headers Existing headers object
 * @returns Headers object with CSRF token added
 */
export async function addCsrfHeader(headers: Record<string, string> = {}): Promise<Record<string, string>> {
  const csrfToken = await getCsrfToken();
  return {
    ...headers,
    'x-csrf-token': csrfToken,
  };
}

/**
 * Checks if a request method requires CSRF protection
 * @param method HTTP method
 * @returns True if CSRF protection is required
 */
export function requiresCsrf(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  return !safeMethods.includes(method.toUpperCase());
}