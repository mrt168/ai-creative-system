# Meta広告ライブラリ連携機能

Created: 2026-01-14
Branch: feature/meta-ads-library
Status: Implementation Complete - Pending Verification

## Overview

ミーティング(2025/01/07)の議論に基づき、プロダクトアウト型からマーケットイン型へのアプローチ転換を実現する。
Meta広告ライブラリAPIを活用して競合のクリエイティブを分析し、より戦略的なバナー生成を可能にする。

**背景:**
- 現状: 商品情報からペルソナを生成し、そこからクリエイティブを作る（プロダクトアウト型）
- 課題: 既存の延長上にあるクリエイティブしか生み出せない
- 解決策: 競合広告を分析して差別化要素を導出（マーケットイン型）

## Progress

| Date | Content | Status |
|------|------|------|
| 2026-01-14 | Planning | Completed |
| 2026-01-14 | Meta API調査 | Completed |
| 2026-01-14 | Meta Ads APIクライアント実装 | Completed |
| 2026-01-14 | DB型定義更新 | Completed |
| 2026-01-14 | Geminiプロンプト作成 | Completed |
| 2026-01-14 | Repository実装 | Completed |
| 2026-01-14 | APIエンドポイント実装 | Completed |
| 2026-01-14 | UIコンポーネント実装 | Completed |
| 2026-01-14 | プロジェクトページ統合 | Completed |
| 2026-01-14 | ビルド成功 | Completed |
| 2026-01-14 | 動作確認・検証 | In Progress |

## Implemented Files

### Meta Ads API Client
- `src/lib/meta-ads/client.ts` - Meta Ads Library API クライアント
- `src/lib/meta-ads/index.ts` - エクスポート

### Database Types
- `src/lib/supabase/types.ts` - 競合広告テーブル型定義追加

### Repository
- `src/lib/supabase/repositories/competitor.ts` - 競合広告リポジトリ

### API Endpoints
- `src/app/api/meta-ads/search/route.ts` - 競合広告検索
- `src/app/api/meta-ads/analyze/route.ts` - 競合分析実行
- `src/app/api/meta-ads/keywords/route.ts` - キーワード自動生成

### Gemini Prompts
- `src/lib/utils/competitor-prompts.ts` - 競合分析用プロンプト

### UI Components
- `src/components/CompetitorAnalysisSection.tsx` - 競合分析セクション
- `src/components/AppealAxesChart.tsx` - 訴求軸分布チャート

### Documentation
- `docs/database/competitor-tables.sql` - Supabase テーブル作成SQL
- `docs/meta-ads-setup.md` - セットアップガイド

## PLAN

### Technical Design

#### API概要
- **Endpoint**: `https://graph.facebook.com/v18.0/ads_archive`
- **必須パラメータ**:
  - `access_token`: Meta開発者トークン
  - `ad_reached_countries`: 国コード (例: 'JP')
  - `search_terms`: 検索キーワード
- **取得可能データ**:
  - `page_name`, `page_id`: 広告主情報
  - `ad_creative_bodies`: 広告テキスト
  - `ad_snapshot_url`: アーカイブプレビューURL
  - `publisher_platforms`: 配信プラットフォーム
  - `media_type`: メディアタイプ (IMAGE, VIDEO等)
- **制限事項**:
  - 画像/動画ファイルは直接取得不可（ad_snapshot_urlで閲覧）
  - 詳細ターゲティングデータは取得不可
  - EU/UK以外の非政治広告は限定的

#### データベース設計

**新規テーブル: `acs_competitor_ads`**
```sql
CREATE TABLE acs_competitor_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES acs_projects(id) ON DELETE CASCADE,
  meta_ad_id TEXT UNIQUE,
  page_name TEXT,
  page_id TEXT,
  ad_creative_body TEXT,
  ad_snapshot_url TEXT,
  media_type TEXT,
  publisher_platforms TEXT[],
  ad_delivery_start_date DATE,
  search_term TEXT,
  country_code TEXT,
  analysis JSONB, -- Gemini分析結果
  created_at TIMESTAMP DEFAULT NOW()
);
```

**新規テーブル: `acs_competitor_analyses`**
```sql
CREATE TABLE acs_competitor_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES acs_projects(id) ON DELETE CASCADE,
  search_term TEXT NOT NULL,
  country_code TEXT DEFAULT 'JP',
  ad_count INTEGER,
  analysis_summary JSONB, -- 競合傾向の要約
  appeal_axes_distribution JSONB, -- 訴求軸の分布
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 実装アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                   新フロー (マーケットイン型)                    │
└─────────────────────────────────────────────────────────────────┘

1. 商品情報入力
       ↓
2. 検索キーワード生成 (Gemini)
   - 商品カテゴリ、特徴から競合検索用キーワードを生成
       ↓
3. Meta広告ライブラリ検索
   POST /api/meta-ads/search
   - 複数キーワードで競合広告を取得
   - ad_snapshot_url から広告プレビューを取得
       ↓
4. 競合広告分析 (Gemini)
   POST /api/meta-ads/analyze
   - 取得した広告テキストを分析
   - 訴求軸の分布、トレンド、差別化ポイントを抽出
       ↓
5. 戦略設計へ反映
   - 競合分析結果を StrategyForm に自動反映
   - 推奨訴求軸、差別化ポイントを提示
       ↓
6. バナー生成 (既存フロー)
   - 競合分析に基づいた訴求軸でバナー生成
```

### TODO

- [ ] Meta Ads Library APIクライアント実装 (`/lib/meta-ads/client.ts`)
- [ ] DB: acs_competitor_ads テーブル作成
- [ ] DB: acs_competitor_analyses テーブル作成
- [ ] Repository: competitorAdsRepository 実装
- [ ] API: POST /api/meta-ads/search エンドポイント
- [ ] API: POST /api/meta-ads/analyze エンドポイント
- [ ] Gemini: 検索キーワード生成プロンプト
- [ ] Gemini: 競合広告分析プロンプト
- [ ] UI: CompetitorAnalysisSection コンポーネント
- [ ] UI: StrategyForm への競合分析結果統合
- [ ] ビルド・型チェック実行
- [ ] 開発サーバー起動・動作確認
- [ ] webapp-testing で検証
- [ ] artifact-proof でエビデンス収集
- [ ] /done 実行 (reviw でレビュー)

### Completion Criteria

- [ ] Meta広告ライブラリAPIから競合広告を取得できる
- [ ] 取得した広告をGeminiで分析し、訴求軸の分布を可視化
- [ ] 競合分析結果がStrategyFormに反映される
- [ ] ビルド成功・型エラーなし
- [ ] 動作確認完了
- [ ] エビデンス収集完了
- [ ] reviwでレビュー・承認

## Technical Notes

### Meta Ads Library API 制限事項
- 画像/動画ファイルは直接ダウンロード不可
- ad_snapshot_url でブラウザプレビューは可能
- 非政治広告はEU/UK以外では限定的
- レート制限あり（具体的数値非公開）

### 実装方針
1. まず広告テキスト（ad_creative_bodies）の分析に集中
2. 画像分析は ad_snapshot_url のスクレイピングで対応（将来検討）
3. 検索精度向上のためキーワード生成をGeminiに委譲

## Evidence

<!-- artifact-proof でエビデンス収集後に記載 -->

---

## 🔄 Codex Review Session

### Round 1 - 2026-01-14

**レビュー結果:**
- 指摘数: 3件 (Critical: 3)

**指摘内容:**

| # | 重要度 | ファイル | 内容 | 対応状況 |
|---|--------|----------|------|----------|
| 1 | 🔴 P1 | `src/app/api/meta-ads/search/route.ts:12-59` | APIが`searchTerms`を期待するがUIは`keywords`を送信。キーワードが無視される | ✅ 修正済 |
| 2 | 🔴 P1 | `src/app/api/meta-ads/search/route.ts:173-177` | レスポンスに`count`がないためUIの分析ボタンが無効化される | ✅ 修正済 |
| 3 | 🔴 P1 | `src/lib/utils/competitor-prompts.ts:32-37` | 分析結果のスキーマがUIの期待と不一致。UIはオブジェクト配列を期待するが文字列配列が返る | ✅ 修正済 |

**対応内容:**
- [x] 指摘1: search APIで`keywords`フィールドも受け入れるよう修正（`SearchRequestBody`にkeywordsを追加）
- [x] 指摘2: レスポンスに`count`フィールドを追加（`SearchResponseData`にcountを追加）
- [x] 指摘3: analyze APIに`transformToUIFormat()`変換関数を追加し、Geminiレスポンスを`TrendingMessage[]`, `DifferentiationOpportunity[]`, `Recommendation[]`形式に変換

### Round 2 - 2026-01-14

**レビュー結果:** ✅ LGTM (No issues found)

> "I did not spot functional regressions or correctness issues in the added Meta Ads competitor analysis features, API routes, Supabase repository/types, or UI integration. The changes appear internally consistent and rely on expected constraints documented in the new SQL schema."

**結論:** Round 1で指摘された3件のP1問題をすべて修正し、Round 2でLGTMを取得。
