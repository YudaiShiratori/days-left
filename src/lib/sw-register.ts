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

export const registerServiceWorker = async (): Promise<void> => {
  // 開発環境またはサーバーサイドでは何もしない
  if (!(isProduction && isClient && 'serviceWorker' in navigator)) {
    return;
  }

  const wb = new Workbox('/sw.js');

  // Service Worker更新検知時の自動リロード
  wb.addEventListener('controlling', () => {
    window.location.reload();
  });

  // 新しいService Workerがインストールされた時
  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      // 即座に新しいService Workerをアクティブ化
      wb.messageSkipWaiting();
    }
  });

  // Service Worker待機中（新バージョン利用可能）
  wb.addEventListener('waiting', (_event) => {
    // skipWaitingメッセージを送信して即座に更新
    wb.messageSkipWaiting();
  });

  // Service Worker登録
  try {
    const registration = await wb.register();

    // 定期的な更新チェック（1分間隔）
    setInterval(() => {
      registration?.update();
    }, 60_000);
  } catch (_error) {
    // Service Worker登録失敗は無視（非対応ブラウザ等）
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

// キャッシュ手動クリア（デバッグ用）
export const clearServiceWorkerCache = async (): Promise<void> => {
  if (!(isClient && 'caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  } catch (_error) {
    // キャッシュクリア失敗は無視
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
