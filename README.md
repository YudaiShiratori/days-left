# Days Left - 人生の残り日数

## 概要

あなたの残り時間を見える化し、毎日を大切にする意識を育てるアプリです。
シンプルなインターフェースで年齢と予想寿命を設定するだけで、視覚的に残り時間を確認できます。

PWA対応により、スマートフォンのホーム画面に追加してアプリのように使用できます。

## 主な機能

- **残り日数計算**: 現在の年齢と予想寿命から残り日数を自動計算
- **直感的な設定**: 簡単な入力フォームで年齢と予想寿命を設定
- **PWA対応**: オフラインでも動作し、スマートフォンのホーム画面に追加可能
- **自動更新**: 新しいバージョンが利用可能になったときに自動的に更新
- **レスポンシブデザイン**: デスクトップ・タブレット・スマートフォンすべてに対応

## 技術スタック

- **[Next.js 15](https://nextjs.org)** - App Routerを使用したフルスタックReactフレームワーク
- **[TypeScript](https://www.typescriptlang.org)** - 型安全な開発環境
- **[Tailwind CSS](https://tailwindcss.com)** - ユーティリティファーストCSSフレームワーク
- **[tRPC](https://trpc.io)** - End-to-End型安全なAPI通信
- **[Workbox](https://developers.google.com/web/tools/workbox)** - PWA機能とキャッシュ戦略
- **[Biome](https://biomejs.dev/ja/)** - 高速Linter & Formatter
- **[Vitest](https://vitest.dev)** - 高速ユニットテストフレームワーク
- **[Playwright](https://playwright.dev)** - E2Eテストフレームワーク

### ディレクトリ構造

```
nextjs-dev-template/
├── __tests__/            # ユニットテストファイル
├── .github/              # GitHub関連設定
│   ├── workflows/        # GitHub Actions CI/CD設定
│   └── dependabot.yml    # Dependabot設定
├── .next/                # Next.jsビルドファイル（git管理対象外）
├── docs/                 # プロジェクト文書
├── e2e/                  # E2Eテストファイル
├── public/               # 静的ファイル
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── _components/  # アプリケーション固有のコンポーネント
│   │   ├── api/          # APIルート定義
│   │   └── ...           # 各ページのルート
│   ├── components/       # 再利用可能なUIコンポーネント
│   │   └── ui/           # Shadcn/UIコンポーネント
│   ├── lib/              # ユーティリティ関数
│   ├── server/           # サーバーサイドロジック
│   │   └── api/          # tRPC API定義
│   ├── styles/           # グローバルスタイル
│   └── trpc/             # tRPC設定
├── .env.example          # 環境変数の例
├── biome.jsonc           # Biome設定
├── lefthook.yml          # Git hooksの設定
├── next.config.js        # Next.js設定
├── package.json          # プロジェクト依存関係
├── playwright.config.ts  # Playwright設定
├── postcss.config.js     # PostCSS設定（Tailwind CSS用）
├── tsconfig.json         # TypeScript設定
└── vitest.config.ts      # Vitest設定
```

## 主要設定ファイルの詳細

### TypeScript設定 (tsconfig.json)

厳格な型チェックを有効にし、Next.jsとの連携を最適化する設定が含まれています。以下のような特徴があります：

- `strict: true` による厳格な型チェック
- パスエイリアスでの `~/*` を `./src/*` へのマッピング
- 最新のJavaScript機能の有効化

### Biome設定 (biome.jsonc)

Rust製の高速なLinter兼Formatterです。ESLintとPrettierの代替として機能し、以下の特徴があります：

- 一貫したコードスタイル強制
- パフォーマットとリンティングの統合
- Tailwind CSSのクラス名の自動ソート機能

コード品質をチェックするコマンド：
```bash
bun run check
```

コードを自動修正するコマンド：
```bash
bun run check:write
```

### tRPC設定 (src/trpc/*)

型安全なAPI通信を実現します。主な設定は以下の通りです：

- `src/server/api/routers/` - 各APIルートの定義場所
- `src/server/api/root.ts` - 全APIルートの集約
- `src/trpc/react.tsx` - クライアント側でのtRPC設定

新しいAPIエンドポイントを追加する場合は、`src/server/api/routers/`に新しいルーターファイルを作成し、`root.ts`に登録します。

### CI/CD設定 (.github/workflows/ci_cd.yml)

GitHub Actionsを使用したCI/CDパイプラインが設定されています：

- **リント**: Biomeによるコード品質チェック
- **ユニットテスト**: Vitestによるテスト実行
- **E2Eテスト**: Playwrightによるブラウザテスト
- **デプロイ**: コメントアウト解除でVercelへの自動デプロイが可能

### Lefthook設定 (lefthook.yml)

Git操作時に自動実行されるスクリプトを設定しています：

- コミット前にBiomeによる自動フォーマット

### Dependabot設定 (.github/dependabot.yml)

依存パッケージの自動更新を行います：

- npm/bunパッケージを毎週チェック
- GitHub Actionsの更新を毎週チェック
- 更新PRは同時に最大10件まで

## Usage

### bunをインストール

```bash
curl -fsSL https://bun.sh/install | bash
```

詳しくは[公式サイト](https://bun.sh/docs/installation)を参照してください。

### リポジトリのクローン

```bash
git clone {このリポジトリのURL}
```

### リモートリポジトリの設定

```bash
git remote set-url origin {利用するリモートリポジトリのURL}
```

### パッケージのインストール

```bash
bun install
```

### Playwrightのブラウザインストール

```bash
bunx playwright install
```

### lefthookの設定

```bash
bunx lefthook install
```

### 開発サーバーの起動

```bash
bun run dev
```

## 開発ガイド

### コンポーネント追加（Shadcn/UI）

UIコンポーネントを追加する場合は、shadcn/uiを使用します：

```bash
bunx --bun shadcn@latest add button
```

追加したコンポーネントは `src/components/ui/` に配置され、自由にカスタマイズできます。

### 新しいページの追加

Next.jsのApp Routerを使用しているため、`src/app/` ディレクトリに新しいディレクトリを作成し、`page.tsx` ファイルを追加することで新しいページを作成できます：

```
src/app/dashboard/page.tsx
```

これで `/dashboard` というURLでアクセス可能になります。

### トラブルシューティング

新しいバージョンが反映されない場合：

1. **ハードリロード**: `Ctrl+Shift+R` (Windows/Linux) / `Cmd+Shift+R` (Mac)
2. **キャッシュクリア**: 開発者ツール → Application → Clear storage
3. **Service Worker解除**: 開発者ツール → Service Workers → Unregister

### キャッシュ戦略

- **HTML**: Network First（常に最新版を優先）
- **静的アセット**: Stale-While-Revalidate（高速表示 + バックグラウンド更新）
- **API**: Network First（信頼性重視）
- **自動更新**: 新バージョン検出時に自動リロード


## テスト

### ユニットテスト（Vitest）

```bash
bun run test        # すべてのテストを実行
bun run test:watch  # ウォッチモードでテスト実行
```

### E2Eテスト（Playwright）

```bash
bun run test:e2e        # すべてのE2Eテストを実行
bun run test:e2e:ui     # UIモードでテスト実行
```

## コード品質管理

### Biome（Linter/Formatter）

```bash
bun run check       # コード品質チェック
bun run check:write # 問題を自動修正
```

### Git Hooks（Lefthook）

コミット前にBiomeによる自動フォーマットが実行されます。

## PWA機能

このアプリケーションはPWA対応しており、Workboxを使用した最適化されたキャッシュ戦略を実装しています。




