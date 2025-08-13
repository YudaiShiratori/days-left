const CACHE_NAME = 'days-left-v1';
const urlsToCache = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュにある場合はそれを返す
      if (response) {
        return response;
      }

      // ネットワークから取得を試みる
      return fetch(event.request).catch(() => {
        // オフラインの場合、基本的なHTMLを返す
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});

self.addEventListener('activate', (event) => {
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

// beforeinstallpromptイベントをキャッシュして手動でトリガーできるようにする
let _deferredPrompt;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_INSTALL') {
    // メインスレッドにinstallプロンプトをトリガーするよう通知
    self.clients.matchAll().then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: 'SHOW_INSTALL_PROMPT' });
      }
    });
  }
});
