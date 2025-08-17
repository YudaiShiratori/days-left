import { Workbox } from 'workbox-window';

// PWA インストールプロンプトの型定義
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// 開発環境ではService Workerを登録しない
const isProduction = process.env.NODE_ENV === 'production';
const isClient = typeof window !== 'undefined';

// Service Workerのバージョンチェック
const checkServiceWorkerVersion = async (
  controller: ServiceWorker,
  expectedVersion: string
): Promise<boolean> => {
  try {
    const messageChannel = new MessageChannel();
    const versionPromise = new Promise<string | null>((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version);
      };
      setTimeout(() => resolve(null), 1000);
    });

    controller.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
    const currentVersion = await versionPromise;

    return currentVersion === expectedVersion;
  } catch {
    return false;
  }
};

// Service Workerクリーンアップ
const _cleanupServiceWorkers = async (): Promise<void> => {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(async (swRegistration) => {
        try {
          await swRegistration.unregister();
        } catch {
          // 個別の登録解除エラーは無視
        }
      })
    );

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          try {
            await caches.delete(cacheName);
          } catch {
            // 個別のキャッシュ削除エラーは無視
          }
        })
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    window.location.reload();
  } catch {
    // クリーンアップ失敗時も続行
  }
};

// Service Worker登録とイベントハンドラー設定
const setupServiceWorker = async (wb: Workbox): Promise<void> => {
  wb.addEventListener('controlling', () => {
    try {
      window.location.reload();
    } catch {
      // リロード失敗は無視
    }
  });

  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      try {
        wb.messageSkipWaiting();
      } catch {
        // skipWaiting失敗は無視
      }
    }
  });

  wb.addEventListener('waiting', () => {
    try {
      wb.messageSkipWaiting();
    } catch {
      // skipWaiting失敗は無視
    }
  });

  const registration = await wb.register();

  if (registration) {
    try {
      await registration.update();
    } catch {
      // 初期更新チェック失敗は無視
    }

    const updateInterval = setInterval(async () => {
      try {
        if (registration.active) {
          await registration.update();
        } else {
          clearInterval(updateInterval);
        }
      } catch {
        // 定期更新チェック失敗は無視
      }
    }, 30_000);

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          if (registration.active) {
            await registration.update();
          }
        } catch {
          // 可視性更新チェック失敗は無視
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    window.addEventListener('beforeunload', () => {
      clearInterval(updateInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }
};

// 強制更新関数
const forceServiceWorkerUpdate = async (): Promise<void> => {
  try {
    // 既存のService Workerに強制更新を指示
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'FORCE_UPDATE' });

      // 更新完了を待つ
      await new Promise<void>((resolve) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data && event.data.type === 'CACHE_CLEARED') {
            navigator.serviceWorker.removeEventListener(
              'message',
              messageHandler
            );
            resolve();
          }
        };
        navigator.serviceWorker.addEventListener('message', messageHandler);

        // 3秒でタイムアウト
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener(
            'message',
            messageHandler
          );
          resolve();
        }, 3000);
      });
    }

    // 全キャッシュを手動でクリア
    await clearServiceWorkerCache();

    // ページリロード
    window.location.reload();
  } catch (_error) {
    // エラーが発生してもリロードで続行
    window.location.reload();
  }
};

export const registerServiceWorker = async (): Promise<void> => {
  if (!(isProduction && isClient && 'serviceWorker' in navigator)) {
    return;
  }

  try {
    const EXPECTED_SW_VERSION = '2025-08-17-v4-FIREFOX-FIX';
    const controller = navigator.serviceWorker.controller;
    let needsCleanup = false;

    if (controller) {
      const isVersionMatch = await checkServiceWorkerVersion(
        controller,
        EXPECTED_SW_VERSION
      );
      needsCleanup = !isVersionMatch;
    } else {
      needsCleanup = true;
    }

    if (needsCleanup) {
      // スマホでの問題を解決するために強制更新を使用
      await forceServiceWorkerUpdate();
      return;
    }

    const wb = new Workbox('/sw-v2.js');
    await setupServiceWorker(wb);
  } catch {
    // 最後の手段として強制更新
    await forceServiceWorkerUpdate();
  }
};

// PWAインストールプロンプト管理
export class PWAInstaller {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstallable = false;

  constructor() {
    if (!isClient) {
      return;
    }

    // インストールプロンプトイベントをキャッチ
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.isInstallable = true;
      this.notifyInstallable();
    });

    // インストール完了時
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstallable = false;
    });
  }

  get canInstall(): boolean {
    return this.isInstallable;
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        return true;
      }
      return false;
    } catch (_error) {
      return false;
    } finally {
      this.deferredPrompt = null;
      this.isInstallable = false;
    }
  }

  private notifyInstallable(): void {
    // カスタムイベントを発火してアプリにインストール可能状態を通知
    const event = new CustomEvent('pwa-installable', {
      detail: { canInstall: this.isInstallable },
    });
    window.dispatchEvent(event);
  }
}

// Service Worker制御状態の確認
export const isServiceWorkerControlled = (): boolean => {
  return isClient && navigator.serviceWorker?.controller !== null;
};

// Service Worker登録解除
const unregisterAllServiceWorkers = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(async (registration) => {
        try {
          await registration.unregister();
        } catch (_error) {
          // 個別の登録解除エラーは無視して続行
        }
      })
    );
  }
};

// 全キャッシュ削除
const deleteAllCaches = async (): Promise<void> => {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(async (cacheName) => {
      try {
        await caches.delete(cacheName);
      } catch (_error) {
        // 個別のキャッシュ削除エラーは無視して続行
      }
    })
  );
};

// PWA関連のlocalStorage項目クリア
const clearLocalStorageItems = (): void => {
  try {
    if ('localStorage' in window) {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('workbox-') || key.startsWith('pwa-')) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (_error) {
    // localStorage操作エラーは無視して続行
  }
};

// PWA関連のsessionStorage項目クリア
const clearSessionStorageItems = (): void => {
  try {
    if ('sessionStorage' in window) {
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('workbox-') || key.startsWith('pwa-')) {
          sessionStorage.removeItem(key);
        }
      }
    }
  } catch (_error) {
    // sessionStorage操作エラーは無視して続行
  }
};

// IndexedDB クリア
const clearIndexedDBData = async (): Promise<void> => {
  try {
    if ('indexedDB' in window) {
      const dbDeletePromise = new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('workbox-expiration');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve();
        deleteReq.onblocked = () => resolve();
        setTimeout(() => resolve(), 1000);
      });
      await dbDeletePromise;
    }
  } catch (_error) {
    // IndexedDB操作エラーは無視して続行
  }
};

// キャッシュ手動クリア（デバッグ用）
export const clearServiceWorkerCache = async (): Promise<void> => {
  if (!(isClient && 'caches' in window)) {
    return;
  }

  try {
    await unregisterAllServiceWorkers();
    await deleteAllCaches();
    clearLocalStorageItems();
    clearSessionStorageItems();
    await clearIndexedDBData();
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (_error) {
    // 全体的なエラーは無視してアプリケーションを停止させない
  }
};

// Service Worker登録解除（デバッグ用）
export const unregisterServiceWorker = async (): Promise<void> => {
  if (!(isClient && 'serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  } catch (_error) {
    // Service Worker登録解除失敗は無視
  }
};
