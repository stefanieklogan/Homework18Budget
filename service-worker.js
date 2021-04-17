// install event handler
self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('static').then( cache => {
        return cache.addAll([
          './',
          './index.html',
          './db.js',
          './public/style.css',
          './public/icons/icon-192x192.png',
          './public/icons/icon-512x512.png',
          './public/manifest.webmanifest',
        ]);
      })
    );
    console.log('Install');
    self.skipWaiting();
  });

  // retrieve assets from cache
self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request).then( response => {
        return response || fetch(event.request);
      })
    );
  });
