/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.js';
import { InjectManifest } from 'workbox-webpack-plugin';

// Workbox exclude patterns
const WORKBOX_EXCLUDE_PATTERNS = [/\.map$/, /manifest$/, /\.DS_Store$/];

/** @type {import("next").NextConfig} */
const config = {
  webpack: (webpackConfig, { isServer }) => {
    // Service Worker は本番環境のクライアントサイドでのみ生成
    if (!isServer && process.env.NODE_ENV === 'production') {
      webpackConfig.plugins.push(
        new InjectManifest({
          swSrc: 'src/sw/sw.ts',
          swDest: '../public/sw-v2.js',
          exclude: WORKBOX_EXCLUDE_PATTERNS,
          // Next.js の静的アセットを自動認識
          manifestTransforms: [
            (manifestEntries) => {
              const manifest = manifestEntries.map((entry) => {
                // Next.js アセットのパスを正規化
                if (entry.url.startsWith('_next/')) {
                  entry.url = `/${entry.url}`;
                }
                return entry;
              });
              return { manifest };
            },
          ],
        })
      );
    }
    return webpackConfig;
  },
};

export default config;
