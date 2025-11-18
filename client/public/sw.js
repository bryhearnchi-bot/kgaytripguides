// Service Worker for KGay Travel Guides
// Version will be injected during build
const CACHE_VERSION = self.__BUILD_TIMESTAMP__ || Date.now();
const CACHE_NAME = `kgay-guides-v${CACHE_VERSION}`;
const API_CACHE_NAME = `kgay-api-v${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
// CRITICAL: Never cache root '/' HTML to prevent stale theme-color meta tags
// Safari iOS needs fresh HTML to read theme-color for address bar
const STATIC_CACHE_URLS = ['/offline.html', '/manifest.json'];

// Dynamic cache settings
const MAX_API_CACHE_ITEMS = 50;
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing version:', CACHE_VERSION);

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS).catch(error => {
          console.error('[ServiceWorker] Failed to cache some resources:', error);
          // Continue even if some resources fail
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating version:', CACHE_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete all old caches except current version
            if (
              cacheName.startsWith('kgay-') &&
              cacheName !== CACHE_NAME &&
              cacheName !== API_CACHE_NAME
            ) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip service worker handling for admin routes - these are client-side routes
  // Admin routes should always go directly to the network to avoid caching issues
  if (url.pathname.startsWith('/admin/')) {
    // Explicitly pass through to network for admin routes
    event.respondWith(
      fetch(request).catch(error => {
        console.error('[ServiceWorker] Admin route fetch failed:', error);
        return new Response('Network error', { status: 503 });
      })
    );
    return;
  }

  // Handle navigation requests
  // CRITICAL iOS PWA Fix: Use network-first with proper headers to maintain PWA context
  // This prevents iOS from showing browser chrome during in-app navigation
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, {
        cache: 'no-store', // Force fresh fetch for meta tags
        credentials: 'same-origin',
        redirect: 'manual', // Handle redirects manually to maintain PWA context
      })
        .then(response => {
          // Handle manual redirects while staying in PWA
          if (
            response.type === 'opaqueredirect' ||
            (response.status >= 300 && response.status < 400)
          ) {
            const location = response.headers.get('Location');
            if (location) {
              return fetch(location, {
                cache: 'no-store',
                credentials: 'same-origin',
              });
            }
          }
          return response;
        })
        .catch(async () => {
          // Network failed - try to serve cached app shell from trip offline caches
          // This allows the SPA to load even when offline
          const cacheNames = await caches.keys();
          const tripCaches = cacheNames.filter(
            name => name.startsWith('trip-') && name.endsWith('-offline')
          );

          // Try to find the cached root HTML (app shell) in any trip cache
          for (const cacheName of tripCaches) {
            const tripCache = await caches.open(cacheName);
            const cachedHtml = await tripCache.match('/');
            if (cachedHtml) {
              console.log('[ServiceWorker] Serving cached app shell from:', cacheName);
              return cachedHtml;
            }
          }

          // No cached app shell found, fall back to offline page
          return caches
            .open(CACHE_NAME)
            .then(cache => cache.match(OFFLINE_URL))
            .then(response => {
              // If offline page not found, return a basic offline response
              if (!response) {
                return new Response(
                  '<html><body><h1>Offline</h1><p>Please check your internet connection.</p></body></html>',
                  {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: {
                      'Content-Type': 'text/html',
                    },
                  }
                );
              }
              return response;
            });
        })
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static resources
  event.respondWith(
    caches.match(request).then(async response => {
      if (response) {
        return response;
      }

      // Check trip-specific offline caches for images and other static resources
      const cacheNames = await caches.keys();
      const tripCaches = cacheNames.filter(
        name => name.startsWith('trip-') && name.endsWith('-offline')
      );

      for (const cacheName of tripCaches) {
        const tripCache = await caches.open(cacheName);
        const tripCachedResponse = await tripCache.match(request);
        if (tripCachedResponse) {
          console.log(
            '[ServiceWorker] Found static resource in trip offline cache:',
            cacheName,
            request.url
          );
          return tripCachedResponse;
        }
      }

      return fetch(request)
        .then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cache successful responses
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(async error => {
          // Network error - check trip offline caches one more time (in case we missed it)
          for (const cacheName of tripCaches) {
            const tripCache = await caches.open(cacheName);
            const tripCachedResponse = await tripCache.match(request);
            if (tripCachedResponse) {
              console.log(
                '[ServiceWorker] Found static resource in trip offline cache (fallback):',
                cacheName,
                request.url
              );
              return tripCachedResponse;
            }
          }

          console.error('[ServiceWorker] Fetch failed:', error);
          return new Response('Network error occurred', {
            status: 408,
            statusText: 'Request Timeout',
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        });
    })
  );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);

    // Cache successful GET requests
    if (request.method === 'GET' && response.status === 200) {
      const cache = await caches.open(API_CACHE_NAME);

      // Implement cache size limit
      const keys = await cache.keys();
      if (keys.length >= MAX_API_CACHE_ITEMS) {
        await cache.delete(keys[0]);
      }

      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try cache for GET requests
    if (request.method === 'GET') {
      const requestUrl = request.url;
      const url = new URL(requestUrl);
      const pathname = url.pathname;

      console.log('[ServiceWorker] Network failed, searching cache for:', requestUrl);

      // First try the general API cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('[ServiceWorker] Found in general API cache');
        return cachedResponse;
      }

      // Then check trip-specific offline caches
      // These are created by OfflineStorageContext when user enables offline mode
      const cacheNames = await caches.keys();
      const tripCaches = cacheNames.filter(
        name => name.startsWith('trip-') && name.endsWith('-offline')
      );

      console.log('[ServiceWorker] Checking trip caches:', tripCaches);

      for (const cacheName of tripCaches) {
        const tripCache = await caches.open(cacheName);

        // Try multiple matching strategies
        // 1. Match with full Request object
        let tripCachedResponse = await tripCache.match(request);
        if (tripCachedResponse) {
          console.log(
            '[ServiceWorker] Found in trip offline cache (request match):',
            cacheName,
            requestUrl
          );
          return tripCachedResponse;
        }

        // 2. Match with URL string
        tripCachedResponse = await tripCache.match(requestUrl);
        if (tripCachedResponse) {
          console.log(
            '[ServiceWorker] Found in trip offline cache (url match):',
            cacheName,
            requestUrl
          );
          return tripCachedResponse;
        }

        // 3. Match with pathname only (in case origin differs)
        tripCachedResponse = await tripCache.match(pathname);
        if (tripCachedResponse) {
          console.log(
            '[ServiceWorker] Found in trip offline cache (pathname match):',
            cacheName,
            pathname
          );
          return tripCachedResponse;
        }

        // 4. Try to find any matching key by iterating cache keys
        const keys = await tripCache.keys();
        for (const key of keys) {
          const keyUrl = new URL(key.url);
          if (keyUrl.pathname === pathname) {
            tripCachedResponse = await tripCache.match(key);
            if (tripCachedResponse) {
              console.log(
                '[ServiceWorker] Found in trip offline cache (key iteration):',
                cacheName,
                key.url
              );
              return tripCachedResponse;
            }
          }
        }
      }

      console.log('[ServiceWorker] API request not found in any cache:', requestUrl);
    }

    // Return offline response for failed requests
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'Please check your internet connection',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle queued actions when back online
  try {
    const offlineActions = await getOfflineActions();

    for (const action of offlineActions) {
      try {
        await replayAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.log('Failed to replay action:', error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/admin';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Utility functions for offline storage
async function getOfflineActions() {
  // Implement offline action queue storage
  // This would typically use IndexedDB
  return [];
}

async function removeOfflineAction(id) {
  // Remove action from offline queue
}

async function replayAction(action) {
  // Replay the stored action
  return fetch(action.url, {
    method: action.method,
    headers: action.headers,
    body: action.body,
  });
}

// Update notification
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker loaded successfully');
