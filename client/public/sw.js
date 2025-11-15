const CACHE_NAME = 'k-gay-travel-guide-v5';
const STATIC_CACHE = 'static-v6';
const API_CACHE = 'api-v6';
const IMAGE_CACHE = 'images-v5';
const FONT_CACHE = 'fonts-v3';

// Maximum items in each cache to prevent unbounded growth
const MAX_API_CACHE_ITEMS = 100;
const MAX_IMAGE_CACHE_ITEMS = 500;

// Assets to cache on install
// CRITICAL: Never cache '/' or '/index.html' to prevent stale theme-color meta tags
// Safari iOS needs fresh HTML to read theme-color for address bar
const STATIC_ASSETS = [
  '/manifest.json',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
  // Critical fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  // Add other critical assets as they're built
];

// Critical API endpoints to cache on install for PWA offline access
const CRITICAL_API_ENDPOINTS = ['/api/trips']; // Landing page data

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Also cache critical API endpoints for PWA offline access
        console.log('Service Worker: Caching critical API endpoints');
        return caches.open(API_CACHE).then(apiCache => {
          return Promise.allSettled(
            CRITICAL_API_ENDPOINTS.map(endpoint =>
              fetch(endpoint)
                .then(response => {
                  if (response.ok) {
                    return apiCache.put(endpoint, response);
                  }
                })
                .catch(err => {
                  console.warn('Service Worker: Failed to cache critical endpoint', endpoint, err);
                })
            )
          );
        });
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Install failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [STATIC_CACHE, API_CACHE, CACHE_NAME, IMAGE_CACHE, FONT_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip broken Unsplash URLs
  if (url.hostname === 'images.unsplash.com') {
    return;
  }

  // Handle API requests with network-first strategy
  // Skip cross-origin API requests (for Capacitor development)
  if (url.pathname.startsWith('/api/')) {
    // Only intercept if same origin
    if (url.origin === self.location.origin) {
      // Use progressive caching - cache all API responses automatically
      event.respondWith(networkFirstWithProgressiveCaching(request, API_CACHE));
    }
    return;
  }

  // Handle image requests with cache-first strategy
  if (
    request.destination === 'image' ||
    url.pathname.includes('/images/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('kgaytravel.com') ||
    url.hostname.includes('freepik.com')
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Handle static assets with stale-while-revalidate
  // CRITICAL: Never cache '/' (root HTML) - Safari iOS needs fresh HTML for theme-color meta tag
  if (
    url.pathname.includes('/assets/') ||
    url.pathname.includes('.js') ||
    url.pathname.includes('.css')
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Handle navigation requests (HTML pages) - always fetch fresh
  // This ensures Safari iOS gets latest theme-color meta tags
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request, {
        cache: 'no-store', // Force fresh fetch, bypass HTTP cache
      }).catch(() => {
        // Fallback to cached response only if offline
        return (
          caches.match(request) ||
          new Response('Offline', {
            status: 503,
            headers: new Headers({ 'Content-Type': 'text/html' }),
          })
        );
      })
    );
    return;
  }

  // Default strategy for other requests
  event.respondWith(networkFirst(request, CACHE_NAME));
});

// Network-first strategy with progressive caching (good for API calls)
// This caches ALL API responses automatically as users navigate
async function networkFirstWithProgressiveCaching(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);

      // Enforce cache size limit to prevent unbounded growth
      const keys = await cache.keys();
      if (keys.length >= MAX_API_CACHE_ITEMS) {
        // Remove oldest 10% of items
        const itemsToRemove = Math.floor(keys.length * 0.1);
        for (let i = 0; i < itemsToRemove; i++) {
          await cache.delete(keys[i]);
        }
      }

      // Cache the response for future offline use
      cache.put(request, networkResponse.clone());

      // Progressive caching: Also cache related trip data in trip-specific caches
      // Extract trip ID from URL if present
      const url = new URL(request.url);
      const tripIdMatch = url.pathname.match(/\/trips\/(\d+)\/|\/trip\/(\d+)/);
      if (tripIdMatch) {
        const tripId = tripIdMatch[1] || tripIdMatch[2];
        const tripCacheName = `trip-${tripId}-offline`;
        const tripCache = await caches.open(tripCacheName);
        // Store in trip-specific cache for better offline organization
        tripCache.put(request, networkResponse.clone());
      }

      return networkResponse;
    }

    // If network fails, try cache
    return (await caches.match(request)) || networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Check trip-specific offline caches
    // These are created by OfflineStorageContext when user enables offline mode
    const cacheNames = await caches.keys();
    const tripCaches = cacheNames.filter(
      name => name.startsWith('trip-') && name.endsWith('-offline')
    );

    for (const tripCacheName of tripCaches) {
      const tripCache = await caches.open(tripCacheName);
      const tripCachedResponse = await tripCache.match(request);
      if (tripCachedResponse) {
        console.log('[ServiceWorker] Found in trip offline cache:', tripCacheName, request.url);
        return tripCachedResponse;
      }
    }

    // Return offline fallback
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'Please check your internet connection',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      }
    );
  }
}

// Legacy network-first strategy (kept for backwards compatibility)
async function networkFirst(request, cacheName) {
  return networkFirstWithProgressiveCaching(request, cacheName);
}

// Cache-first strategy (good for images and assets that don't change)
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Check trip-specific offline caches for images
  const cacheNames = await caches.keys();
  const tripCaches = cacheNames.filter(
    name => name.startsWith('trip-') && name.endsWith('-offline')
  );

  for (const tripCacheName of tripCaches) {
    const tripCache = await caches.open(tripCacheName);
    const tripCachedResponse = await tripCache.match(request);
    if (tripCachedResponse) {
      console.log('[ServiceWorker] Found image in trip offline cache:', tripCacheName, request.url);
      return tripCachedResponse;
    }
  }

  try {
    // Use appropriate fetch options for cross-origin requests
    const fetchOptions = {};
    const url = new URL(request.url);
    const isCrossOrigin = url.origin !== self.location.origin;

    if (isCrossOrigin && request.destination === 'image') {
      fetchOptions.mode = 'cors';
      fetchOptions.credentials = 'omit';
    }

    const networkResponse = await fetch(request, fetchOptions);

    // Cache successful responses (including opaque responses for cross-origin)
    if (networkResponse.ok || networkResponse.type === 'opaque') {
      const cache = await caches.open(IMAGE_CACHE);

      // Enforce cache size limit to prevent unbounded growth
      const keys = await cache.keys();
      if (keys.length >= MAX_IMAGE_CACHE_ITEMS) {
        // Remove oldest 10% of items
        const itemsToRemove = Math.floor(keys.length * 0.1);
        for (let i = 0; i < itemsToRemove; i++) {
          await cache.delete(keys[i]);
        }
      }

      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return a placeholder image for failed image requests
    if (request.destination === 'image') {
      return new Response(
        `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#F3F4F6"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M100 90C105.523 90 110 94.4772 110 100C110 105.523 105.523 110 100 110C94.4772 110 90 105.523 90 100C90 94.4772 94.4772 90 100 90Z" fill="#D1D5DB"/>
        </svg>`,
        {
          status: 200,
          headers: new Headers({
            'Content-Type': 'image/svg+xml',
          }),
        }
      );
    }

    throw error;
  }
}

// Stale-while-revalidate strategy (good for frequently updated content)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Listen for message from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
      event.waitUntil(doBackgroundSync());
    }
  });
}

async function doBackgroundSync() {
  // Handle background sync tasks
  console.log('Service Worker: Background sync triggered');
}
