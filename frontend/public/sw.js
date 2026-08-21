// Service Worker for ChemSafe
// Provides offline support and caching for better performance

const CACHE_NAME = 'chemsafe-v1';
const RUNTIME_CACHE = 'chemsafe-runtime-v1';

// Resources to cache on install
const PRECACHE_URLS = [
  '/',
  '/scan',
  '/login',
];

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Precaching critical resources');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('🗑️ Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests (we want fresh data)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    return;
  }

  // Skip camera streams (always need fresh data)
  if (url.pathname.includes('/camera/') || url.pathname.includes('/mjpeg')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update in background
        event.waitUntil(
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, response.clone());
              });
            }
          }).catch(() => {
            // Network failed, cached version is being used
          })
        );
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Network failed and not in cache
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        throw new Error('Network request failed and no cache available');
      });
    })
  );
});

// Background sync for failed requests (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered');
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement background sync logic here
  console.log('📡 Syncing data...');
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New notification from ChemSafe',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ChemSafe', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
