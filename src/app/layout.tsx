import '~/styles/globals.css';

import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';

import { TRPCReactProvider } from '~/trpc/react';

export const metadata: Metadata = {
  metadataBase: new URL('https://days-left.example.com'), // 本番環境のURLに置き換えてください
  title: 'Days Left - 人生の残り日数',
  description:
    'あなたの人生の残り日数を表示し、毎日を大切に過ごすためのモチベーションアプリ',
  icons: [
    { rel: 'icon', url: '/favicon.ico', sizes: '32x32' },
    { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/icon-192.png', sizes: '192x192' },
    { rel: 'apple-touch-icon', url: '/icon-512.png', sizes: '512x512' },
  ],
  openGraph: {
    title: 'Days Left - 人生の残り日数',
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
    title: 'Days Left - 人生の残り日数',
    description:
      'あなたの人生の残り日数を表示し、毎日を大切に過ごすためのモチベーションアプリ',
    images: ['/icon-512.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Days Left',
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
      <head>
        <script src="/sw-register.js" />
      </head>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
