'use client';

import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (_error) {
        // エラー時は何もしない
      }

      setDeferredPrompt(null);
    } else {
      alert('ブラウザのメニューから「ホーム画面に追加」を選択してください');
    }
  }, [deferredPrompt]);

  useEffect(() => {
    // PWAがすでにインストールされているかチェック
    const checkIfInstalled = () => {
      // テスト環境でのfallback
      if (typeof window === 'undefined' || !window.matchMedia) {
        setIsInstalled(false);
        return;
      }

      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;
      const isInWebAppiOS =
        (window.navigator as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled) {
    return (
      <button
        className="cursor-not-allowed rounded-lg border-2 border-slate-300 bg-white px-6 py-4 font-medium text-base text-slate-500 md:py-2"
        disabled
        type="button"
      >
        ✓ インストール済み
      </button>
    );
  }

  return (
    <button
      className="rounded-lg border-2 border-slate-300 bg-white px-6 py-4 font-medium text-base text-slate-700 transition-colors hover:bg-slate-50 md:py-2 md:text-base"
      onClick={handleInstallClick}
      type="button"
    >
      スマホのホーム画面に追加
    </button>
  );
}
