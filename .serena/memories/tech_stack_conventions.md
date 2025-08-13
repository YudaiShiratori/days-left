# 技術スタック & コーディング規約

## 技術スタック詳細

### フロントエンド
- **Next.js 15.4.4**: App Router使用
- **React 19.1.0**: Hooks中心の実装
- **TypeScript**: 厳格な型チェック
- **Tailwind CSS v4.1.11**: ユーティリティファースト

### 開発ツール
- **Bun**: パッケージマネージャー・ランタイム
- **Biome**: リンター・フォーマッター
- **Vitest**: ユニットテスト
- **Playwright**: E2Eテスト
- **Lefthook**: Git hooks管理

## コーディング規約

### ファイル構成
```
src/
├── app/              # Next.js App Router
│   ├── layout.tsx    # レイアウトコンポーネント
│   ├── page.tsx      # メインページ
│   └── _components/  # アプリ固有のコンポーネント
├── components/       # 再利用可能コンポーネント
│   └── ui/          # Shadcn/UI コンポーネント
├── lib/             # ユーティリティ関数
├── styles/          # グローバルスタイル
└── server/          # サーバーサイドロジック（tRPC）
```

### TypeScript規約
- 厳格な型定義を使用
- interfaceで型を定義
- 必要に応じてZodでランタイムバリデーション
- export/import文でモジュール管理

### コンポーネント設計
- 関数コンポーネント使用
- カスタムフックでロジック分離
- propsは明確な型定義
- アクセシビリティ配慮（ARIA属性）

### スタイリング
- Tailwind CSSクラス使用
- CSS変数でテーマ管理
- レスポンシブデザイン対応
- アクセシビリティ配慮（prefers-reduced-motion等）