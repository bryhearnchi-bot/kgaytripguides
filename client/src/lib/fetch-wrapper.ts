/**
 * Global Fetch Wrapper
 * Automatically converts relative API URLs to absolute URLs
 */

import { getApiUrl } from './api-config';

// Store the original fetch
const originalFetch = window.fetch;

/**
 * Custom fetch that handles relative URLs
 */
export const customFetch: typeof fetch = (input, init?) => {
  // If input is a string and starts with /api/, convert to full URL
  if (typeof input === 'string' && input.startsWith('/api')) {
    return originalFetch(getApiUrl(input), init);
  }

  // If input is a Request object with a relative URL
  if (input instanceof Request && input.url.startsWith('/api')) {
    const fullUrl = getApiUrl(input.url);
    const newRequest = new Request(fullUrl, input);
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
