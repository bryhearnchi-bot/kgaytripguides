/**
 * CSRF Token Utilities
 *
 * Handles CSRF token management for the application using the double-submit cookie pattern.
 * The token must be present in both a cookie and a header/body for validation.
 */

/**
 * Get CSRF token from cookie
 * The cookie must be accessible to JavaScript (httpOnly: false)
 */
export function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_csrf') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Fetch CSRF token from the server if not in cookie
 * This will set the cookie and return the token
 */
export async function ensureCsrfToken(): Promise<string> {
  // First check if we have a token in the cookie
  let token = getCsrfToken();

  if (!token) {
    // If no token in cookie, fetch from server to get one set
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }

    const data = await response.json();
    token = data.csrfToken;

    // The server should have set the cookie, but if using the token from response
    // we can also manually set it to ensure consistency
    if (token && !getCsrfToken()) {
      document.cookie = `_csrf=${encodeURIComponent(token)}; path=/; max-age=3600; samesite=strict`;
    }
  }

  return token || '';
}

/**
 * Add CSRF token to fetch headers
 */
export async function addCsrfToken(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await ensureCsrfToken();

  return {
    ...headers,
    'x-csrf-token': token,
  };
}