# 開発で使用するコマンド一覧

## パッケージ管理
- `bun install` - 依存関係のインストール
- `bun add {packages}` - パッケージの追加
- `bunx --bun shadcn@latest add {components}` - Shadcn/UIコンポーネント追加

## 開発・ビルド
- `bun run dev` - 開発サーバー起動
- `bun run build` - 本番ビルド
- `bun run start` - 本番サーバー起動
- `bun run preview` - ビルド後のプレビュー

## コード品質
- `bun run check` - Biomeによるコードチェック
- `bun run check:write` - Biomeによる自動修正
- `bun run check:unsafe` - Biomeによる安全でない修正も適用
- `bun run typecheck` - TypeScript型チェック

## テスト
- `bun run test` - Vitestによるユニットテスト実行
- `bun run test:watch` - テストのウォッチモード
- `bun run test:e2e` - PlaywrightによるE2Eテスト
- `bun run test:e2e:ui` - PlaywrightのUIモード
- `bunx playwright install` - Playwrightブラウザのインストール

## Git関連
- `bunx lefthook install` - Git hooks設定
- `gh issue list` - GitHub Issues一覧
- `gh pr list` - GitHub PR一覧
- `gh pr create` - PR作成

## システムコマンド（Darwin）
基本的なUnixコマンドが使用可能:
- `ls`, `cd`, `grep`, `find`
- `git` - バージョン管理
- `curl` - HTTP リクエスト