'use client';

import { useEffect } from 'react';
import { PWAInstaller, registerServiceWorker } from '~/lib/sw-register';

export function ServiceWorkerProvider() {
  useEffect(() => {
    // Service Worker登録
    registerServiceWorker().catch((_error) => {
      // Service Worker登録エラーは無視（開発環境では正常）
    });

    // PWAインストーラー初期化
    new PWAInstaller();
  }, []);

  // このコンポーネントは何もレンダリングしない
  return null;
}
