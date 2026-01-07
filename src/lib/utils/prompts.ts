export const PERSONA_ANALYSIS_PROMPT = `
あなたは広告のターゲティング専門家です。
以下の商品情報を分析し、最適なターゲットペルソナを3-5個提案してください。

商品情報:
- 商品名: {productName}
- カテゴリー: {category}
- 特徴: {features}
- ターゲット年齢層: {targetAge}
- ターゲット性別: {targetGender}

各ペルソナには以下の情報を含めてください:
1. ペルソナ名（キャッチーな名前）
2. 年齢範囲
3. 性別
4. 職業
5. 年収レベル
6. 興味・関心事（3-5項目）
7. 課題・悩み（3-5項目）
8. 購買動機
9. コミュニケーションスタイル

JSON形式で出力してください。
`;

export const BANNER_GENERATION_PROMPT = `
以下の条件で広告バナー画像を生成してください:

商品情報:
- 商品名: {productName}
- カテゴリー: {category}
- 特徴: {features}

ターゲットペルソナ:
- ペルソナ名: {personaName}
- 年齢: {ageRange}
- 購買動機: {buyingMotivation}
- 響くメッセージ: {communicationStyle}

デザイン要件:
- スタイル: {style}
- アスペクト比: {aspectRatio}
- 用途: SNS広告（Instagram/Facebook/TikTok）

注意事項:
- テキストは最小限に（キャッチコピーのみ）
- 商品の魅力が伝わる構図
- ターゲットペルソナに響くビジュアル
- プロフェッショナルな品質
`;

export function buildPersonaPrompt(productInfo: {
  name: string;
  category: string;
  features: string[];
  targetAge: string;
  targetGender: string;
}): string {
  return PERSONA_ANALYSIS_PROMPT
    .replace('{productName}', productInfo.name)
    .replace('{category}', productInfo.category)
    .replace('{features}', productInfo.features.join(', '))
    .replace('{targetAge}', productInfo.targetAge)
    .replace('{targetGender}', productInfo.targetGender);
}

export function buildBannerPrompt(params: {
  productName: string;
  category: string;
  features: string[];
  personaName: string;
  ageRange: string;
  buyingMotivation: string;
  communicationStyle: string;
  style: string;
  aspectRatio: string;
}): string {
  return BANNER_GENERATION_PROMPT
    .replace('{productName}', params.productName)
    .replace('{category}', params.category)
    .replace('{features}', params.features.join(', '))
    .replace('{personaName}', params.personaName)
    .replace('{ageRange}', params.ageRange)
    .replace('{buyingMotivation}', params.buyingMotivation)
    .replace('{communicationStyle}', params.communicationStyle)
    .replace('{style}', params.style)
    .replace('{aspectRatio}', params.aspectRatio);
}

// ============================================================
// Auto Creative Generation
// ============================================================

export interface AutoCreativeInput {
  productName: string;
  productCategory: string;
  features: string[];
  funnel: 'awareness' | 'conversion';
  appealAxes: string[];
  target: {
    gender: string;
    ageFrom: number;
    ageTo: number;
    issue: string;
  };
}

export interface GeneratedCreative {
  catchCopy: string;
  proof: string;
  cta: string;
  prompt: string;
}

export const AUTO_CREATIVE_GENERATION_PROMPT = `
あなたは広告クリエイティブの専門家です。
以下の情報を基に、効果的な広告クリエイティブを生成してください。

## 商品情報
- 商品名: {productName}
- カテゴリー: {productCategory}
- 特徴: {features}

## ターゲット情報
- 性別: {gender}
- 年齢: {ageFrom}歳〜{ageTo}歳
- 抱えている課題: {issue}

## マーケティング設定
- ファンネル: {funnel}
- 訴求軸: {appealAxes}

## 生成ルール
{funnelRules}

## 出力形式
以下のJSON形式で出力してください:
\`\`\`json
{
  "catchCopy": "キャッチコピー（15文字以内）",
  "proof": "証明・根拠（20文字以内）",
  "cta": "CTA文言（10文字以内）",
  "prompt": "バナー画像生成用のプロンプト（英語、150語以内）"
}
\`\`\`

注意:
- キャッチコピーはターゲットの課題に響くものにする
- 証明は数字や権威性を活用する
- CTAはファンネルに合わせた適切なアクションを促す
- プロンプトは商品の魅力とターゲットの感情に訴えるビジュアルを生成するよう指示する
`;

const AWARENESS_FUNNEL_RULES = `
- 認知フェーズのため、ブランドや商品の存在を印象づけることが重要
- キャッチコピーは課題の共感や興味を引く内容
- CTAは「詳しく見る」「もっと知る」など軽いアクション
- 証明は信頼性を高める要素（実績、受賞歴など）
`;

const CONVERSION_FUNNEL_RULES = `
- 購買フェーズのため、今すぐ行動を促すことが重要
- キャッチコピーは具体的なベネフィットや限定感を強調
- CTAは「今すぐ購入」「申し込む」など明確なアクション
- 証明は購入を後押しする要素（満足度、効果実績など）
`;

export function buildAutoCreativePrompt(input: AutoCreativeInput): string {
  const funnelRules = input.funnel === 'awareness'
    ? AWARENESS_FUNNEL_RULES
    : CONVERSION_FUNNEL_RULES;

  const funnelLabel = input.funnel === 'awareness' ? '認知（Awareness）' : '獲得（Conversion）';

  return AUTO_CREATIVE_GENERATION_PROMPT
    .replace('{productName}', input.productName)
    .replace('{productCategory}', input.productCategory)
    .replace('{features}', input.features.join(', '))
    .replace('{gender}', input.target.gender)
    .replace('{ageFrom}', String(input.target.ageFrom))
    .replace('{ageTo}', String(input.target.ageTo))
    .replace('{issue}', input.target.issue)
    .replace('{funnel}', funnelLabel)
    .replace('{appealAxes}', input.appealAxes.join(', '))
    .replace('{funnelRules}', funnelRules);
}

export const AUTO_BANNER_PROMPT = `
以下の条件で広告バナー画像を生成してください:

## クリエイティブ内容
- キャッチコピー: {catchCopy}
- 証明: {proof}
- CTA: {cta}

## 商品情報
- 商品名: {productName}
- カテゴリー: {productCategory}

## ターゲット情報
- 性別: {gender}
- 年齢: {ageFrom}歳〜{ageTo}歳

## デザイン要件
- アスペクト比: {aspectRatio}
- 用途: SNS広告

## 追加の指示
{additionalPrompt}

注意事項:
- テキストは最小限に（キャッチコピーとCTAのみ）
- 商品の魅力が伝わる構図
- ターゲットに響くビジュアル
- プロフェッショナルな品質
`;

export function buildAutoBannerPrompt(params: {
  catchCopy: string;
  proof: string;
  cta: string;
  productName: string;
  productCategory: string;
  gender: string;
  ageFrom: number;
  ageTo: number;
  aspectRatio: string;
  additionalPrompt: string;
}): string {
  return AUTO_BANNER_PROMPT
    .replace('{catchCopy}', params.catchCopy)
    .replace('{proof}', params.proof)
    .replace('{cta}', params.cta)
    .replace('{productName}', params.productName)
    .replace('{productCategory}', params.productCategory)
    .replace('{gender}', params.gender)
    .replace('{ageFrom}', String(params.ageFrom))
    .replace('{ageTo}', String(params.ageTo))
    .replace('{aspectRatio}', params.aspectRatio)
    .replace('{additionalPrompt}', params.additionalPrompt);
}
