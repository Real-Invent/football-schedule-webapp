# スポーツ放送スケジュールカレンダー

モバイルファーストのスポーツスケジュールカレンダーアプリ。Jリーグ・FIFA W杯2026・海外サッカー・F1・五輪の放送予定を日本語で表示する静的サイトです。

## 特徴

- 📱 **モバイル最適化** — スマートフォンでの利用を優先設計
- 🌍 **複数リーグ対応** — Jリーグ、W杯2026、海外サッカー、F1、五輪
- 🔍 **リアルタイム検索** — 試合名やチーム名で即座に検索
- ❤️ **お気に入り機能** — 見たい試合をマークして追跡
- 📡 **放送局情報** — DAZN、日本テレビ、NHK など複数の放送局に対応
- 🚀 **自動更新** — GitHub Actions で毎日スケジュールを自動取得・更新

## セットアップ

### 必要な環境

- Node.js 18+ 
- npm / yarn

### インストール

```bash
git clone <repository-url>
cd your_project_folder
npm install
```

### 環境変数

`football-data.org` から API データを取得する場合、`.env` ファイルに以下を設定：

```env
FOOTBALL_DATA_TOKEN=your_api_token_here
```

[football-data.org](https://www.football-data.org/) で無料トークンを取得できます。

`gemini-api`を使ってAIをを使用する場合、`.env`ファイルに以下を設定:

```env
VITE_GEMINI_API_KEY=your_api_token_here
```

## コマンド

```bash
# 開発サーバーを起動 (ホットリロード対応)
npm run dev

# 本番ビルド
npm run build

# 型チェック
npm run type-check

# スケジュールデータを API から取得して更新
FOOTBALL_DATA_TOKEN=your_token npx tsx scripts/fetch-schedule.ts
```

## 使い方

### ローカルでの開発

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

### スケジュールデータの更新

**ローカル環境では手動実行が必要です。本番環境（GitHub Actions）では毎日 UTC 21:00（JST 06:00）に自動実行されます。**

```bash
# ローカルでの手動更新
FOOTBALL_DATA_TOKEN=your_token npx tsx scripts/fetch-schedule.ts
```

実行すると、以下の3つのファイルが生成されます：
- `public/data/events.json` — 試合スケジュール
- `public/data/results.json` — 試合結果
- `public/data/standings.json` — F1ドライバー順位表

## プロジェクト構成

```
src/
├── components/                # React UI コンポーネント
│   ├── SportsCalendar.tsx     # メインカレンダーコンポーネント
│   ├── EventCard.tsx          # 試合情報カード
│   ├── EventDetailModal.tsx   # 詳細表示モーダル
│   ├── FilterRow.tsx          # フィルターUIコンポーネント
│   ├── FilterChip.tsx         # フィルタータグ
│   └── __tests__/             # コンポーネント単体テスト
├── constants/                 # 定数定義
│   ├── leagues.ts             # リーグ情報（Jリーグ、W杯など）
│   ├── broadcasters.ts        # 放送局情報（DAZN、NTV等）
│   ├── colors.ts              # カラーパレット
│   ├── ui.ts                  # UI定数
│   ├── match.ts               # 試合関連定数
│   └── sampleEvents.ts        # サンプルイベント（APIエラー時のフォールバック）
├── hooks/                     # React カスタムフック
│   ├── useEvents.ts           # イベント取得・フィルタリングロジック
│   └── __tests__/             # フック単体テスト
├── types/                     # TypeScript型定義
│   └── index.ts               # イベント型などの型定義
├── config/                    # 設定ファイル
│   └── env.ts                 # 環境変数管理
├── App.tsx                    # Reactアプリエントリーポイント
├── main.tsx                   # DOM マウント処理
├── index.css                  # グローバルスタイル
└── vite-env.d.ts              # Vite型定義

scripts/
├── fetch-schedule.ts          # スケジュール取得スクリプト（football-data.org, Jolpica API）
├── run-fetch-schedule.ts      # fetch-schedule.ts 実行ラッパー
├── test-api-format.ts         # API レスポンス検証スクリプト
└── ...                        # その他検証スクリプト

public/data/
├── events.json                # 試合スケジュール（自動生成・毎日更新）
├── results.json               # 試合結果（自動生成）
└── standings.json             # F1ドライバー順位表（自動生成）

.github/workflows/
└── update-schedule.yml        # GitHub Actions ワークフロー（毎日実行）

設定ファイル
├── vite.config.ts             # Viteビルド設定
├── tsconfig.json              # TypeScript設定
├── jest.config.js             # Jest テスト設定
├── cypress.config.ts          # Cypress E2E テスト設定
├── postcss.config.js          # PostCSS設定（Tailwind CSS）
├── .eslintrc.json             # ESLint設定
└── package.json               # 依存パッケージ・スクリプト定義
```

### フォルダ説明

| フォルダ | 役割 |
|---------|------|
| `src/components/` | UI コンポーネント（ビュー層） |
| `src/constants/` | アプリケーション定数（リーグ、放送局、カラー等） |
| `src/hooks/` | ビジネスロジック（イベント取得・フィルタリング） |
| `src/types/` | TypeScript 型定義 |
| `scripts/` | Node.js スクリプト（データ取得、テスト等） |
| `public/data/` | 生成される JSON データファイル |
| `.github/workflows/` | CI/CD 自動化（GitHub Actions） |

## データパイプライン

```
football-data.org API  ──┐
Jolpica (Ergast F1) API ──┤──▶ fetch-schedule.ts ──▶ events.json
放送局テーブル（手動）   ─┘
```

詳細は [CLAUDE.md](./CLAUDE.md) を参照してください。

## CI/CD パイプライン

このプロジェクトは GitHub Actions で**フルオートメーション**されています。

### 自動実行スケジュール

| 処理 | スケジュール | 内容 |
|------|------------|------|
| 📅 データ更新 | 毎日 UTC 21:00（JST 06:00） | football-data.org API から最新スケジュール取得 → `public/data/events.json` 生成 |
| 🔨 ビルド＆デプロイ | データ更新と同時 | `npm run build` で本番バンドル作成 → AWS S3 へアップロード |
| 🌐 CDN キャッシュ更新 | デプロイ後 | CloudFront キャッシュを無効化 |

### ワークフロー構成（[`.github/workflows/update-schedule.yml`](./.github/workflows/update-schedule.yml)）

```yaml
# 毎日 UTC 21:00（JST 06:00）に実行
schedule:
  - cron: '0 21 * * *'

# 手動トリガー
workflow_dispatch

jobs:
  build-and-deploy:
    - スケジュールデータ取得（football-data.org API）
    - TypeScript コンパイル
    - Vite で本番ビルド
    - AWS S3 に同期
    - CloudFront キャッシュ無効化
```

### デプロイメントステップ

1. **環境準備**
   ```bash
   npm ci  # package-lock.json から正確に依存インストール
   ```

2. **本番ビルド**
   ```bash
   npm run build  # TypeScript コンパイル + Vite バンドル → ./dist/
   ```

3. **S3 同期**
   ```bash
   aws s3 sync ./dist s3://my-sports-calendar --delete
   ```
   - `--delete` フラグで古いファイルを自動削除

4. **CDN キャッシュ無効化**
   ```bash
   aws cloudfront create-invalidation --distribution-id XXXX --paths "/*"
   ```
   - ユーザーが最新版を即座に取得

### 認証方式

OIDC（OpenID Connect）を使用しているため、**AWS アクセスキーは不要**：
- IAM ロール を GitHub Actions に直接 assume
- セキュリティベストプラクティスに準拠

### 手動デプロイ

GitHub Actions UI から手動でワークフローをトリガー：
- リポジトリ → **Actions** → **update-schedule** → **Run workflow**

## 技術スタック

- **フロントエンド**: React + TypeScript
- **ビルドツール**: Vite + @vitejs/plugin-react
- **スタイル**: Tailwind CSS
- **スクリプト**: Node.js (TypeScript ESM)
- **CI/CD**: GitHub Actions
- **ホスティング**: AWS S3 + CloudFront

## 詳細ドキュメント

プロジェクトの詳細な技術情報（データパイプライン、型定義、手動保守ポイント、時刻処理など）は [CLAUDE.md](./CLAUDE.md) を参照してください。
