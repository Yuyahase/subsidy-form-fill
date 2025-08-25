# 東京都働きやすい職場環境づくり推進奨励金 事前エントリーフォーム

このプロジェクトは、東京都の補助金申請フォームをGoogle Formsの代わりにWebフォームとして実装し、Google Sheetsにデータを保存するシステムです。

## セットアップ手順

### 1. Google Sheetsの準備

1. Google Driveにアクセス
2. 新規 > Google スプレッドシートを作成
3. スプレッドシートに「補助金申請データ」などの名前を付ける
4. URLから`SPREADSHEET_ID`をコピー
   - URL例: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### 2. Google Apps Scriptの設定

1. 作成したスプレッドシートで「拡張機能」→「Apps Script」を開く
2. `google-apps-script.js`の内容をコピーして貼り付け
3. `SPREADSHEET_ID`を実際のIDに置き換える
4. ファイルを保存（Ctrl+S または Cmd+S）
5. 「デプロイ」→「新しいデプロイ」をクリック
6. 以下の設定でデプロイ：
   - 種類の選択: ウェブアプリ
   - 説明: Tokyo Subsidy Form Handler
   - 実行ユーザー: 自分
   - アクセスできるユーザー: 全員
7. 「デプロイ」ボタンをクリック
8. 生成された「ウェブアプリ」のURLをコピー

### 3. フォームの設定

1. `script.js`を開く
2. 2行目の`GOOGLE_SCRIPT_URL`を、コピーしたウェブアプリのURLに置き換える：
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```

### 4. フォームの起動

1. `index.html`をブラウザで開く
2. または、簡易的なローカルサーバーを起動：
   ```bash
   # Python 3の場合
   python -m http.server 8000
   
   # Node.jsの場合（http-serverをインストール済み）
   npx http-server
   ```
3. ブラウザで`http://localhost:8000`にアクセス

## ファイル構成

- `index.html` - フォームのHTMLマークアップ
- `script.js` - フォームの動作とGoogle Apps Scriptとの通信
- `styles.css` - フォームのスタイリング
- `google-apps-script.js` - Google Apps Script側のコード（スプレッドシートへの保存処理）

## 機能

- **フォーム入力**: 補助金申請に必要な企業情報の入力
- **バリデーション**: 必須項目チェック、メールアドレス確認、カタカナ入力チェック
- **一時保存**: ローカルストレージを使用した入力内容の一時保存
- **確認画面**: 送信前の入力内容確認
- **データ送信**: Google Sheetsへの自動保存
- **確認メール**: 申請者への自動確認メール送信（オプション）

## データの管理

送信されたデータはGoogle Sheetsに以下の形式で保存されます：

- 送信日時
- 法人種別
- 会社情報（名前、代表者、住所など）
- 労働者数
- 申請方法
- 担当者情報
- 申請理由

## トラブルシューティング

### フォームが送信できない場合

1. Google Apps ScriptのURLが正しく設定されているか確認
2. Google Apps Scriptが正しくデプロイされているか確認
3. ブラウザのコンソールでエラーメッセージを確認

### データがスプレッドシートに保存されない場合

1. SPREADSHEET_IDが正しいか確認
2. Google Apps Scriptの実行権限を確認
3. Apps Scriptのログを確認（表示 → ログ）

## セキュリティ上の注意

- 本番環境では適切なアクセス制限を設定してください
- 個人情報を扱う場合は、SSL/HTTPSを使用してください
- Google Apps Scriptのアクセス権限は必要最小限に設定してください