const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache-v1";
const FILES_TO_CACHE = [
  './',
  './index.html',
  './index.js',
  './style.css',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './manifest.webmanifest',
];

// install
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(FILES_TO_CACHE)).then(() => self.skipWaiting())
  );

});

// remove old cache data & activate
self.addEventListener("activate", event => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
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
  if (e.request.url.includes("/api/transaction")) {
    e.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(e.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(e.request, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(e.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(e.request).then(response => {
        return response || fetch(e.request);
      });
    })
  );
});