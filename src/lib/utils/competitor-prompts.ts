// Competitor Analysis Prompts for Gemini API
// 競合広告分析用のプロンプト

import { AppealAxisId, APPEAL_AXES } from '@/constants/appeal-axes';

// ============================================================
// Types
// ============================================================

export interface ProductInfo {
  productName: string;
  productCategory: string;
  features: string[];
}

export interface SearchKeywordsResponse {
  keywords: string[];
}

export interface AppealAxesDistribution {
  spec: number;
  quality: number;
  benefit: number;
  emotion: number;
  social: number;
  urgency: number;
  price: number;
  ease: number;
  authority: number;
}

export interface CompetitorAnalysisResponse {
  trendingMessages: string[];
  appealAxesDistribution: AppealAxesDistribution;
  differentiationOpportunities: string[];
  recommendations: string[];
}

export interface SingleAdAnalysisResponse {
  primaryAppealAxis: AppealAxisId;
  secondaryAppealAxes: AppealAxisId[];
  keyMessages: string[];
  targetAudience: string;
  emotionalTriggers: string[];
  uniqueSellingPoints: string[];
}

// ============================================================
// Helper Functions
// ============================================================

function getAppealAxesDescription(): string {
  return Object.entries(APPEAL_AXES)
    .map(([id, config]) => `- ${id}: ${config.label} - ${config.description}`)
    .join('\n');
}

// ============================================================
// Prompt Builders
// ============================================================

/**
 * 商品情報から競合広告を検索するためのキーワードを生成するプロンプト
 */
export function buildSearchKeywordsPrompt(productInfo: ProductInfo): string {
  return `
あなたは広告マーケティングの専門家です。
以下の商品情報を分析し、Meta広告ライブラリで競合他社の広告を検索するための効果的なキーワードを生成してください。

## 商品情報
- 商品名: ${productInfo.productName}
- カテゴリー: ${productInfo.productCategory}
- 特徴: ${productInfo.features.join(', ')}

## 生成ルール
1. 直接的な競合商品・サービス名（推測できる場合）
2. 商品カテゴリーに関連する一般的なキーワード
3. ターゲット顧客が検索しそうなキーワード
4. 商品の主な機能・ベネフィットに関連するキーワード
5. 業界特有の用語やトレンドワード

キーワードは日本語で、10〜20個程度を目安に生成してください。
検索精度を高めるため、具体的で広告に使われやすい単語を選んでください。

## 出力形式
以下のJSON形式で出力してください:
\`\`\`json
{
  "keywords": ["キーワード1", "キーワード2", "キーワード3", ...]
}
\`\`\`

注意:
- 一般的すぎるキーワード（例：「商品」「サービス」）は避ける
- 競合が広告で実際に使用しそうな具体的な言葉を選ぶ
- 複合語やフレーズも含める
`.trim();
}

/**
 * 複数の競合広告を分析し、インサイトを抽出するプロンプト
 */
export function buildCompetitorAnalysisPrompt(ads: string[]): string {
  const adsText = ads
    .map((ad, index) => `【広告${index + 1}】\n${ad}`)
    .join('\n\n');

  return `
あなたは広告分析の専門家です。
以下の競合他社の広告テキストを分析し、マーケティングインサイトを抽出してください。

## 分析対象の広告（${ads.length}件）
${adsText}

## 訴求軸の定義
${getAppealAxesDescription()}

## 分析タスク

### 1. トレンドメッセージの特定
競合広告で共通して使われているテーマやメッセージを抽出してください。
- 頻出するキーワードやフレーズ
- 共通の価値訴求
- 業界で定番となっている表現

### 2. 訴求軸の分布分析
各広告がどの訴求軸を使用しているかを分析し、全体の分布をパーセンテージで示してください。
合計が100になるよう調整してください。

### 3. 差別化の機会
競合が手薄にしている領域や、差別化できる機会を特定してください。
- 使われていない訴求軸
- 言及されていないベネフィット
- 新しいアプローチの可能性

### 4. 戦略的レコメンデーション
分析結果に基づき、自社の広告戦略に活かせる具体的な提案を行ってください。

## 出力形式
以下のJSON形式で出力してください:
\`\`\`json
{
  "trendingMessages": [
    "競合で共通して使われているメッセージ1",
    "競合で共通して使われているメッセージ2",
    "競合で共通して使われているメッセージ3"
  ],
  "appealAxesDistribution": {
    "spec": 15,
    "quality": 10,
    "benefit": 25,
    "emotion": 10,
    "social": 15,
    "urgency": 5,
    "price": 10,
    "ease": 5,
    "authority": 5
  },
  "differentiationOpportunities": [
    "差別化できるポイント1",
    "差別化できるポイント2",
    "差別化できるポイント3"
  ],
  "recommendations": [
    "具体的な戦略提案1",
    "具体的な戦略提案2",
    "具体的な戦略提案3"
  ]
}
\`\`\`

注意:
- trendingMessagesは3〜7個程度
- appealAxesDistributionの合計は100になるようにする
- differentiationOpportunitiesは実行可能な具体的なものを3〜5個
- recommendationsは戦略的で実用的なものを3〜5個
`.trim();
}

/**
 * 単一の広告テキストを分析するプロンプト
 */
export function buildSingleAdAnalysisPrompt(adText: string): string {
  return `
あなたは広告コピーライティングの専門家です。
以下の広告テキストを詳細に分析してください。

## 分析対象の広告
${adText}

## 訴求軸の定義
${getAppealAxesDescription()}

## 分析タスク

### 1. 主要訴求軸の特定
この広告が最も強く訴求している軸を1つ特定してください。

### 2. 副次的訴求軸の特定
補助的に使用されている訴求軸があれば特定してください。

### 3. キーメッセージの抽出
広告が伝えようとしている主要なメッセージを抽出してください。

### 4. ターゲットオーディエンスの推測
この広告がターゲットにしていると思われる顧客像を推測してください。

### 5. 感情トリガーの分析
広告が刺激しようとしている感情や心理的トリガーを特定してください。

### 6. USP（独自の価値提案）
広告から読み取れる独自の価値提案を抽出してください。

## 出力形式
以下のJSON形式で出力してください:
\`\`\`json
{
  "primaryAppealAxis": "benefit",
  "secondaryAppealAxes": ["social", "ease"],
  "keyMessages": [
    "主要メッセージ1",
    "主要メッセージ2"
  ],
  "targetAudience": "ターゲット顧客の説明",
  "emotionalTriggers": [
    "感情トリガー1",
    "感情トリガー2"
  ],
  "uniqueSellingPoints": [
    "USP1",
    "USP2"
  ]
}
\`\`\`

注意:
- primaryAppealAxisは訴求軸のID（spec, quality, benefit, emotion, social, urgency, price, ease, authority）から1つ選択
- secondaryAppealAxesは0〜3個程度
- keyMessagesは2〜4個程度
- emotionalTriggersは1〜3個程度
- uniqueSellingPointsは1〜3個程度
`.trim();
}

// ============================================================
// Response Parsers (Optional helpers for parsing Gemini responses)
// ============================================================

/**
 * Geminiのレスポンスからコードブロック内のJSONを抽出
 */
export function extractJsonFromResponse<T>(response: string): T | null {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim()) as T;
    }
    // Try to parse the whole response as JSON
    return JSON.parse(response) as T;
  } catch {
    console.error('Failed to parse JSON from Gemini response:', response);
    return null;
  }
}

/**
 * 検索キーワードレスポンスのパース
 */
export function parseSearchKeywordsResponse(response: string): SearchKeywordsResponse | null {
  return extractJsonFromResponse<SearchKeywordsResponse>(response);
}

/**
 * 競合分析レスポンスのパース
 */
export function parseCompetitorAnalysisResponse(response: string): CompetitorAnalysisResponse | null {
  return extractJsonFromResponse<CompetitorAnalysisResponse>(response);
}

/**
 * 単一広告分析レスポンスのパース
 */
export function parseSingleAdAnalysisResponse(response: string): SingleAdAnalysisResponse | null {
  return extractJsonFromResponse<SingleAdAnalysisResponse>(response);
}
