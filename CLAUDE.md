# CLAUDE.md

このファイルはClaude Code（claude.ai/code）がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

モバイルファーストのスポーツスケジュールカレンダー（日本語）。
Jリーグ・FIFA W杯2026・海外サッカー・F1・五輪の放送予定を表示する静的サイト。
AWS S3/CloudFront にデプロイする予定。

## 技術スタック

- **フロントエンド**: React + TypeScript（TSX）
- **ビルドツール**: Vite + `@vitejs/plugin-react`
- **スタイル**: Tailwind CSS
- **データ取得スクリプト**: TypeScript（Node.js ESM / `tsx`で実行）
- **デプロイ**: GitHub Actions → AWS S3 + CloudFront

## コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド（TypeScript コンパイル + Vite バンドル）
npm run build

# 型チェックのみ（コンパイルなし）
npm run type-check

# スケジュールデータをAPIから取得して public/data/events.json を生成
FOOTBALL_DATA_TOKEN=xxxxx npx tsx fetch-schedule.ts

# デプロイ（GitHub Actions 経由 — update-schedule.yml 参照）
npm ci && npm run build
aws s3 sync ./dist s3://my-sports-calendar --delete
aws cloudfront create-invalidation --distribution-id XXXXXXXXXXXX --paths "/*"
```

## アーキテクチャ

### データパイプライン

```
football-data.org API  ──┐
Jolpica (Ergast F1) API ──┤──▶ fetch-schedule.ts ──▶ public/data/events.json
放送局テーブル（手動）   ─┘
```

**`fetch-schedule.ts`** — GitHub Actions が毎日 JST 06:00 に実行する Node.js TypeScript スクリプト。
- football-data.org v4（`/competitions/{code}/matches`）を `FOOTBALL_DATA_TOKEN` 環境変数を使って呼び出す
- Jolpica API で F1 レース情報を取得（トークン不要）
- `toJst()` 関数でUTCタイムスタンプをJST（+9h）に変換
- `BROADCASTER_RULES`（このファイル内で手動管理）から放送局情報をマージ
- ソート済みJSONを `public/data/events.json` に出力

**`sports-calendar.tsx`** — シングルファイルのReactコンポーネント（TSX）。
- 起動時に `/data/events.json` をフェッチ。失敗時（未生成・オフライン）はファイル内の `SAMPLE_EVENTS` にフォールバック
- フィルタリング・検索はすべてクライアントサイドで `useMemo` を使って処理

### 主要な型定義

`Event` 型（`events.json` の各要素）:

```typescript
type Event = {
  id: string;
  lg: 'wc2026' | 'jleague' | 'intl' | 'f1' | 'olympic';
  date: string;   // YYYY-MM-DD
  day: string;    // 日・月・火・水・木・金・土
  time: string;   // HH:MM（深夜は "26:00" のような表記も可）
  title: string;
  cat: string;
  casts: string[]; // 放送局キー（例: "dazn", "ntv"）
  fav?: boolean;
};
```

`lg` の値は `sports-calendar.tsx` 内の `LEAGUES` にマッピング。
`casts` の値は `BROADCASTERS` にマッピング。

JSONサンプル:
```json
{ "id": "fb-123", "lg": "wc2026", "date": "2026-06-14", "day": "土",
  "time": "05:00", "title": "日本 vs ブラジル", "cat": "グループステージ",
  "casts": ["dazn", "ntv"] }
```

### 構成ファイル

| ファイル | 役割 |
|----------|------|
| `vite.config.ts` | Viteビルド設定 |
| `tsconfig.json` | TypeScriptコンパイラ設定 |
| `package.json` | 依存関係・スクリプト定義 |
| `update-schedule.yml` | GitHub Actions ワークフロー |

## 手動保守ポイント

- **放送局ルール** — `fetch-schedule.ts` 内の `BROADCASTER_RULES`：大会別・試合タイトル別のオーバーライドをここで追加・編集する
- **チーム名翻訳** — `fetch-schedule.ts` 内の `TEAM_JA`：英語/現地語 → 日本語の対応表
- **Jリーグデータ** — 無料APIなし。`SAMPLE_EVENTS` に手動追加するか、有料APIと新しい `fetchJLeague()` 関数を実装する
- **AWSリソースID** — `update-schedule.yml` 内の S3バケット名・CloudFrontディストリビューションID・IAMロールARNはプレースホルダー。実際の値に要変更

## 時刻の扱い

`"26:00"` のような時刻表記は深夜帯（翌日）を意味し、UIでは「翌」と表示される。
`sports-calendar.tsx` の `toMinutes()` がソート用に処理。
`fetch-schedule.ts` の `toJst()` はUTC→JST変換を手動実装（`Intl` やタイムゾーンライブラリ不使用）。

## デプロイ

GitHub Actions（`update-schedule.yml`）が毎日 UTC 21:00（JST 06:00）と `workflow_dispatch` で実行。
OIDC（`id-token: write`）を使用するためAWSアクセスキーは不要 — IAMロールを直接 assume する。
