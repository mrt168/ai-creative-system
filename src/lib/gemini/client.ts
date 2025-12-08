import { GoogleGenAI } from '@google/genai';

export interface GeminiClientConfig {
  apiKey: string;
}

export interface ImageGenerationOptions {
  aspectRatio: string;
  size: string;
}

export interface ImageResult {
  mimeType: string;
  data: string;
}

export class GeminiClient {
  private client: GoogleGenAI;

  constructor(config: GeminiClientConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const textParts = response.candidates?.[0]?.content?.parts?.filter(
      (part: any) => part.text
    );

    if (!textParts || textParts.length === 0) {
      return '';
    }

    return textParts[0].text || '';
  }

  async generateJSON<T = unknown>(prompt: string): Promise<T> {
    const text = await this.generateText(prompt);

    // Handle markdown code blocks
    let jsonText = text;
    if (text.includes('```json')) {
      const match = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (match) {
        jsonText = match[1];
      }
    } else if (text.includes('```')) {
      const match = text.match(/```\n?([\s\S]*?)\n?```/);
      if (match) {
        jsonText = match[1];
      }
    }

    try {
      return JSON.parse(jsonText.trim());
    } catch {
      throw new Error('Failed to parse JSON response');
    }
  }

  async generateImage(
    prompt: string,
    options: ImageGenerationOptions
  ): Promise<ImageResult | null> {
    const response = await this.client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
      config: {
        responseModalities: ['image', 'text'],
      } as any,
    });

    const imageParts = response.candidates?.[0]?.content?.parts?.filter(
      (part: any) => part.inlineData
    );

    if (!imageParts || imageParts.length === 0) {
      return null;
    }

    const firstImage = imageParts[0].inlineData;
    if (!firstImage) {
      return null;
    }

    return {
      mimeType: firstImage.mimeType || 'image/png',
      data: firstImage.data || '',
    };
  }
}

// Singleton instance for server-side usage
let clientInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!clientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    clientInstance = new GeminiClient({ apiKey });
  }
  return clientInstance;
}
