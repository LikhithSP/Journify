const CACHE_NAME = 'journify-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/journal.svg',
];

// Install: Cache core application shell
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Service worker cache addAll warning:', err);
      });
    })
  );
  (self as any).skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  (self as any).clients.claim();
});

// Fetch: Stale-While-Revalidate strategy for static resources
self.addEventListener('fetch', (event: any) => {
  const request = event.request;
  const url = new URL(request.url);

  // Don't cache Supabase API calls with ServiceWorker cache (handled by IndexedDB)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Only cache GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is navigation, return cached index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html') as Promise<Response>;
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync trigger
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-entries') {
    event.waitUntil(
      (self as any).clients.matchAll().then((clients: any[]) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_SYNC' });
        });
      })
    );
  }
});
