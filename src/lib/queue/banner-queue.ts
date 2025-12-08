import { randomUUID } from 'crypto';
import { ImageGenerator, BannerGenerationInput } from '../gemini/image-generator';
import { BannerRepository, PersonaRepository } from '../supabase/repositories';
import { buildBannerPrompt } from '../utils/prompts';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface GenerationJob {
  id: string;
  projectId: string;
  personaIds: string[];
  productInfo: {
    name: string;
    category: string;
    features: string[];
  };
  settings: {
    aspectRatios: ('1:1' | '16:9' | '9:16' | '4:5')[];
    size: '4K' | '2K' | '1080p';
    count: number;
    style: 'professional' | 'casual' | 'minimal' | 'bold';
  };
  status: JobStatus;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface JobInput {
  projectId: string;
  personaIds: string[];
  productInfo: {
    name: string;
    category: string;
    features: string[];
  };
  settings: {
    aspectRatios: ('1:1' | '16:9' | '9:16' | '4:5')[];
    size: '4K' | '2K' | '1080p';
    count: number;
    style: 'professional' | 'casual' | 'minimal' | 'bold';
  };
}

export class BannerGenerationQueue {
  private jobs: Map<string, GenerationJob> = new Map();
  private cancelledJobs: Set<string> = new Set();

  constructor(
    private imageGenerator: ImageGenerator,
    private bannerRepository: BannerRepository,
    private personaRepository: PersonaRepository
  ) {}

  async addJob(input: JobInput): Promise<string> {
    const id = randomUUID();
    const totalBanners =
      input.personaIds.length *
      input.settings.aspectRatios.length *
      input.settings.count;

    const job: GenerationJob = {
      id,
      projectId: input.projectId,
      personaIds: input.personaIds,
      productInfo: input.productInfo,
      settings: input.settings,
      status: 'pending',
      progress: {
        total: totalBanners,
        completed: 0,
        failed: 0,
      },
      createdAt: new Date(),
    };

    this.jobs.set(id, job);

    // Start processing asynchronously (don't await - let it run in background)
    // Note: In serverless environments, this may not complete if the request ends
    this.processJob(id).catch((error) => {
      console.error(`Error processing job ${id}:`, error);
    });

    return id;
  }

  async getJob(jobId: string): Promise<GenerationJob | null> {
    return this.jobs.get(jobId) ?? null;
  }

  async getAllJobs(projectId: string): Promise<GenerationJob[]> {
    const jobs: GenerationJob[] = [];
    for (const job of this.jobs.values()) {
      if (job.projectId === projectId) {
        jobs.push(job);
      }
    }
    return jobs;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    this.cancelledJobs.add(jobId);
    job.status = 'cancelled';
    return true;
  }

  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.startedAt = new Date();

    try {
      for (const personaId of job.personaIds) {
        if (this.cancelledJobs.has(jobId)) {
          return;
        }

        const persona = await this.personaRepository.findById(personaId);
        if (!persona) {
          job.status = 'failed';
          job.error = `Persona not found: ${personaId}`;
          return;
        }

        for (const aspectRatio of job.settings.aspectRatios) {
          for (let i = 0; i < job.settings.count; i++) {
            if (this.cancelledJobs.has(jobId)) {
              return;
            }

            await this.generateSingleBanner(job, persona, aspectRatio);
          }
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private async generateSingleBanner(
    job: GenerationJob,
    persona: any,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:5'
  ): Promise<void> {
    // Create banner record in pending status
    const prompt = buildBannerPrompt({
      productName: job.productInfo.name,
      category: job.productInfo.category,
      features: job.productInfo.features,
      personaName: persona.name,
      ageRange: persona.ageRange || '',
      buyingMotivation: persona.buyingMotivation || '',
      communicationStyle: persona.communicationStyle || '',
      style: job.settings.style,
      aspectRatio,
    });

    const banner = await this.bannerRepository.create({
      projectId: job.projectId,
      personaId: persona.id,
      prompt,
      aspectRatio,
      size: job.settings.size,
    });

    // Update banner to generating status
    await this.bannerRepository.update(banner.id, {
      status: 'generating',
      generationStartedAt: new Date(),
    });

    // Generate the image
    const result = await this.imageGenerator.generateBanner({
      persona: {
        name: persona.name,
        ageRange: persona.ageRange || '',
        gender: persona.gender || '',
        occupation: persona.occupation || '',
        interests: persona.interests || [],
        painPoints: persona.painPoints || [],
        buyingMotivation: persona.buyingMotivation || '',
        communicationStyle: persona.communicationStyle,
      },
      productInfo: job.productInfo,
      aspectRatio,
      size: job.settings.size,
      style: job.settings.style,
    });

    if (result.success && result.imagePath) {
      await this.bannerRepository.update(banner.id, {
        status: 'completed',
        imagePath: result.imagePath,
        generationCompletedAt: new Date(),
      });
      job.progress.completed++;
    } else {
      await this.bannerRepository.update(banner.id, {
        status: 'failed',
        errorMessage: result.error || 'Unknown error',
      });
      job.progress.failed++;
    }
  }
}
