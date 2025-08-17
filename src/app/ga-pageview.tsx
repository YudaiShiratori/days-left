'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { analytics } from '~/lib/analytics';

/**
 * Next.js App Router用のページビュー追跡コンポーネント（内部実装）
 */
function GaPageViewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window === 'undefined') {
      return;
    }

    // ページパスを構築 (pathname + search + hash)
    const search = searchParams?.toString();
    const pagePath =
      pathname + (search ? `?${search}` : '') + (window.location.hash || '');

    // ページビューを送信
    analytics.pageView(pagePath);
  }, [pathname, searchParams]);

  useEffect(() => {
    // PWAインストール検知を初回のみ有効化
    analytics.bindPwaInstallEvent();
  }, []);

  return null;
}

/**
 * Next.js App Router用のページビュー追跡コンポーネント
 * ルート変更時に手動でpage_viewイベントを送信（SPAの重複カウント回避）
 */
export default function GaPageView() {
  return (
    <Suspense fallback={null}>
      <GaPageViewInner />
    </Suspense>
  );
}
