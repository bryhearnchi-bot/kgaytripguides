import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface TripMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  siteName: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

/**
 * Hook to dynamically update page metadata and PWA manifest for trip-specific installations
 * This enables:
 * - Social sharing with trip-specific images and descriptions
 * - PWA installations that are scoped to a single trip
 * - Dynamic document title and meta tags
 */
export function useTripMetadata(slug: string | undefined, tripName?: string) {
  useEffect(() => {
    if (!slug) return;

    // Update document title
    if (tripName) {
      document.title = `${tripName} | KGay Travel Guides`;
    }

    // Fetch trip metadata from API
    fetch(`/api/trips/${slug}/metadata`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch metadata');
        return res.json();
      })
      .then((metadata: TripMetadata) => {
        // Update Open Graph meta tags
        updateMetaTag('og:title', metadata.title);
        updateMetaTag('og:description', metadata.description);
        updateMetaTag('og:image', getAbsoluteUrl(metadata.image));
        updateMetaTag('og:url', getAbsoluteUrl(metadata.url));
        updateMetaTag('og:type', metadata.type);
        updateMetaTag('og:site_name', metadata.siteName);

        // Update canonical URL
        updateCanonicalLink(metadata.url);

        // Update Twitter Card meta tags
        updateMetaTag('twitter:card', metadata.twitterCard);
        updateMetaTag('twitter:title', metadata.twitterTitle);
        updateMetaTag('twitter:description', metadata.twitterDescription);
        updateMetaTag('twitter:image', getAbsoluteUrl(metadata.twitterImage));

        // Update general meta description
        updateMetaTag('description', metadata.description, 'name');

        // Update iOS-specific meta tags for proper PWA behavior
        updateAppleMetaTags(slug, metadata.title);

        // Note: Manifest link is now injected server-side for better iOS compatibility
        // Client-side injection was causing conflicts with iOS Add to Home Screen
      })
      .catch(error => {
        logger.error('Failed to load trip metadata', error);
      });

    // Note: Cleanup is minimal now since manifest is server-side
    // When navigating away, the server will serve the appropriate manifest
    return () => {
      // Optional: Could restore default meta tags here if needed
    };
  }, [slug, tripName]);
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
 * Converts relative URLs to absolute URLs for social sharing
 */
function getAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${window.location.origin}${url}`;
}

/**
 * Injects a trip-specific manifest link tag
 */
function injectManifestLink(slug: string) {
  // Remove existing trip manifest if any
  const existingTripManifest = document.querySelector('link[rel="manifest"][data-trip-manifest]');
  if (existingTripManifest) {
    existingTripManifest.remove();
  }

  // Remove or hide the default manifest
  const defaultManifest = document.querySelector('link[rel="manifest"]:not([data-trip-manifest])');
  if (defaultManifest) {
    defaultManifest.setAttribute('data-disabled', 'true');
    (defaultManifest as HTMLLinkElement).rel = '';
  }

  // Create and inject trip-specific manifest
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = `/api/trips/${slug}/manifest.json`;
  manifestLink.setAttribute('data-trip-manifest', 'true');
  document.head.appendChild(manifestLink);
}

/**
 * Restores the default manifest link when leaving trip page
 */
function restoreDefaultManifest() {
  // Remove trip-specific manifest
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

  // Remove iOS-specific meta tags
  const appleStartUrl = document.querySelector('meta[name="apple-mobile-web-app-start-url"]');
  if (appleStartUrl) {
    appleStartUrl.remove();
  }

  // Restore default apple-mobile-web-app-title
  updateMetaTag('apple-mobile-web-app-title', 'KGay Guides', 'name');
}

/**
 * Updates iOS-specific meta tags for proper Add to Home Screen behavior
 * CRITICAL iOS PWA Fix: Match start-url to the trip page to maintain context
 */
function updateAppleMetaTags(slug: string, tripName: string) {
  // CRITICAL iOS PWA Fix: Set start URL to current trip with pwa=true parameter
  // This ensures iOS recognizes the entire scope when navigating
  const startUrl = `/trip/${slug}?pwa=true`;
  updateMetaTag('apple-mobile-web-app-start-url', startUrl, 'name');

  // Update the app title for iOS
  const shortName = tripName.length > 12 ? tripName.substring(0, 12) : tripName;
  updateMetaTag('apple-mobile-web-app-title', shortName, 'name');

  // Ensure apple-mobile-web-app-capable is set
  updateMetaTag('apple-mobile-web-app-capable', 'yes', 'name');

  // CRITICAL: Use black-translucent for better PWA immersion
  updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent', 'name');
}

/**
 * Updates or creates a canonical link tag
 */
function updateCanonicalLink(url: string) {
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }

  canonicalLink.href = getAbsoluteUrl(url);
}
