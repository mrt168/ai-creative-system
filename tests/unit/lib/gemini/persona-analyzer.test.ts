import { PersonaAnalyzer, ProductInfo, GeneratedPersona } from '@/lib/gemini/persona-analyzer';
import { GeminiClient } from '@/lib/gemini/client';

// Mock the GeminiClient
jest.mock('@/lib/gemini/client');

describe('PersonaAnalyzer', () => {
  let analyzer: PersonaAnalyzer;
  let mockClient: jest.Mocked<GeminiClient>;

  const sampleProductInfo: ProductInfo = {
    name: 'スキンケアクリーム',
    category: '美容・コスメ',
    features: ['保湿', 'エイジングケア', '敏感肌対応'],
    targetAge: '30-40代',
    targetGender: '女性',
  };

  const sampleGeneratedPersonas: GeneratedPersona[] = [
    {
      name: '美意識高め30代OL',
      ageRange: '30-35',
      gender: '女性',
      occupation: '会社員（事務職）',
      incomeLevel: '年収400-500万円',
      interests: ['スキンケア', 'ヨガ', 'オーガニック食品'],
      painPoints: ['乾燥肌', 'シワが気になり始めた', '化粧ノリが悪い'],
      buyingMotivation: '同僚に肌がキレイと言われたい',
      communicationStyle: '科学的根拠を重視、SNSの口コミを参考にする',
    },
    {
      name: 'エレガント主婦',
      ageRange: '40-45',
      gender: '女性',
      occupation: '専業主婦',
      incomeLevel: '世帯年収800万円以上',
      interests: ['料理', 'ガーデニング', 'エステ'],
      painPoints: ['たるみ', 'くすみ', '若い頃の肌に戻りたい'],
      buyingMotivation: '夫に「いつまでもキレイだね」と言われたい',
      communicationStyle: '高級感を重視、ブランドの信頼性を確認',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      generateText: jest.fn(),
      generateJSON: jest.fn(),
      generateImage: jest.fn(),
    } as unknown as jest.Mocked<GeminiClient>;
    analyzer = new PersonaAnalyzer(mockClient);
  });

  describe('analyzeProduct', () => {
    it('should generate personas from product info', async () => {
      mockClient.generateJSON.mockResolvedValue({
        personas: sampleGeneratedPersonas,
      });

      const result = await analyzer.analyzeProduct(sampleProductInfo);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('美意識高め30代OL');
      expect(result[1].name).toBe('エレガント主婦');
    });

    it('should pass correct prompt to client', async () => {
      mockClient.generateJSON.mockResolvedValue({
        personas: sampleGeneratedPersonas,
      });

      await analyzer.analyzeProduct(sampleProductInfo);

      expect(mockClient.generateJSON).toHaveBeenCalledTimes(1);
      const prompt = mockClient.generateJSON.mock.calls[0][0];

      expect(prompt).toContain('スキンケアクリーム');
      expect(prompt).toContain('美容・コスメ');
      expect(prompt).toContain('保湿');
      expect(prompt).toContain('30-40代');
      expect(prompt).toContain('女性');
    });

    it('should validate generated personas have required fields', async () => {
      mockClient.generateJSON.mockResolvedValue({
        personas: sampleGeneratedPersonas,
      });

      const result = await analyzer.analyzeProduct(sampleProductInfo);

      result.forEach((persona) => {
        expect(persona).toHaveProperty('name');
        expect(persona).toHaveProperty('ageRange');
        expect(persona).toHaveProperty('gender');
        expect(persona).toHaveProperty('occupation');
        expect(persona).toHaveProperty('interests');
        expect(persona).toHaveProperty('painPoints');
        expect(persona).toHaveProperty('buyingMotivation');
      });
    });

    it('should handle empty personas response', async () => {
      mockClient.generateJSON.mockResolvedValue({
        personas: [],
      });

      const result = await analyzer.analyzeProduct(sampleProductInfo);

      expect(result).toHaveLength(0);
    });

    it('should throw error when API fails', async () => {
      mockClient.generateJSON.mockRejectedValue(new Error('API Error'));

      await expect(analyzer.analyzeProduct(sampleProductInfo)).rejects.toThrow('API Error');
    });
  });

  describe('generatePersonaCount', () => {
    it('should generate specified number of personas', async () => {
      const threePersonas = [
        ...sampleGeneratedPersonas,
        {
          name: '健康志向ママ',
          ageRange: '35-40',
          gender: '女性',
          occupation: 'パート勤務',
          incomeLevel: '世帯年収600万円',
          interests: ['子育て', '健康食品', 'ジム'],
          painPoints: ['忙しくてスキンケアの時間がない', '肌荒れしやすい'],
          buyingMotivation: '子どもに「ママきれい」と言われたい',
          communicationStyle: '時短・効率を重視',
        },
      ];

      mockClient.generateJSON.mockResolvedValue({
        personas: threePersonas,
      });

      const result = await analyzer.analyzeProduct(sampleProductInfo, { count: 3 });

      expect(result).toHaveLength(3);
    });
  });

  describe('refinePersona', () => {
    it('should refine existing persona with additional details', async () => {
      const refinedPersona = {
        ...sampleGeneratedPersonas[0],
        interests: ['スキンケア', 'ヨガ', 'オーガニック食品', 'カフェ巡り', '読書'],
        painPoints: ['乾燥肌', 'シワが気になり始めた', '化粧ノリが悪い', '仕事のストレス'],
      };

      mockClient.generateJSON.mockResolvedValue(refinedPersona);

      const result = await analyzer.refinePersona(
        sampleGeneratedPersonas[0],
        sampleProductInfo
      );

      expect(result.interests).toHaveLength(5);
      expect(result.painPoints).toHaveLength(4);
    });
  });

  describe('validateProductInfo', () => {
    it('should throw error for missing product name', async () => {
      const invalidProduct = {
        ...sampleProductInfo,
        name: '',
      };

      await expect(analyzer.analyzeProduct(invalidProduct)).rejects.toThrow(
        'Product name is required'
      );
    });

    it('should throw error for missing category', async () => {
      const invalidProduct = {
        ...sampleProductInfo,
        category: '',
      };

      await expect(analyzer.analyzeProduct(invalidProduct)).rejects.toThrow(
        'Product category is required'
      );
    });
  });
});
