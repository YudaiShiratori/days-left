/// <reference lib="webworker" />

// Service Worker Version - Update this to force cache invalidation
const SW_VERSION = '2025-08-17-v4-FIREFOX-FIX';

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

// Service Worker のグローバルエラーハンドリング
self.addEventListener('error', (event) => {
  // エラーが発生してもService Workerを停止させない
  event.preventDefault();
});

// 未処理のPromise rejection をキャッチ
self.addEventListener('unhandledrejection', (event) => {
  // エラーが発生してもService Workerを停止させない
  event.preventDefault();
});

// PWA インストールプロンプト関連

// 強制的に古いキャッシュを全削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // すべてのキャッシュを強制削除
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((cacheName) => !cacheName.includes(SW_VERSION))
            .map(async (cacheName) => {
              try {
                await caches.delete(cacheName);
              } catch (_error) {
                // 個別のキャッシュ削除エラーは無視して続行
              }
            })
        );
      } catch (_error) {
        // キャッシュクリーンアップエラーは無視して続行
      }
    })()
  );
});

// 古いキャッシュを自動削除
cleanupOutdatedCaches();

// Workboxが生成するマニフェストをプリキャッシュ
precacheAndRoute(self.__WB_MANIFEST);

// 即座に新しいService Workerをアクティブ化
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // 強制更新リクエスト処理
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    // 全キャッシュを削除して即座更新
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        self.skipWaiting();
        // クライアントに更新完了を通知
        self.clients.matchAll().then((clients) => {
          for (const client of clients) {
            client.postMessage({ type: 'CACHE_CLEARED' });
          }
        });
      });
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
      try {
        // 古いキャッシュを削除
        await cleanupOutdatedCaches();
        // 即座にクライアントを制御
        await self.clients.claim();
      } catch (_error) {
        // エラーが発生してもクライアント制御を試行
        try {
          await self.clients.claim();
        } catch (_claimError) {
          // クライアント制御失敗は無視して続行
        }
      }
    })()
  );
});

// HTMLページは常にネットワークから取得（キャッシュバイパス）
registerRoute(
  ({ request }) => {
    // クエリパラメータ付きリクエストは除外してループを防ぐ
    const url = new URL(request.url);
    if (
      url.searchParams.has('_cache_bust') ||
      url.searchParams.has('_sw_version')
    ) {
      return false;
    }
    return request.mode === 'navigate';
  },
  async ({ request }) => {
    try {
      // ヘッダーでキャッシュ制御（URLは変更しない）
      const networkRequest = new Request(request.url, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          // Service Workerバージョンをヘッダーで送信
          'X-SW-Version': SW_VERSION,
        },
        body: request.body,
        mode: request.mode,
        credentials: request.credentials,
        cache: 'no-store',
        redirect: request.redirect,
      });

      return await fetch(networkRequest);
    } catch (error) {
      // フォールバック処理（元のリクエストでキャッシュをチェック）
      try {
        const cache = await caches.open('pages-fallback');
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
      } catch (_cacheError) {
        // キャッシュアクセスエラーは無視して続行
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

  // バージョン確認リクエスト
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: SW_VERSION });
  }
});
