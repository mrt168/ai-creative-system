import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository, BannerRepository, StrategyPersonaRepository } from '@/lib/supabase/repositories';
import { getGeminiClient } from '@/lib/gemini/client';
import { ImageGenerator } from '@/lib/gemini/image-generator';
import {
  buildAutoCreativePrompt,
  buildAutoBannerPrompt,
  AutoCreativeInput,
  GeneratedCreative,
} from '@/lib/utils/prompts';
import { ApiResponse } from '@/types/api';
import path from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface TargetInput {
  name: string;
  gender: string;
  ageFrom: number;
  ageTo: number;
  issue: string;
}

interface AutoBannerRequestBody {
  targets: TargetInput[];
  funnel: 'awareness' | 'conversion';
  appealAxes: string[];
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5';
  size: '4K' | '2K' | '1080p';
}

interface GenerationResult {
  targetName: string;
  creative: GeneratedCreative;
  bannerPath?: string;
  strategyPersonaId?: string;
  error?: string;
}

// POST /api/projects/:id/auto-banner - Generate banners automatically from strategy design
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const body: AutoBannerRequestBody = await request.json();

    // Validate request body
    const validationError = validateRequestBody(body);
    if (validationError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Get project
    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Initialize services
    const geminiClient = getGeminiClient();
    const outputDir = path.join(process.cwd(), 'public', 'generated');
    const imageGenerator = new ImageGenerator(geminiClient, outputDir);
    const bannerRepository = new BannerRepository();
    const strategyPersonaRepository = new StrategyPersonaRepository();

    const results: GenerationResult[] = [];

    // Process each target
    for (const target of body.targets) {
      try {
        // 1. Generate creative using Gemini
        const creativeInput: AutoCreativeInput = {
          productName: project.productName || project.name,
          productCategory: project.productCategory || '',
          features: [], // Could be extracted from project.targetInfo if available
          funnel: body.funnel,
          appealAxes: body.appealAxes,
          target: {
            gender: target.gender,
            ageFrom: target.ageFrom,
            ageTo: target.ageTo,
            issue: target.issue,
          },
        };

        const creativePrompt = buildAutoCreativePrompt(creativeInput);
        const generatedCreative = await geminiClient.generateJSON<GeneratedCreative>(creativePrompt);

        // 2. Save strategy persona to DB
        const strategyPersona = await strategyPersonaRepository.create({
          projectId,
          name: target.name,
          gender: target.gender,
          ageFrom: target.ageFrom,
          ageTo: target.ageTo,
          issue: target.issue,
          funnel: body.funnel,
          appealAxes: body.appealAxes,
        });

        // 3. Build banner generation prompt
        const bannerPrompt = buildAutoBannerPrompt({
          catchCopy: generatedCreative.catchCopy,
          proof: generatedCreative.proof,
          cta: generatedCreative.cta,
          productName: project.productName || project.name,
          productCategory: project.productCategory || '',
          gender: target.gender,
          ageFrom: target.ageFrom,
          ageTo: target.ageTo,
          aspectRatio: body.aspectRatio,
          additionalPrompt: generatedCreative.prompt,
        });

        // 4. Create banner record in DB
        const banner = await bannerRepository.create({
          projectId,
          personaId: strategyPersona.id,
          prompt: bannerPrompt,
          aspectRatio: body.aspectRatio,
          size: body.size,
        });

        // 5. Update banner status to generating
        await bannerRepository.update(banner.id, {
          status: 'generating',
          generationStartedAt: new Date(),
        });

        // 6. Generate the banner image
        const generateResult = await imageGenerator.generateBanner({
          persona: {
            name: target.name,
            ageRange: `${target.ageFrom}-${target.ageTo}`,
            gender: target.gender,
            occupation: '',
            interests: [],
            painPoints: [target.issue],
            buyingMotivation: body.funnel === 'conversion' ? 'Purchase intent' : 'Brand awareness',
            communicationStyle: '',
          },
          productInfo: {
            name: project.productName || project.name,
            category: project.productCategory || '',
            features: [],
          },
          aspectRatio: body.aspectRatio,
          size: body.size,
          style: 'professional',
        });

        if (generateResult.success && generateResult.imagePath) {
          // Update banner with success
          await bannerRepository.update(banner.id, {
            status: 'completed',
            imagePath: generateResult.imagePath,
            generationCompletedAt: new Date(),
          });

          results.push({
            targetName: target.name,
            creative: generatedCreative,
            bannerPath: generateResult.imagePath,
            strategyPersonaId: strategyPersona.id,
          });
        } else {
          // Update banner with failure
          await bannerRepository.update(banner.id, {
            status: 'failed',
            errorMessage: generateResult.error || 'Failed to generate image',
          });

          results.push({
            targetName: target.name,
            creative: generatedCreative,
            strategyPersonaId: strategyPersona.id,
            error: generateResult.error || 'Failed to generate image',
          });
        }
      } catch (error) {
        results.push({
          targetName: target.name,
          creative: {
            catchCopy: '',
            proof: '',
            cta: '',
            prompt: '',
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Calculate summary
    const successCount = results.filter((r) => r.bannerPath && !r.error).length;
    const failureCount = results.filter((r) => r.error).length;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        summary: {
          total: body.targets.length,
          success: successCount,
          failed: failureCount,
        },
        results,
      },
    });
  } catch (error) {
    console.error('Error in auto-banner generation:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate banners',
      },
      { status: 500 }
    );
  }
}

function validateRequestBody(body: AutoBannerRequestBody): string | null {
  if (!body.targets || !Array.isArray(body.targets) || body.targets.length === 0) {
    return 'At least one target is required';
  }

  for (const target of body.targets) {
    if (!target.name) {
      return 'Target name is required';
    }
    if (!target.gender) {
      return 'Target gender is required';
    }
    if (typeof target.ageFrom !== 'number' || target.ageFrom < 0) {
      return 'Valid ageFrom is required';
    }
    if (typeof target.ageTo !== 'number' || target.ageTo < target.ageFrom) {
      return 'Valid ageTo is required (must be >= ageFrom)';
    }
    if (!target.issue) {
      return 'Target issue is required';
    }
  }

  if (!body.funnel || !['awareness', 'conversion'].includes(body.funnel)) {
    return 'Funnel must be either "awareness" or "conversion"';
  }

  if (!body.appealAxes || !Array.isArray(body.appealAxes) || body.appealAxes.length === 0) {
    return 'At least one appeal axis is required';
  }

  const validAspectRatios = ['1:1', '16:9', '9:16', '4:5'];
  if (!body.aspectRatio || !validAspectRatios.includes(body.aspectRatio)) {
    return `Aspect ratio must be one of: ${validAspectRatios.join(', ')}`;
  }

  const validSizes = ['4K', '2K', '1080p'];
  if (!body.size || !validSizes.includes(body.size)) {
    return `Size must be one of: ${validSizes.join(', ')}`;
  }

  return null;
}
