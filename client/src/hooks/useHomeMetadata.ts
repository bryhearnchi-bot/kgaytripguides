import { useEffect } from 'react';

/**
 * Hook to set default metadata for the home/landing page
 * This ensures proper social sharing with the KGay logo when sharing the main site
 * CRITICAL: Also ensures theme-color is set for Safari iOS address bar
 */
export function useHomeMetadata() {
  useEffect(() => {
    // Set default document title
    document.title = 'KGay Travel Guides';

    // Get absolute URL for logo
    const logoUrl = `${window.location.origin}/logos/kgay-logo.jpg`;
    const siteUrl = window.location.origin;

    // Update Open Graph meta tags for home page
    updateMetaTag('og:title', 'KGay Travel Guides');
    updateMetaTag(
      'og:description',
      'Comprehensive LGBTQ+ travel guides for cruise adventures and destinations. Interactive itineraries, entertainment schedules, and travel resources.'
    );
    updateMetaTag('og:image', logoUrl);
    updateMetaTag('og:url', siteUrl);
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:site_name', 'KGay Travel Guides');

    // Update Twitter Card meta tags for home page
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', 'KGay Travel Guides');
    updateMetaTag(
      'twitter:description',
      'Comprehensive LGBTQ+ travel guides for cruise adventures and destinations. Interactive itineraries, entertainment schedules, and travel resources.'
    );
    updateMetaTag('twitter:image', logoUrl);

    // Update general meta description
    updateMetaTag(
      'description',
      'Comprehensive LGBTQ+ travel guides for cruise adventures and destinations. Interactive itineraries, entertainment schedules, and travel resources.',
      'name'
    );

    // CRITICAL: Ensure theme-color is set for Safari iOS address bar
    // This is a fallback in case the static HTML meta tag was removed by service worker caching
    updateMetaTag('theme-color', '#002147', 'name');
    updateMetaTag('color-scheme', 'dark', 'name');

    // Ensure default manifest is active (not trip-specific)
    restoreDefaultManifest();
  }, []);
}

/**
 * Updates or creates a meta tag with the specified property and content
 */
function updateMetaTag(property: string, content: string, attributeName: string = 'property') {
  let element = document.querySelector(`meta[${attributeName}="${property}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, property);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Restores the default manifest link when on home page
 */
function restoreDefaultManifest() {
  // Remove any trip-specific manifest
  const tripManifest = document.querySelector('link[rel="manifest"][data-trip-manifest]');
  if (tripManifest) {
    tripManifest.remove();
  }

  // Restore default manifest
  const defaultManifest = document.querySelector('link[data-disabled="true"]');
  if (defaultManifest) {
    defaultManifest.removeAttribute('data-disabled');
    (defaultManifest as HTMLLinkElement).rel = 'manifest';
  }
}
