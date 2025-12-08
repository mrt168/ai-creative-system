import {
  BannerGenerationQueue,
  GenerationJob,
  JobStatus,
} from '@/lib/queue/banner-queue';
import { ImageGenerator, BannerGenerationResult } from '@/lib/gemini/image-generator';
import { BannerRepository } from '@/lib/db/repositories/banner';
import { PersonaRepository } from '@/lib/db/repositories/persona';

// Mock dependencies
jest.mock('@/lib/gemini/image-generator');
jest.mock('@/lib/db/repositories/banner');
jest.mock('@/lib/db/repositories/persona');

describe('BannerGenerationQueue', () => {
  let queue: BannerGenerationQueue;
  let mockImageGenerator: jest.Mocked<ImageGenerator>;
  let mockBannerRepository: jest.Mocked<BannerRepository>;
  let mockPersonaRepository: jest.Mocked<PersonaRepository>;

  const samplePersona = {
    id: 'persona-1',
    projectId: 'project-1',
    name: 'Test Persona',
    ageRange: '30-40',
    gender: '女性',
    occupation: '会社員',
    interests: ['スキンケア'],
    painPoints: ['乾燥肌'],
    buyingMotivation: '美しくなりたい',
    communicationStyle: 'SNS重視',
    createdAt: new Date(),
  };

  const sampleProductInfo = {
    name: 'スキンケアクリーム',
    category: '美容・コスメ',
    features: ['保湿', 'エイジングケア'],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockImageGenerator = {
      generateBanner: jest.fn(),
      generateBannerBatch: jest.fn(),
    } as unknown as jest.Mocked<ImageGenerator>;

    mockBannerRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<BannerRepository>;

    mockPersonaRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<PersonaRepository>;

    queue = new BannerGenerationQueue(
      mockImageGenerator,
      mockBannerRepository,
      mockPersonaRepository
    );
  });

  describe('addJob', () => {
    it('should add a new job to the queue', async () => {
      const jobInput = {
        projectId: 'project-1',
        personaIds: ['persona-1'],
        productInfo: sampleProductInfo,
        settings: {
          aspectRatios: ['16:9' as const],
          size: '1080p' as const,
          count: 1,
          style: 'professional' as const,
        },
      };

      const jobId = await queue.addJob(jobInput);

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
    });

    it('should calculate correct total banners', async () => {
      const jobInput = {
        projectId: 'project-1',
        personaIds: ['persona-1', 'persona-2'],
        productInfo: sampleProductInfo,
        settings: {
          aspectRatios: ['16:9' as const, '1:1' as const],
          size: '1080p' as const,
          count: 3,
          style: 'professional' as const,
        },
      };

      const jobId = await queue.addJob(jobInput);
      const job = await queue.getJob(jobId);

      // 2 personas × 2 aspect ratios × 3 count = 12
      expect(job?.progress.total).toBe(12);
    });
  });

  describe('getJob', () => {
    it('should return job by id', async () => {
      const jobInput = {
        projectId: 'project-1',
        personaIds: ['persona-1'],
        productInfo: sampleProductInfo,
        settings: {
          aspectRatios: ['16:9' as const],
          size: '1080p' as const,
          count: 1,
          style: 'professional' as const,
        },
      };

      const jobId = await queue.addJob(jobInput);
      const job = await queue.getJob(jobId);

      expect(job).toBeDefined();
      expect(job?.id).toBe(jobId);
      expect(job?.projectId).toBe('project-1');
    });

    it('should return null for non-existent job', async () => {
      const job = await queue.getJob('non-existent');
      expect(job).toBeNull();
    });
  });

  describe('processJob', () => {
    it('should process job and generate banners', async () => {
      mockPersonaRepository.findById.mockResolvedValue(samplePersona as any);
      mockImageGenerator.generateBanner.mockResolvedValue({
        success: true,
        imagePath: '/generated/banner.png',
      });
      mockBannerRepository.create.mockResolvedValue({
        id: 'banner-1',
        projectId: 'project-1',
        personaId: 'persona-1',
        prompt: 'test',
        aspectRatio: '16:9',
        size: '1080p',
        status: 'pending',
        imagePath: null,
        metaAdId: null,
        errorMessage: null,
        generationStartedAt: null,
        generationCompletedAt: null,
        createdAt: new Date(),
      });
      mockBannerRepository.update.mockResolvedValue({} as any);

      const jobInput = {
        projectId: 'project-1',
        personaIds: ['persona-1'],
        productInfo: sampleProductInfo,
        settings: {
          aspectRatios: ['16:9' as const],
          size: '1080p' as const,
          count: 1,
          style: 'professional' as const,
        },
      };

      const jobId = await queue.addJob(jobInput);

      // Wait for job to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const job = await queue.getJob(jobId);
      expect(job?.status).toBe('completed');
      expect(job?.progress.completed).toBe(1);
    });

    it('should update progress during processing', async () => {
      mockPersonaRepository.findById.mockResolvedValue(samplePersona as any);
      mockImageGenerator.generateBanner.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, imagePath: '/generated/banner.png' };
      });
      mockBannerRepository.create.mockResolvedValue({
        id: 'banner-1',
        projectId: 'project-1',
        personaId: 'persona-1',
        prompt: 'test',
        aspectRatio: '16:9',
        size: '1080p',
        status: 'pending',
        imagePath: null,
        metaAdId: null,
        errorMessage: null,
        generationStartedAt: null,
        generationCompletedAt: null,
        createdAt: new Date(),
      });
      mockBannerRepository.update.mockResolvedValue({} as any);

      const jobInput = {
        projectId: 'project-1',
        personaIds: ['persona-1'],
        productInfo: sampleProductInfo,
        settings: {
          aspectRatios: ['16:9' as const, '1:1' as const],
          size: '1080p' as const,
          count: 2,
          style: 'professional' as const,
        },
      };

      const jobId = await queue.addJob(jobInput);

      // Wait for job to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      const job = await queue.getJob(jobId);
      expect(job?.progress.completed).toBeGreaterThan(0);
    });

    it('should handle failed banner generation', async () => {
      mockPersonaRepository.findById.mockResolvedValue(samplePersona as any);
      mockImageGenerator.generateBanner.mockResolvedValue({
        success: false,
        error: 'Generation failed',
      });
      mockBannerRepository.create.mockResolvedValue({
        id: 'banner-1',
        projectId: 'project-1',
        personaId: 'persona-1',
        prompt: 'test',
        aspectRatio: '16:9',
        size: '1080p',
        status: 'pending',
        imagePath: null,
        metaAdId: null,
        errorMessage: null,
        generationStartedAt: null,
        generationCompletedAt: null,
        createdAt: new Date(),
      });
      mockBannerRepository.update.mockResolvedValue({} as any);

      const jobInput = {
        projectId: 'project-1',
        personaIds: ['persona-1'],
        productInfo: sampleProductInfo,
        settings: {
          aspectRatios: ['16:9' as const],
          size: '1080p' as const,
          count: 1,
          style: 'professional' as const,
        },
      };

      const jobId = await queue.addJob(jobInput);

      // Wait for job to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const job = await queue.getJob(jobId);
      expect(job?.progress.failed).toBe(1);
    });

    it('should mark job as failed if persona not found', async () => {
      mockPersonaRepository.findById.mockResolvedValue(null);

      const jobInput = {
        projectId: 'project-1',
        personaIds: ['non-existent'],
        productInfo: sampleProductInfo,
        settings: {
          aspectRatios: ['16:9' as const],
          size: '1080p' as const,
          count: 1,
          style: 'professional' as const,
        },
      };

      const jobId = await queue.addJob(jobInput);

      // Wait for job processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      const job = await queue.getJob(jobId);
      expect(job?.status).toBe('failed');
    });
  });

  describe('cancelJob', () => {
    it('should cancel a pending job', async () => {
      const jobInput = {
        projectId: 'project-1',
        personaIds: ['persona-1'],
        productInfo: sampleProductInfo,
        settings: {
          aspectRatios: ['16:9' as const],
          size: '1080p' as const,
          count: 1,
          style: 'professional' as const,
        },
      };

      // Don't start processing
      mockPersonaRepository.findById.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return samplePersona as any;
      });

      const jobId = await queue.addJob(jobInput);
      const cancelled = await queue.cancelJob(jobId);

      expect(cancelled).toBe(true);

      const job = await queue.getJob(jobId);
      expect(job?.status).toBe('cancelled');
    });

    it('should return false for non-existent job', async () => {
      const cancelled = await queue.cancelJob('non-existent');
      expect(cancelled).toBe(false);
    });
  });

  describe('getAllJobs', () => {
    it('should return all jobs for a project', async () => {
      mockPersonaRepository.findById.mockResolvedValue(samplePersona as any);
      mockImageGenerator.generateBanner.mockResolvedValue({
        success: true,
        imagePath: '/generated/banner.png',
      });
      mockBannerRepository.create.mockResolvedValue({} as any);
      mockBannerRepository.update.mockResolvedValue({} as any);

      const jobInput1 = {
        projectId: 'project-1',
        personaIds: ['persona-1'],
        productInfo: sampleProductInfo,
        settings: {
          aspectRatios: ['16:9' as const],
          size: '1080p' as const,
          count: 1,
          style: 'professional' as const,
        },
      };

      const jobInput2 = {
        projectId: 'project-1',
        personaIds: ['persona-1'],
        productInfo: sampleProductInfo,
        settings: {
          aspectRatios: ['1:1' as const],
          size: '2K' as const,
          count: 1,
          style: 'casual' as const,
        },
      };

      await queue.addJob(jobInput1);
      await queue.addJob(jobInput2);

      const jobs = await queue.getAllJobs('project-1');

      expect(jobs.length).toBe(2);
    });

    it('should return empty array if no jobs exist', async () => {
      const jobs = await queue.getAllJobs('project-1');
      expect(jobs).toEqual([]);
    });
  });
});
