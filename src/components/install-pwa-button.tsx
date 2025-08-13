'use client';

import { Check, Download } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [_isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      try {
        // インストールプロンプトを表示
        await deferredPrompt.prompt();

        // ユーザーの選択を待つ
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          // インストール成功時の処理（必要に応じて追加）
        } else {
          // インストール拒否時の処理（必要に応じて追加）
        }
      } catch (_error) {
        // エラーハンドリング（必要に応じて追加）
      }

      // プロンプトは一度しか使えないのでリセット
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      // 自動プロンプトが使えない場合は手動インストール案内を表示
      alert(
        'ブラウザのメニューから「アプリのインストール」または「ホーム画面に追加」を選択してください'
      );
    }
  }, [deferredPrompt]);

  useEffect(() => {
    // PWAがすでにインストールされているかチェック
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;
      const isInWebAppiOS =
        (window.navigator as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    // beforeinstallpromptイベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Service Workerからのメッセージをリッスン
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SHOW_INSTALL_PROMPT' && deferredPrompt) {
        handleInstallClick();
      }
    };

    // appinstalledイベントをリッスン（インストール完了時）
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt, handleInstallClick]);

  // PWAがすでにインストール済みの場合
  if (isInstalled) {
    return (
      <Button className="gap-2" disabled variant="outline">
        <Check className="h-4 w-4" />
        インストール済み
      </Button>
    );
  }

  // 常にボタンを表示（自動プロンプトが使えない場合は手動インストール案内）

  return (
    <Button className="gap-2" onClick={handleInstallClick}>
      <Download className="h-4 w-4" />
      ホーム画面に追加
    </Button>
  );
}
