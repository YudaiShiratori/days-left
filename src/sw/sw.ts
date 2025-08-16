/// <reference lib="webworker" />

// Service Worker Version - Update this to force cache invalidation
const SW_VERSION = '2025-08-16-v2';

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// PWA インストールプロンプト関連

// 古いキャッシュを自動削除
cleanupOutdatedCaches();

// Workboxが生成するマニフェストをプリキャッシュ
precacheAndRoute(self.__WB_MANIFEST);

// 即座に新しいService Workerをアクティブ化
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// インストール時に即座にアクティブ化を試行
self.addEventListener('install', () => {
  self.skipWaiting();
});

// アクティベート時に即座にクライアントを制御
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 古いキャッシュを削除
      await cleanupOutdatedCaches();
      // 即座にクライアントを制御
      await self.clients.claim();
    })()
  );
});

// HTMLページは常にネットワークから取得（キャッシュバイパス）
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ request }) => {
    try {
      // 常にネットワークから最新版を取得
      const url = new URL(request.url);
      url.searchParams.set('_cache_bust', Date.now().toString());
      url.searchParams.set('_sw_version', SW_VERSION);

      const networkRequest = new Request(url.href, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        body: request.body,
        mode: request.mode,
        credentials: request.credentials,
        cache: 'no-store', // 完全にキャッシュを無効化
        redirect: request.redirect,
      });

      return await fetch(networkRequest);
    } catch (error) {
      const cache = await caches.open('pages-fallback');
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }
);

// 静的アセット（CSS, JS, フォント, 画像）: Stale While Revalidate
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
  })
);

// Next.js の _next/static アセット: Stale While Revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/_next/static/'),
  new StaleWhileRevalidate({
    cacheName: 'next-static',
  })
);

// API ルートは Network First（tRPCなど）
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 10,
  })
);

// SPA のナビゲーションフォールバック
const navigationHandler = createHandlerBoundToURL('/');
const navigationRoute = new NavigationRoute(navigationHandler, {
  denylist: [/^\/_/, /\/[^/?]+\.[^/]+$/], // Next.js の内部ルート、ファイル拡張子付きを除外
});
registerRoute(navigationRoute);

// PWA インストールプロンプト関連

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_INSTALL') {
    // メインスレッドにインストールプロンプトをトリガーするよう通知
    self.clients.matchAll().then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: 'SHOW_INSTALL_PROMPT' });
      }
    });
  }
});

// Service Worker更新時の通知
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLIENT_READY') {
    // クライアントが準備完了した時の処理
    event.ports[0]?.postMessage({ type: 'SW_READY' });
  }
});
