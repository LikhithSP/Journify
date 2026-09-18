const CACHE_NAME = 'journify-pwa-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/journal.svg',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg',
];

// Install: Cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Service worker cache addAll warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
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
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate strategy for static resources
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests entirely
  if (request.method !== 'GET') return;

  // Skip Supabase API calls (handled by IndexedDB offline layer)
  if (url.hostname.includes('supabase.co')) return;

  // Skip all cross-origin requests (Google Fonts, CDNs, external APIs)
  // These use opaque responses which can't be cached safely and cause
  // "Failed to convert value to 'Response'" errors when undefined is returned.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached version immediately while revalidating in background
      if (cachedResponse) {
        // Background revalidate
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {/* offline, cached copy is already being served */});
        return cachedResponse;
      }

      // Not in cache — fetch from network
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline and no cache — for navigation requests return cached shell
          if (request.mode === 'navigate') {
            return caches.match('/index.html').then((r) => r || new Response('Offline', { status: 503 }));
          }
          // For other requests return a generic offline response
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});


// Background Sync trigger
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-entries') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_SYNC' });
        });
      })
    );
  }
});

// Push Notifications Event Handling
self.addEventListener('push', (event) => {
  let data = { title: 'Journify Reminder', body: "Time for today's reflection ✨", icon: '/pwa-192x192.svg' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.svg',
    badge: '/journal.svg',
    vibrate: [100, 50, 100],
    data: {
      url: '/',
    },
    actions: [
      { action: 'open', title: 'Open Journify' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window or open new
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
