'use client';

import { useCallback, useEffect, useState } from 'react';
import { PWAInstaller } from '~/lib/sw-register';

export function InstallPwaButton() {
  const [_canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installer, setInstaller] = useState<PWAInstaller | null>(null);

  const handleInstallClick = useCallback(async () => {
    if (installer?.canInstall) {
      const success = await installer.showInstallPrompt();
      if (success) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    } else {
      alert('ブラウザのメニューから「ホーム画面に追加」を選択してください');
    }
  }, [installer]);

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

    // PWAInstallerインスタンスを作成
    const pwaInstaller = new PWAInstaller();
    setInstaller(pwaInstaller);

    // PWAインストール可能状態の監視
    const handlePWAInstallable = (event: Event) => {
      const customEvent = event as CustomEvent;
      setCanInstall(customEvent.detail.canInstall);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('pwa-installable', handlePWAInstallable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handlePWAInstallable);
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
