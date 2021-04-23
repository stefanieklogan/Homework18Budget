const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache-v1";
const FILES_TO_CACHE = [
  './',
  './index.html',
  './db.js',
  './index.js',
  './styles.css',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './manifest.webmanifest',
  './images/davidRose.png'
];

// install
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(FILES_TO_CACHE)).then(() => self.skipWaiting())
  );

});

// activate
self.addEventListener("activate", e => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  e.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        // return array of cache names that are old to delete
        return cacheNames.filter(
          cacheName => !currentCaches.includes(cacheName)
        );
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// fetch
self.addEventListener("fetch", e => {
  if (
    e.request.method !== "GET" ||
    !e.request.url.startsWith(self.location.origin)
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // handle runtime GET requests for data from /api routes
  if (e.request.url.includes("/api")) {
    // make network request and fallback to cache if network request fails (offline)
    e.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(e.request)
          .then(response => {
            cache.put(e.request, response.clone());
            return response;
          })
          .catch(() => caches.match(e.request));
      })
    );
    return;
  }

  // use cache first for all other requests for performance
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // request is not in cache. make network request and cache the response
      return caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(e.request).then(response => {
          return cache.put(e.request, response.clone()).then(() => {
            return response;
          });
        });
      });
    })
  );
});