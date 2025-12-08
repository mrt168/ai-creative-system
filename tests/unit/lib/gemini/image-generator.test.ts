import {
  ImageGenerator,
  BannerGenerationInput,
  BannerGenerationResult,
} from '@/lib/gemini/image-generator';
import { GeminiClient, ImageResult } from '@/lib/gemini/client';
import { GeneratedPersona } from '@/lib/gemini/persona-analyzer';
import * as fs from 'fs/promises';
import path from 'path';

// Mock the GeminiClient and fs
jest.mock('@/lib/gemini/client');
jest.mock('fs/promises');

describe('ImageGenerator', () => {
  let generator: ImageGenerator;
  let mockClient: jest.Mocked<GeminiClient>;
  const mockFs = fs as jest.Mocked<typeof fs>;

  const samplePersona: GeneratedPersona = {
    name: '美意識高め30代OL',
    ageRange: '30-35',
    gender: '女性',
    occupation: '会社員（事務職）',
    incomeLevel: '年収400-500万円',
    interests: ['スキンケア', 'ヨガ', 'オーガニック食品'],
    painPoints: ['乾燥肌', 'シワが気になり始めた', '化粧ノリが悪い'],
    buyingMotivation: '同僚に肌がキレイと言われたい',
    communicationStyle: '科学的根拠を重視、SNSの口コミを参考にする',
  };

  const sampleProductInfo = {
    name: 'スキンケアクリーム',
    category: '美容・コスメ',
    features: ['保湿', 'エイジングケア', '敏感肌対応'],
  };

  const sampleInput: BannerGenerationInput = {
    persona: samplePersona,
    productInfo: sampleProductInfo,
    aspectRatio: '16:9',
    size: '1080p',
    style: 'professional',
  };

  const mockImageResult: ImageResult = {
    mimeType: 'image/png',
    data: 'base64encodedimagedata',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      generateText: jest.fn(),
      generateJSON: jest.fn(),
      generateImage: jest.fn(),
    } as unknown as jest.Mocked<GeminiClient>;
    generator = new ImageGenerator(mockClient, '/tmp/generated');

    // Default mock implementations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.access.mockRejectedValue(new Error('Not found')); // File doesn't exist by default
  });

  describe('generateBanner', () => {
    it('should generate a banner image and save to disk', async () => {
      mockClient.generateImage.mockResolvedValue(mockImageResult);

      const result = await generator.generateBanner(sampleInput);

      expect(result.success).toBe(true);
      expect(result.imagePath).toContain('.png');
      expect(mockClient.generateImage).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('should build correct prompt from input', async () => {
      mockClient.generateImage.mockResolvedValue(mockImageResult);

      await generator.generateBanner(sampleInput);

      const promptArg = mockClient.generateImage.mock.calls[0][0];

      expect(promptArg).toContain('スキンケアクリーム');
      expect(promptArg).toContain('美容・コスメ');
      expect(promptArg).toContain('美意識高め30代OL');
      expect(promptArg).toContain('30-35');
      expect(promptArg).toContain('professional');
      expect(promptArg).toContain('16:9');
    });

    it('should pass correct options to client', async () => {
      mockClient.generateImage.mockResolvedValue(mockImageResult);

      await generator.generateBanner(sampleInput);

      const optionsArg = mockClient.generateImage.mock.calls[0][1];

      expect(optionsArg).toEqual({
        aspectRatio: '16:9',
        size: '1080p',
      });
    });

    it('should return error result when image generation fails', async () => {
      mockClient.generateImage.mockResolvedValue(null);

      const result = await generator.generateBanner(sampleInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate image');
      expect(result.imagePath).toBeUndefined();
    });

    it('should return error result when API throws', async () => {
      mockClient.generateImage.mockRejectedValue(new Error('API Error'));

      const result = await generator.generateBanner(sampleInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should create output directory if it does not exist', async () => {
      mockClient.generateImage.mockResolvedValue(mockImageResult);

      await generator.generateBanner(sampleInput);

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });
  });

  describe('generateBannerBatch', () => {
    it('should generate multiple banners', async () => {
      mockClient.generateImage.mockResolvedValue(mockImageResult);

      const inputs: BannerGenerationInput[] = [
        { ...sampleInput, aspectRatio: '16:9' },
        { ...sampleInput, aspectRatio: '1:1' },
        { ...sampleInput, aspectRatio: '9:16' },
      ];

      const results = await generator.generateBannerBatch(inputs);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should continue generating even if some fail', async () => {
      mockClient.generateImage
        .mockResolvedValueOnce(mockImageResult)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockImageResult);

      const inputs: BannerGenerationInput[] = [
        { ...sampleInput, aspectRatio: '16:9' },
        { ...sampleInput, aspectRatio: '1:1' },
        { ...sampleInput, aspectRatio: '9:16' },
      ];

      const results = await generator.generateBannerBatch(inputs);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it('should respect concurrency limit', async () => {
      let concurrentCalls = 0;
      let maxConcurrent = 0;

      mockClient.generateImage.mockImplementation(async () => {
        concurrentCalls++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCalls);
        await new Promise((resolve) => setTimeout(resolve, 10));
        concurrentCalls--;
        return mockImageResult;
      });

      const inputs = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...sampleInput,
          aspectRatio: '16:9' as const,
        }));

      await generator.generateBannerBatch(inputs, { concurrency: 3 });

      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });
  });

  describe('getImagePath', () => {
    it('should generate unique file paths', async () => {
      mockClient.generateImage.mockResolvedValue(mockImageResult);

      const result1 = await generator.generateBanner(sampleInput);
      const result2 = await generator.generateBanner(sampleInput);

      expect(result1.imagePath).not.toBe(result2.imagePath);
    });

    it('should use correct file extension based on mime type', async () => {
      const jpegResult: ImageResult = {
        mimeType: 'image/jpeg',
        data: 'base64data',
      };
      mockClient.generateImage.mockResolvedValue(jpegResult);

      const result = await generator.generateBanner(sampleInput);

      expect(result.imagePath).toContain('.jpg');
    });
  });

  describe('validateInput', () => {
    it('should throw error for invalid aspect ratio', async () => {
      const invalidInput = {
        ...sampleInput,
        aspectRatio: 'invalid' as any,
      };

      const result = await generator.generateBanner(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain('aspect ratio');
    });

    it('should throw error for invalid size', async () => {
      const invalidInput = {
        ...sampleInput,
        size: 'invalid' as any,
      };

      const result = await generator.generateBanner(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain('size');
    });
  });
});
