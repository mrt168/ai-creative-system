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
