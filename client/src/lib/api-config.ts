/**
 * API Configuration
 * Provides the base URL for API calls based on environment
 */

// Get the API base URL from environment variable
// Falls back to relative URLs for production
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Helper function to build full API URLs
 * @param path - API endpoint path (e.g., '/api/trips')
 * @returns Full URL
 */
export function getApiUrl(path: string): string {
  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
