import { GeminiClient } from './client';
import { buildPersonaPrompt } from '../utils/prompts';

export interface ProductInfo {
  name: string;
  category: string;
  features: string[];
  targetAge: string;
  targetGender: string;
}

export interface GeneratedPersona {
  name: string;
  ageRange: string;
  gender: string;
  occupation: string;
  incomeLevel?: string;
  interests: string[];
  painPoints: string[];
  buyingMotivation: string;
  communicationStyle?: string;
}

export interface AnalyzeOptions {
  count?: number;
}

interface PersonaResponse {
  personas: GeneratedPersona[];
}

export class PersonaAnalyzer {
  constructor(private client: GeminiClient) {}

  async analyzeProduct(
    productInfo: ProductInfo,
    options: AnalyzeOptions = {}
  ): Promise<GeneratedPersona[]> {
    this.validateProductInfo(productInfo);

    const { count = 3 } = options;
    const prompt = this.buildAnalysisPrompt(productInfo, count);

    const response = await this.client.generateJSON<PersonaResponse>(prompt);

    return response.personas || [];
  }

  async refinePersona(
    persona: GeneratedPersona,
    productInfo: ProductInfo
  ): Promise<GeneratedPersona> {
    const prompt = this.buildRefinePrompt(persona, productInfo);

    const refined = await this.client.generateJSON<GeneratedPersona>(prompt);

    return refined;
  }

  private validateProductInfo(productInfo: ProductInfo): void {
    if (!productInfo.name) {
      throw new Error('Product name is required');
    }
    if (!productInfo.category) {
      throw new Error('Product category is required');
    }
  }

  private buildAnalysisPrompt(productInfo: ProductInfo, count: number): string {
    const basePrompt = buildPersonaPrompt(productInfo);

    return `${basePrompt}

生成するペルソナの数: ${count}

必ず以下のJSON形式で出力してください:
{
  "personas": [
    {
      "name": "ペルソナ名",
      "ageRange": "年齢範囲",
      "gender": "性別",
      "occupation": "職業",
      "incomeLevel": "年収レベル",
      "interests": ["興味1", "興味2", "興味3"],
      "painPoints": ["課題1", "課題2", "課題3"],
      "buyingMotivation": "購買動機",
      "communicationStyle": "コミュニケーションスタイル"
    }
  ]
}`;
  }

  private buildRefinePrompt(persona: GeneratedPersona, productInfo: ProductInfo): string {
    return `
以下のペルソナをより詳細に分析し、追加情報を加えてください。

商品情報:
- 商品名: ${productInfo.name}
- カテゴリー: ${productInfo.category}
- 特徴: ${productInfo.features.join(', ')}

現在のペルソナ:
- ペルソナ名: ${persona.name}
- 年齢範囲: ${persona.ageRange}
- 性別: ${persona.gender}
- 職業: ${persona.occupation}
- 興味・関心: ${persona.interests.join(', ')}
- 課題・悩み: ${persona.painPoints.join(', ')}
- 購買動機: ${persona.buyingMotivation}

興味・関心を5項目に、課題・悩みを4項目に拡張し、より具体的な情報を追加してください。

必ず以下のJSON形式で出力してください:
{
  "name": "ペルソナ名",
  "ageRange": "年齢範囲",
  "gender": "性別",
  "occupation": "職業",
  "incomeLevel": "年収レベル",
  "interests": ["興味1", "興味2", "興味3", "興味4", "興味5"],
  "painPoints": ["課題1", "課題2", "課題3", "課題4"],
  "buyingMotivation": "購買動機",
  "communicationStyle": "コミュニケーションスタイル"
}`;
  }
}
