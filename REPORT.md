# E2E Health Review Report

**レビュー日時**: 2026-01-14
**レビュアー**: E2E Health Reviewer Agent
**対象プロジェクト**: `/Users/kokies/Documents/working/topright/ai-creative-system/.worktree/meta-ads-library`

---

## 対象実装ファイル

| ファイル | 説明 |
|---------|------|
| `src/app/api/meta-ads/search/route.ts` | 競合広告検索API |
| `src/app/api/meta-ads/analyze/route.ts` | 競合広告分析API |
| `src/app/api/meta-ads/keywords/route.ts` | キーワード生成API |
| `src/components/CompetitorAnalysisSection.tsx` | 競合分析UIコンポーネント |
| `src/lib/meta-ads/client.ts` | Meta Ads Library APIクライアント |

---

## E2E Health Review

### 1. E2Eテストファイル状況

| 項目 | 状態 |
|-----|------|
| 専用E2Eテストファイル (*.e2e.ts) | **未作成** |
| Playwright設定 (playwright.config.ts) | **未設定** |
| Cypress設定 | **未設定** |
| Integration Tests | 存在 (`tests/integration/api-workflow.test.ts`) |
| Unit Tests | 存在 (`tests/unit/`) |

**判定**: E2Eテストが存在しません。対象の競合分析機能（meta-ads関連）についてはE2Eテストが未実装です。

---

### 2. goto制限チェック

| ファイル | 行 | コード | 判定 |
|---------|-----|--------|------|
| - | - | - | N/A (E2Eテストファイルなし) |

**判定**: E2Eテストファイルが存在しないため、goto制限違反の検出対象がありません。

**将来的なE2Eテスト作成時の注意事項**:
- 最初の `page.goto('/')` のみ許可
- `/api/meta-ads/*` への直接アクセスは禁止（UI経由で操作）
- 外部URL（Meta Graph API等）への直接gotoは禁止

---

### 3. レコード変化アサーションチェック

#### 既存テストの状況

| ファイル | 状態 | 詳細 |
|---------|------|------|
| `tests/integration/api-workflow.test.ts` | OK | DBレコード変化を検証 |
| `tests/unit/lib/db/repositories/*.test.ts` | OK | CRUD操作を検証 |

#### 対象実装ファイルのDB操作

| API | DB操作 | テスト有無 |
|-----|--------|----------|
| `/api/meta-ads/search` | `competitorRepo.upsertAd()` | **未テスト** |
| `/api/meta-ads/analyze` | `competitorRepo.createAnalysis()` | **未テスト** |
| `/api/meta-ads/keywords` | なし | - |

**判定**: **不足** - meta-ads関連のAPI実装にはDBへの書き込み操作（`upsertAd`, `createAnalysis`）がありますが、これらを検証するE2Eテストが存在しません。

**検出されたDB操作** (`src/app/api/meta-ads/search/route.ts:143-156`):
```typescript
await competitorRepo.upsertAd({
  projectId: body.projectId,
  metaAdId: ad.id,
  pageName: ad.page_name,
  // ... 省略
});
```

**検出されたDB操作** (`src/app/api/meta-ads/analyze/route.ts:201-211`):
```typescript
await competitorRepo.createAnalysis({
  projectId: body.projectId,
  searchTerm: searchTerm,
  adCount: textsForAnalysis.length,
  // ... 省略
});
```

---

### 4. ハードコード・環境ロック検出

| ファイル | 行 | コード | 判定 |
|---------|-----|--------|------|
| `src/lib/meta-ads/client.ts` | 109 | `BASE_URL = 'https://graph.facebook.com'` | OK (外部API) |
| `src/lib/meta-ads/client.ts` | 422 | `process.env.META_ADS_ACCESS_TOKEN` | OK (環境変数) |
| `src/lib/supabase/client.ts` | 5-6 | `process.env.NEXT_PUBLIC_SUPABASE_*` | OK (環境変数) |
| `src/lib/gemini/client.ts` | 105 | `process.env.GEMINI_API_KEY` | OK (環境変数) |
| `README.md` | 17 | `localhost:3000` | INFO (ドキュメント) |
| `.artifacts/*/REPORT.md` | - | `localhost:3000` | INFO (レポート) |

**localhost ハードコード (プロダクションコード)**: なし
**127.0.0.1 ハードコード**: なし

**判定**: OK - 環境ロックの問題は検出されませんでした。すべての環境依存値は環境変数から取得されています。

---

### 5. モック・スタブ検出

#### Unit Tests (許容)

| ファイル | モック対象 | 判定 |
|---------|-----------|------|
| `tests/unit/lib/gemini/client.test.ts` | `@google/genai` | Unit Test - 許容 |
| `tests/unit/lib/gemini/image-generator.test.ts` | `GeminiClient`, `fs/promises` | Unit Test - 許容 |
| `tests/unit/lib/gemini/persona-analyzer.test.ts` | `GeminiClient` | Unit Test - 許容 |
| `tests/unit/lib/queue/banner-queue.test.ts` | `ImageGenerator`, `Repositories` | Unit Test - 許容 |

#### E2Eテストでのモック

**検出**: なし（E2Eテストファイル未作成）

**判定**: OK - モック使用はUnit Testに限定されています。

**将来的なE2Eテスト作成時の注意**:
- モック/スタブの使用禁止
- Meta Ads API: 実APIまたはテスト用サンドボックス使用
- Gemini API: 実API使用（クォータ管理必要）
- Supabase: ローカルエミュレーター使用推奨

---

### 6. wrangler preview互換性

| 項目 | 状態 | 備考 |
|-----|------|------|
| `wrangler.toml` | **未検出** | Cloudflare Workers未使用 |
| 開発サーバー依存 | なし | ハードコードなし |
| Next.js依存 | あり | App Router使用 |

**判定**: N/A - Cloudflare Workers環境は対象外。Next.js + Vercel前提のプロジェクト構成です。

---

## 総合判定

| カテゴリ | スコア | 備考 |
|---------|--------|------|
| E2Eテストファイル | 0/1 | 未作成 |
| goto制限 | N/A | テストファイルなし |
| レコードアサーション | 0/1 | meta-ads関連のDB操作未検証 |
| ハードコード検出 | 1/1 | 問題なし |
| モック・スタブ | 1/1 | Unit Testのみで使用 |
| テスタビリティ | 0.5/1 | 依存性注入の改善余地あり |

**総合スコア**: 2.5/5

---

## 推奨アクション

### [優先度: 高] E2Eテストの作成

競合分析機能のE2Eテストを作成してください。

**対象フロー**:
1. キーワード自動生成 → 競合広告検索 → 分析実行
2. 手動キーワード入力 → 競合広告検索 → 分析実行

**テストファイル配置**: `/tests/e2e/competitor-analysis.e2e.ts`

### [優先度: 高] レコード変化アサーションの追加

以下のDB操作に対するアサーションが必要です:

1. `acs_competitor_ads` テーブル:
   - `/api/meta-ads/search` 実行後のレコード作成を検証

2. `acs_competitor_analyses` テーブル:
   - `/api/meta-ads/analyze` 実行後のレコード作成を検証

### [優先度: 中] Supabaseローカルエミュレーターの導入

```bash
# Supabase CLI インストール
npm install supabase --save-dev

# ローカル環境起動
npx supabase start

# E2Eテストでは以下の環境変数を使用
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
```

### [優先度: 中] 依存性注入パターンの導入

API実装における依存性注入の改善:

**現状** (`src/app/api/meta-ads/search/route.ts`):
```typescript
const projectRepo = new ProjectRepository();
const competitorRepo = new CompetitorRepository();
const metaAdsClient = getMetaAdsClient();
```

**改善案**:
```typescript
// repositories/client を引数で受け取れるようにする
// テスト時にモックを注入可能にする
```

### [優先度: 低] Playwright設定の追加

```bash
# Playwright インストール
npm install -D @playwright/test

# 設定ファイル作成
npx playwright init
```

---

## 付録: E2Eテスト作成テンプレート

```typescript
// tests/e2e/competitor-analysis.e2e.ts
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// テスト用Supabaseクライアント（エミュレーター接続）
const supabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_ANON_KEY!
);

test.describe('Competitor Analysis Flow', () => {
  let testProjectId: string;

  test.beforeAll(async () => {
    // テストプロジェクトを作成
    const { data } = await supabase
      .from('acs_projects')
      .insert({
        name: 'E2E Test Project',
        product_name: 'Test Product',
        product_category: 'Beauty',
      })
      .select()
      .single();
    testProjectId = data.id;
  });

  test.afterAll(async () => {
    // テストデータをクリーンアップ
    await supabase.from('acs_competitor_ads').delete().eq('project_id', testProjectId);
    await supabase.from('acs_competitor_analyses').delete().eq('project_id', testProjectId);
    await supabase.from('acs_projects').delete().eq('id', testProjectId);
  });

  test.beforeEach(async ({ page }) => {
    // 初回ナビゲーションのみgoto許可
    await page.goto('/');
  });

  test('should search competitor ads and save to database', async ({ page }) => {
    // プロジェクト詳細ページに遷移（UIクリック）
    await page.getByRole('link', { name: 'E2E Test Project' }).click();

    // キーワード入力
    await page.getByPlaceholder('キーワードを入力').fill('スキンケア');
    await page.getByRole('button', { name: /追加/ }).click();

    // 検索実行
    await page.getByRole('button', { name: '競合広告を検索' }).click();

    // 検索完了を待機
    await expect(page.getByText(/件の広告が見つかりました/)).toBeVisible({ timeout: 30000 });

    // DBレコード変化アサーション
    const { count } = await supabase
      .from('acs_competitor_ads')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', testProjectId);

    expect(count).toBeGreaterThan(0);
  });

  test('should analyze competitor ads and save analysis result', async ({ page }) => {
    // 前提: 検索済みの広告データが存在すること

    // プロジェクト詳細ページに遷移
    await page.getByRole('link', { name: 'E2E Test Project' }).click();

    // 分析実行
    await page.getByRole('button', { name: '分析を実行' }).click();

    // 分析完了を待機
    await expect(page.getByText(/件の広告を分析しました/)).toBeVisible({ timeout: 60000 });

    // DBレコード変化アサーション
    const { data } = await supabase
      .from('acs_competitor_analyses')
      .select('*')
      .eq('project_id', testProjectId)
      .single();

    expect(data).toBeDefined();
    expect(data.ad_count).toBeGreaterThan(0);
    expect(data.appeal_axes_distribution).toBeDefined();
  });
});
```

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2026-01-14 | 1.0 | 初回レビュー実施 |
