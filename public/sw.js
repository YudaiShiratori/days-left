/// <reference lib="webworker" />
// @ts-check

const CACHE_NAME = 'days-left-v1';
const urlsToCache = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// @ts-expect-error
self.addEventListener('install', (event) => {
  // @ts-expect-error
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// @ts-expect-error
self.addEventListener('fetch', (event) => {
  // @ts-expect-error
  event.respondWith(
    // @ts-expect-error
    caches
      .match(event.request)
      .then((response) => {
        // キャッシュにある場合はそれを返す
        if (response) {
          return response;
        }

        // ネットワークから取得を試みる
        // @ts-expect-error
        return fetch(event.request).catch(() => {
          // オフラインの場合、基本的なHTMLを返す
          // @ts-expect-error
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// @ts-expect-error
self.addEventListener('activate', (event) => {
  // @ts-expect-error
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
});
