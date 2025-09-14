
// A basic service worker that enables offline access and caching.

const CACHE_NAME = 'van-schalkwyk-trust-mobile-v1';

// List of files to cache.
const urlsToCache = [
  '/',
  '/manifest.json',
  // Add other static assets here, e.g., icons, critical CSS/JS
];

self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  // Remove old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Tell the active service worker to take control of the page immediately.
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    // Try the network first.
    fetch(event.request)
      .then(res => {
        // Clone the response. A response is a stream and
        // can only be consumed once. We need one for the browser
        // and one for the cache.
        const resClone = res.clone();
        caches
          .open(CACHE_NAME)
          .then(cache => {
            // Add the response to the cache.
            cache.put(event.request, resClone);
          });
        return res;
      })
      .catch(err => {
        // If the network fails, try to get it from the cache.
        return caches.match(event.request).then(res => res);
      })
  );
});

// Listen for the message to skip waiting.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
