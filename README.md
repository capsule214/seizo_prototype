# 製造スケジュール管理アプリ (seizo_prototype)

装置ごと・担当者ごとの製造予定をガントチャート形式で管理するシングルページアプリケーション（SPA）のプロトタイプです。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| バックエンド | Laravel 13 / PHP 8.2 |
| フロントエンド | React 19 / Vite 8 |
| CSS | Tailwind CSS v4 |
| DB | SQLite 3 |
| ランタイム | Node.js 22.12 以上（Vite 8 の要件）|

---

## 主な機能

- **装置タブ / 担当者タブ** の切り替えによるガントチャート表示
- 予定バーの **ドラッグ移動・リサイズ**（装置間・担当者間の移動含む）
- **複数選択**（Ctrl+クリック・矩形ドラッグ）
- **コピー＆ペースト**（貼り付け先の装置/担当者に統一）
- 右クリック **コンテキストメニュー**（追加・編集・コピー・削除・タブジャンプ）
- **保存 / キャンセル** ボタンによる編集の一括確定・破棄
- **表示設定**（機種・担当者の表示フィルタリング）
- 日本の **祝日対応**（ハッピーマンデー・振替休日・国民の休日）
- **仮想スクロール**（大量データでも高速描画）

---

## セットアップ

### 必要なもの

- PHP 8.2+
- Composer
- Node.js 22.12+

### インストール

```bash
# PHP 依存関係
composer install

# Node 依存関係
npm install

# 環境ファイルの作成
cp .env.example .env
php artisan key:generate

# DB マイグレーション
php artisan migrate
```

### 開発サーバー起動

```bash
npm run start
# → Laravel: http://localhost:8000
# → Vite HMR: http://localhost:5173
```

### 本番ビルド

```bash
npm run build
php artisan serve
```

---

## テストデータの投入

画面上部の「適用」ボタン、または API で直接投入できます。

```bash
curl -X POST http://localhost:8000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"count": 100, "baseDate": "2026-01-01", "months": 6}'
```

---

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/serial` | 装置一覧 |
| GET | `/api/worker` | 担当者一覧 |
| GET | `/api/task` | タスク一覧 |
| GET | `/api/plan?from=&to=` | 予定一覧（期間フィルタ） |
| POST | `/api/plan` | 予定作成 |
| PUT | `/api/plan/{id}` | 予定更新 |
| DELETE | `/api/plan` | 予定一括削除（論理削除） |
| GET | `/api/display-settings` | 表示設定取得 |
| PUT | `/api/display-settings` | 表示設定保存 |
| POST | `/api/seed` | テストデータ生成 |

---

## ディレクトリ構成（主要部分）

```
app/
  Http/Controllers/Api/   # API コントローラ
  Models/                 # Eloquent モデル
database/
  migrations/             # DB スキーマ定義
resources/
  js/
    app.jsx               # React エントリーポイント
    components/           # UI コンポーネント
      SpreadsheetGrid.jsx       # メインのグリッド
      SpreadsheetGridClient.jsx # タブ管理・保存/キャンセル
      DisplaySettingsDialog.jsx
      ScheduleDialog.jsx
      ContextMenu.jsx
      BarTooltip.jsx
      VirtualList.jsx
      DatePicker.jsx
    lib/
      holidays.js         # 日本祝日計算
      colors.js           # タスク色パレット
routes/
  api.php                 # API ルート定義
  web.php                 # SPA マウントポイント
```
