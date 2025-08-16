/// <reference lib="webworker" />

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

// HTMLページのキャッシュ戦略: Network First（常に最新版を優先）
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 3, // 3秒でタイムアウト
    plugins: [
      {
        cacheKeyWillBeUsed: ({ request }) => {
          // クエリパラメータを除去してキャッシュキーを正規化
          const url = new URL(request.url);
          url.search = '';
          return Promise.resolve(url.href);
        },
        requestWillFetch: ({ request }) => {
          // キャッシュバスティング用のタイムスタンプを追加
          const url = new URL(request.url);
          url.searchParams.set('_t', Date.now().toString());
          return Promise.resolve(
            new Request(url.href, {
              method: request.method,
              headers: request.headers,
              body: request.body,
              mode: request.mode,
              credentials: request.credentials,
              cache: 'no-cache', // キャッシュを使わずに最新を取得
              redirect: request.redirect,
            })
          );
        },
      },
    ],
  })
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
