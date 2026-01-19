import { GeminiClient, ImageResult } from './client';
import { GeneratedPersona } from './persona-analyzer';
import { buildBannerPrompt } from '../utils/prompts';
import { uploadImage, isServerlessEnvironment } from '../supabase/storage';
import * as fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface BannerGenerationInput {
  persona: GeneratedPersona;
  productInfo: {
    name: string;
    category: string;
    features: string[];
  };
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5';
  size: '4K' | '2K' | '1080p';
  style: 'professional' | 'casual' | 'minimal' | 'bold';
}

export interface BannerGenerationResult {
  success: boolean;
  imagePath?: string;
  error?: string;
}

export interface BatchOptions {
  concurrency?: number;
}

const VALID_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:5'];
const VALID_SIZES = ['4K', '2K', '1080p'];

export class ImageGenerator {
  constructor(
    private client: GeminiClient,
    private outputDir: string
  ) {}

  async generateBanner(input: BannerGenerationInput): Promise<BannerGenerationResult> {
    try {
      // Validate input
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Build prompt
      const prompt = buildBannerPrompt({
        productName: input.productInfo.name,
        category: input.productInfo.category,
        features: input.productInfo.features,
        personaName: input.persona.name,
        ageRange: input.persona.ageRange,
        buyingMotivation: input.persona.buyingMotivation,
        communicationStyle: input.persona.communicationStyle || '',
        style: input.style,
        aspectRatio: input.aspectRatio,
      });

      // Generate image
      const imageResult = await this.client.generateImage(prompt, {
        aspectRatio: input.aspectRatio,
        size: input.size,
      });

      if (!imageResult) {
        return { success: false, error: 'Failed to generate image' };
      }

      // Save image (to Supabase Storage in serverless, local filesystem otherwise)
      const imagePath = await this.saveImage(imageResult);

      return { success: true, imagePath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async generateBannerBatch(
    inputs: BannerGenerationInput[],
    options: BatchOptions = {}
  ): Promise<BannerGenerationResult[]> {
    const { concurrency = 3 } = options;
    const results: BannerGenerationResult[] = [];

    // Process in batches with concurrency limit
    for (let i = 0; i < inputs.length; i += concurrency) {
      const batch = inputs.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((input) => this.generateBanner(input))
      );
      results.push(...batchResults);
    }

    return results;
  }

  private validateInput(input: BannerGenerationInput): string | null {
    if (!VALID_ASPECT_RATIOS.includes(input.aspectRatio)) {
      return `Invalid aspect ratio: ${input.aspectRatio}. Valid values are: ${VALID_ASPECT_RATIOS.join(', ')}`;
    }

    if (!VALID_SIZES.includes(input.size)) {
      return `Invalid size: ${input.size}. Valid values are: ${VALID_SIZES.join(', ')}`;
    }

    return null;
  }

  private async saveImage(imageResult: ImageResult): Promise<string> {
    // Decode base64 to buffer
    const buffer = Buffer.from(imageResult.data, 'base64');

    // Check if running in serverless environment (Vercel)
    if (isServerlessEnvironment()) {
      // Upload to Supabase Storage
      const result = await uploadImage(buffer, imageResult.mimeType);
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Failed to upload to Supabase Storage');
      }
      return result.url;
    }

    // Local filesystem storage (for development)
    return this.saveToLocalFilesystem(buffer, imageResult.mimeType);
  }

  private async saveToLocalFilesystem(buffer: Buffer, mimeType: string): Promise<string> {
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    // Determine file extension
    const extension = this.getExtensionFromMimeType(mimeType);

    // Generate unique filename
    const filename = `banner_${randomUUID()}${extension}`;
    const filePath = path.join(this.outputDir, filename);

    // Write to file
    await fs.writeFile(filePath, buffer);

    // Return web-accessible path (relative to public folder)
    return `/generated/${filename}`;
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExtension: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };

    return mimeToExtension[mimeType] || '.png';
  }
}
