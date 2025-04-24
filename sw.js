// Service Worker (sw.js)

const CACHE_NAME = 'simple-pwa-cache-v1';
const urlsToCache = [
  '/', // Cache the root/index page
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192x192.png' // Cache one of the icons too (optional)
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Immediately activate the new service worker
        return self.skipWaiting();
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all open clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event: Serve cached content or fetch from network
// THIS IS CRUCIAL FOR WEBAPK INSTALLABILITY
self.addEventListener('fetch', event => {
  console.log(`SW: Fetching ${event.request.url}`);

  // Basic Cache-First Strategy (you could use others like NetworkFirst, StaleWhileRevalidate)
  event.respondWith(
    caches.match(event.request) // Check if the request is in the cache
      .then(response => {
        // Cache hit - return response from cache
        if (response) {
          console.log(`SW: Serving from cache: ${event.request.url}`);
          return response;
        }

        // Not in cache - fetch from network
        console.log(`SW: Fetching from network: ${event.request.url}`);
        return fetch(event.request).then(
          networkResponse => {
            // OPTIONAL: Cache the new response if needed (be careful what you cache!)
            // Example: Cache only successful GET requests
            // if(networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            //   const responseToCache = networkResponse.clone();
            //   caches.open(CACHE_NAME).then(cache => {
            //       cache.put(event.request, responseToCache);
            //   });
            // }
            return networkResponse;
          }
        );
      })
      .catch(error => {
        // Handle fetch errors (e.g., network offline and not in cache)
        console.error('SW: Fetch error:', error);
        // You could return an offline fallback page here if you have one cached
        // return caches.match('/offline.html');
      })
  );
});