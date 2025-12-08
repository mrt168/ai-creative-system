import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository, BannerRepository, PersonaRepository } from '@/lib/supabase/repositories';
import { getGeminiClient } from '@/lib/gemini/client';
import { ImageGenerator } from '@/lib/gemini/image-generator';
import { BannerGenerationQueue } from '@/lib/queue/banner-queue';
import { ApiResponse } from '@/types/api';
import path from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Singleton queue instance
let queueInstance: BannerGenerationQueue | null = null;

function getQueue(): BannerGenerationQueue {
  if (!queueInstance) {
    const client = getGeminiClient();
    const outputDir = path.join(process.cwd(), 'public', 'generated');
    const imageGenerator = new ImageGenerator(client, outputDir);
    const bannerRepository = new BannerRepository();
    const personaRepository = new PersonaRepository();

    queueInstance = new BannerGenerationQueue(
      imageGenerator,
      bannerRepository,
      personaRepository
    );
  }
  return queueInstance;
}

// POST /api/projects/:id/banners/generate - Start banner generation job
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.personaIds || !Array.isArray(body.personaIds) || body.personaIds.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'At least one persona ID is required',
        },
        { status: 400 }
      );
    }

    if (!body.settings) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Generation settings are required',
        },
        { status: 400 }
      );
    }

    const { settings, productInfo } = body;

    // Validate settings
    if (!settings.aspectRatios || settings.aspectRatios.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'At least one aspect ratio is required',
        },
        { status: 400 }
      );
    }

    const projectRepository = new ProjectRepository();

    // Verify project exists
    const project = await projectRepository.findById(id);
    if (!project) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Calculate total banners
    const totalBanners =
      body.personaIds.length *
      settings.aspectRatios.length *
      (settings.count || 1);

    // Add job to queue
    const queue = getQueue();
    const jobId = await queue.addJob({
      projectId: id,
      personaIds: body.personaIds,
      productInfo: productInfo || {
        name: project.productName || project.name,
        category: project.productCategory || '',
        features: [],
      },
      settings: {
        aspectRatios: settings.aspectRatios,
        size: settings.size || '1080p',
        count: settings.count || 1,
        style: settings.style || 'professional',
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        jobId,
        totalBanners,
        message: 'Banner generation started. Check progress with the job ID.',
      },
    });
  } catch (error) {
    console.error('Error starting banner generation:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to start banner generation',
      },
      { status: 500 }
    );
  }
}
