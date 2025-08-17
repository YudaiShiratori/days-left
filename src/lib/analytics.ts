declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

/**
 * Google Analytics 4の型安全なラッパー関数
 */
export const analytics = {
  /**
   * ページビューを手動で送信
   * @param path - ページパス (pathname + search + hash)
   * @param title - ページタイトル
   */
  pageView: (path: string, title?: string) => {
    if (typeof window === 'undefined' || !window.gtag) {
      return;
    }

    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: title || document.title,
    });
  },

  /**
   * PWAインストールイベントを送信（デフォルト無効）
   * 使用する場合は analytics.bindPwaInstallEvent() を呼び出してください
   */
  pwaInstall: () => {
    if (typeof window === 'undefined' || !window.gtag) {
      return;
    }

    window.gtag('event', 'pwa_install');
  },

  /**
   * PWAインストール検知を有効化
   * appinstalledイベントをリッスンしてGA4にイベントを送信
   */
  bindPwaInstallEvent: () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('appinstalled', () => {
      analytics.pwaInstall();
    });
  },
};
