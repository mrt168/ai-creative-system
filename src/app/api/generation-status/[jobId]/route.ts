import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { BannerRepository } from '@/lib/db/repositories/banner';
import { PersonaRepository } from '@/lib/db/repositories/persona';
import { getGeminiClient } from '@/lib/gemini/client';
import { ImageGenerator } from '@/lib/gemini/image-generator';
import { BannerGenerationQueue } from '@/lib/queue/banner-queue';
import { ApiResponse } from '@/types/api';
import path from 'path';

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

// Singleton queue instance (shared with generate route)
let queueInstance: BannerGenerationQueue | null = null;

function getQueue(): BannerGenerationQueue {
  if (!queueInstance) {
    const db = getDb();
    const client = getGeminiClient();
    const outputDir = path.join(process.cwd(), 'public', 'generated');
    const imageGenerator = new ImageGenerator(client, outputDir);
    const bannerRepository = new BannerRepository(db);
    const personaRepository = new PersonaRepository(db);

    queueInstance = new BannerGenerationQueue(
      imageGenerator,
      bannerRepository,
      personaRepository
    );
  }
  return queueInstance;
}

// GET /api/generation-status/:jobId - Get generation job status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params;
    const queue = getQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
      },
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch job status',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/generation-status/:jobId - Cancel a generation job
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params;
    const queue = getQueue();
    const cancelled = await queue.cancelJob(jobId);

    if (!cancelled) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Job not found or already completed',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        cancelled: true,
        message: 'Job cancelled successfully',
      },
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to cancel job',
      },
      { status: 500 }
    );
  }
}
