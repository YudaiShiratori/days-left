import '~/styles/globals.css';

import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import Image from 'next/image';
import { ServiceWorkerProvider } from '~/components/service-worker-provider';
import { TRPCReactProvider } from '~/trpc/react';

export const metadata: Metadata = {
  metadataBase: new URL('https://jinsei-nokori-jikan.vercel.app'),
  title: '人生の残り時間',
  description:
    'あなたの人生の残り日数を表示し、毎日を大切に過ごすためのモチベーションアプリ',
  icons: [
    { rel: 'icon', url: '/favicon.ico', sizes: '32x32' },
    { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/icon-192.png', sizes: '192x192' },
    { rel: 'apple-touch-icon', url: '/icon-512.png', sizes: '512x512' },
  ],
  openGraph: {
    title: '人生の残り時間',
    description:
      'あなたの人生の残り日数を表示し、毎日を大切に過ごすためのモチベーションアプリ',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Days Left アプリのアイコン',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '人生の残り時間',
    description:
      'あなたの人生の残り日数を表示し、毎日を大切に過ごすためのモチベーションアプリ',
    images: ['/icon-512.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '人生の残り時間',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2e026d',
};

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  weight: ['400', '500', '700'],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${notoSansJP.variable}`} lang="ja">
      <body>
        <TRPCReactProvider>
          <ServiceWorkerProvider />
          <div className="min-h-screen bg-slate-100">
            <header className="sticky top-0 z-10 bg-white shadow-sm">
              <div className="mx-auto max-w-4xl px-4">
                <div className="relative flex items-center justify-center py-4">
                  <Image
                    alt="人生の残り時間アプリのアイコン"
                    className="absolute left-0 h-12 w-12 rounded-xl shadow-sm md:h-14 md:w-14"
                    height={56}
                    src="/icon-192.png"
                    width={56}
                  />
                  <div className="text-center">
                    <h1 className="font-bold text-gray-900 text-xl md:text-2xl">
                      人生の残り時間
                    </h1>
                  </div>
                </div>
              </div>
            </header>
            {children}
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
