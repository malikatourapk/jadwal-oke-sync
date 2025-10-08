// Service Worker untuk PWA - Optimized for Performance
const CACHE_NAME = 'kasir-toko-anjar-v2';
const STATIC_CACHE = 'static-v2';
const API_CACHE = 'api-v2';

const staticAssets = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Files to cache on first visit
const dynamicAssets = [
  '/assets/',
  '/src/'
];

// Install Service Worker - Optimized
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(staticAssets)),
      caches.open(API_CACHE)
    ]).then(() => {
      self.skipWaiting();
    })
  );
});

// Fetch event - Optimized caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets
  if (request.destination === 'image' || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) return response;
          
          return fetch(request).then(fetchResponse => {
            const responseClone = fetchResponse.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
            return fetchResponse;
          });
        })
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match('/') || caches.match(request);
        })
    );
    return;
  }

  // Default handling
  event.respondWith(
    caches.match(request)
      .then(response => response || fetch(request))
  );
});

// Activate - clean up old caches and take control
self.addEventListener('activate', (event) => {
  const expectedCaches = [STATIC_CACHE, API_CACHE];
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!expectedCaches.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Message handling for refresh functionality
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});