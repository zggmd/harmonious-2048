const CACHE_NAME = '2048-aiguo-cache-v1';
const DYNAMIC_CACHE_NAME = '2048-aiguo-dynamic-cache-v1';

// IMPORTANT: If your HTML file is not index.html, change it here.
const urlsToCache = [
  './', // Alias for index.html if served from root
  './index.html', // Explicitly list your main HTML
  'https://cdn.tailwindcss.com' // Cache Tailwind CSS
  // Add other essential assets here if any (e.g., specific critical images not covered by CSS, custom fonts)
  // Since your game assets are largely inline or dynamically created,
  // caching index.html and tailwind is the primary goal for static assets.
];

// Install service worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force activation
      .catch(err => console.error('Service Worker: Cache addAll failed:', err))
  );
});

// Activate service worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of uncontrolled clients
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  // console.log('Service Worker: Fetching', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(cacheRes => {
        // Return from cache if found
        if (cacheRes) {
          // console.log('Service Worker: Serving from cache:', event.request.url);
          return cacheRes;
        }
        // Otherwise, fetch from network
        return fetch(event.request).then(fetchRes => {
          // console.log('Service Worker: Fetching from network:', event.request.url);
          // Check if we received a valid response
          if (!fetchRes || fetchRes.status !== 200 || fetchRes.type !== 'basic' && !event.request.url.startsWith('https://cdn.tailwindcss.com')) {
            return fetchRes;
          }
          // Cache the new resource for future use (dynamic caching)
          return caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => {
              // console.log('Service Worker: Caching new resource:', event.request.url);
              cache.put(event.request.url, fetchRes.clone());
              return fetchRes;
            });
        });
      }).catch(error => {
      console.error('Service Worker: Fetch failed; returning offline page if applicable.', error);
      // You can return a fallback offline page here if needed for specific routes
      // e.g., if (event.request.mode === 'navigate') return caches.match('./offline.html');
    })
  );
});