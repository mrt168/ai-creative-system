import { GeminiClient, GeminiClientConfig } from '@/lib/gemini/client';

// Mock the @google/genai module
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: jest.fn(),
      },
    })),
  };
});

describe('GeminiClient', () => {
  let client: GeminiClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    client = new GeminiClient({ apiKey: mockApiKey });
  });

  describe('constructor', () => {
    it('should create a client with API key', () => {
      expect(client).toBeInstanceOf(GeminiClient);
    });

    it('should throw error if API key is not provided', () => {
      expect(() => new GeminiClient({ apiKey: '' })).toThrow('API key is required');
    });
  });

  describe('generateText', () => {
    it('should generate text response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Generated text response' }],
            },
          },
        ],
      };

      const { GoogleGenAI } = require('@google/genai');
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockResolvedValue(mockResponse),
        },
      }));

      const newClient = new GeminiClient({ apiKey: mockApiKey });
      const result = await newClient.generateText('Test prompt');

      expect(result).toBe('Generated text response');
    });

    it('should return empty string if no text in response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [],
            },
          },
        ],
      };

      const { GoogleGenAI } = require('@google/genai');
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockResolvedValue(mockResponse),
        },
      }));

      const newClient = new GeminiClient({ apiKey: mockApiKey });
      const result = await newClient.generateText('Test prompt');

      expect(result).toBe('');
    });
  });

  describe('generateJSON', () => {
    it('should generate and parse JSON response', async () => {
      const expectedJson = {
        personas: [
          { name: 'Test Persona', age: '30-40' },
        ],
      };
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(expectedJson) }],
            },
          },
        ],
      };

      const { GoogleGenAI } = require('@google/genai');
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockResolvedValue(mockResponse),
        },
      }));

      const newClient = new GeminiClient({ apiKey: mockApiKey });
      const result = await newClient.generateJSON('Generate personas');

      expect(result).toEqual(expectedJson);
    });

    it('should handle JSON with markdown code block', async () => {
      const expectedJson = { test: 'value' };
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '```json\n' + JSON.stringify(expectedJson) + '\n```' }],
            },
          },
        ],
      };

      const { GoogleGenAI } = require('@google/genai');
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockResolvedValue(mockResponse),
        },
      }));

      const newClient = new GeminiClient({ apiKey: mockApiKey });
      const result = await newClient.generateJSON('Test prompt');

      expect(result).toEqual(expectedJson);
    });

    it('should throw error for invalid JSON response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Not valid JSON' }],
            },
          },
        ],
      };

      const { GoogleGenAI } = require('@google/genai');
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockResolvedValue(mockResponse),
        },
      }));

      const newClient = new GeminiClient({ apiKey: mockApiKey });

      await expect(newClient.generateJSON('Test prompt')).rejects.toThrow(
        'Failed to parse JSON response'
      );
    });
  });

  describe('generateImage', () => {
    it('should generate image and return base64 data', async () => {
      const mockImageData = 'base64encodedimagedata';
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: mockImageData,
                  },
                },
              ],
            },
          },
        ],
      };

      const { GoogleGenAI } = require('@google/genai');
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockResolvedValue(mockResponse),
        },
      }));

      const newClient = new GeminiClient({ apiKey: mockApiKey });
      const result = await newClient.generateImage('Generate banner image', {
        aspectRatio: '16:9',
        size: '1080p',
      });

      expect(result).toEqual({
        mimeType: 'image/png',
        data: mockImageData,
      });
    });

    it('should return null if no image in response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'No image generated' }],
            },
          },
        ],
      };

      const { GoogleGenAI } = require('@google/genai');
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockResolvedValue(mockResponse),
        },
      }));

      const newClient = new GeminiClient({ apiKey: mockApiKey });
      const result = await newClient.generateImage('Test prompt', {
        aspectRatio: '1:1',
        size: '2K',
      });

      expect(result).toBeNull();
    });

    it('should handle multiple images and return the first one', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'first-image',
                  },
                },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'second-image',
                  },
                },
              ],
            },
          },
        ],
      };

      const { GoogleGenAI } = require('@google/genai');
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockResolvedValue(mockResponse),
        },
      }));

      const newClient = new GeminiClient({ apiKey: mockApiKey });
      const result = await newClient.generateImage('Test prompt', {
        aspectRatio: '16:9',
        size: '4K',
      });

      expect(result?.data).toBe('first-image');
    });
  });

  describe('error handling', () => {
    it('should throw error when API call fails', async () => {
      const { GoogleGenAI } = require('@google/genai');
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockRejectedValue(new Error('API Error')),
        },
      }));

      const newClient = new GeminiClient({ apiKey: mockApiKey });

      await expect(newClient.generateText('Test prompt')).rejects.toThrow('API Error');
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      const { GoogleGenAI } = require('@google/genai');
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockRejectedValue(rateLimitError),
        },
      }));

      const newClient = new GeminiClient({ apiKey: mockApiKey });

      await expect(newClient.generateText('Test prompt')).rejects.toThrow('Rate limit exceeded');
    });
  });
});
