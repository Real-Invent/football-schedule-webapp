# E2E テスト（Cypress）

このプロジェクトの E2E テストは Cypress で実装されています。

## セットアップ

```bash
npm ci
```

Cypress は既に `package.json` の devDependencies に含まれています。

## テスト実行

### インタラクティブモード（開発時）

```bash
npm run cy:open
```

ブラウザウィンドウが開き、テストを選択して実行できます。

### ヘッドレスモード（CI/自動化）

```bash
npm run cy:run
```

すべてのテストを実行し、結果をコンソールに出力。

## テストシナリオ

### `schedule.cy.ts` — メイン機能

- ページロード時のイベント表示
- イベント詳細の正確性
- リーグ別フィルタリング
- お気に入り機能
- LocalStorage の永続化
- テキスト検索
- 深夜帯時刻表示（26:00 など）
- モバイルレスポンシブ表示

### `fallback.cy.ts` — エラーハンドリング

- `events.json` 404 時のフォールバック
- ネットワークエラー時の動作
- 放送局情報の表示

## テストの追加

1. `cypress/e2e/` に新しい `.cy.ts` ファイルを追加
2. `describe`/`it` で テストを記述
3. `cy.` でコマンド実行

### 必須の `data-testid` 属性

テストが正常に動作するため、以下のコンポーネントに `data-testid` を追加してください：

- `[data-testid="event-card"]` — イベントカード
- `[data-testid="event-date"]` — 日付
- `[data-testid="event-time"]` — 時刻
- `[data-testid="event-title"]` — タイトル
- `[data-testid="league-filter-*"]` — リーグフィルタボタン（例: `league-filter-wc2026`）
- `[data-testid="favorite-btn"]` — お気に入りボタン
- `[data-testid="search-input"]` — 検索入力
- `[data-testid="broadcaster"]` — 放送局情報

## 参考資料

- [Cypress 公式ドキュメント](https://docs.cypress.io)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
