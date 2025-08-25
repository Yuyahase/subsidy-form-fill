# 東京都働きやすい職場環境づくり推進奨励金 - 事前エントリーシステム

## 概要
東京都の働きやすい職場環境づくり推進奨励金の事前エントリーフォームシステムです。

## プロジェクト構造

```
subsidy-form-react/
├── src/
│   ├── components/        # Reactコンポーネント
│   │   ├── ui/           # shadcn/uiベースのUIコンポーネント
│   │   └── ShadcnSubsidyForm.tsx  # メインフォームコンポーネント
│   ├── lib/              # ライブラリ関連
│   │   ├── formValidation.ts  # Zodバリデーション
│   │   └── utils.ts
│   ├── services/         # サービス層
│   │   ├── googleForms.service.ts
│   │   └── postalCode.service.ts
│   ├── types/            # TypeScript型定義
│   ├── utils/            # ユーティリティ関数
│   │   ├── fillForm.ts  # フォーム自動入力
│   │   ├── fillFormFromJson.ts
│   │   └── formFiller.ts
│   └── scripts/          # Google Apps Script
│       └── google-apps-script.js
├── public/
└── README.md
```

## 機能

### フォーム機能
- 企業情報入力
- 代表者情報入力
- 会社所在地入力（郵便番号自動補完機能付き）
- 担当者情報入力
- バリデーション機能（Zod使用）
- 確認画面
- Google Sheetsへのデータ送信

### 技術スタック
- **フロントエンド**: React + TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **フォーム管理**: React Hook Form
- **バリデーション**: Zod
- **データ送信**: Google Apps Script (Google Sheets API)

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env`ファイルを作成し、以下の変数を設定：
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_APPS_SCRIPT_URL=your_apps_script_url
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

## Google Apps Scriptの設定

1. Google Sheetsで新しいスプレッドシートを作成
2. `src/scripts/google-apps-script.js`の内容をGoogle Apps Scriptエディタにコピー
3. スクリプトをウェブアプリとしてデプロイ
4. デプロイURLを環境変数に設定

## フォーム自動入力機能

`src/utils/`内のスクリプトを使用して、Google Sheetsに保存されたデータから自動的にフォームを入力できます：

- `fillForm.ts`: フォームへの自動入力メイン関数
- `fillFormFromJson.ts`: JSONデータからのフォーム入力
- `formFiller.ts`: フォーム入力ヘルパー関数

## ビルド

```bash
npm run build
```

ビルド成果物は`dist/`ディレクトリに生成されます。

## ライセンス

Copyright © 2015-2025 スポット社労士くん社会保険労務士法人