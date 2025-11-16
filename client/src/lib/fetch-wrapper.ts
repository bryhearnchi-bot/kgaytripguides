/**
 * Global Fetch Wrapper
 * Automatically converts relative API URLs to absolute URLs
 */

import { getApiUrl } from './api-config';

// Store the original fetch
const originalFetch = window.fetch;

/**
 * Custom fetch that handles relative URLs.
 *
 * ONLINE:
 *   - `/api/...` → `API_BASE_URL + path` (remote API host when configured)
 *
 * OFFLINE:
 *   - `/api/...` stays on the current origin so the service worker and
 *     trip-specific offline caches can satisfy requests.
 *   - This is critical for PWA offline mode when VITE_API_URL points
 *     at a different host that isn't available offline.
 */
export const customFetch: typeof fetch = (input, init?) => {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  // If input is a string and starts with /api/, optionally convert to full URL
  if (typeof input === 'string' && input.startsWith('/api')) {
    const url = isOffline ? input : getApiUrl(input);
    return originalFetch(url, init);
  }

  // If input is a Request object with a relative URL
  if (input instanceof Request && input.url.startsWith('/api')) {
    const targetUrl = isOffline ? input.url : getApiUrl(input.url);
    const newRequest = new Request(targetUrl, input);
    return originalFetch(newRequest, init);
  }

  // Otherwise, use original fetch
  return originalFetch(input, init);
};

/**
 * Install the custom fetch globally
 */
export function installFetchWrapper() {
  window.fetch = customFetch;
}

/**
 * Restore the original fetch
 */
export function uninstallFetchWrapper() {
  window.fetch = originalFetch;
}
