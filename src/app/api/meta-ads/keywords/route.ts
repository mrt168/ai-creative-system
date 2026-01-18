import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository } from '@/lib/supabase/repositories';
import { getGeminiClient } from '@/lib/gemini';
import {
  buildSearchKeywordsPrompt,
  parseSearchKeywordsResponse,
  ProductInfo,
} from '@/lib/utils/competitor-prompts';
import { ApiResponse } from '@/types/api';

interface KeywordsRequestBody {
  projectId: string;
}

interface KeywordsResponseData {
  keywords: string[];
}

// POST /api/meta-ads/keywords - Generate search keywords from product info
export async function POST(request: NextRequest) {
  try {
    const body: KeywordsRequestBody = await request.json();

    // Validate required fields
    if (!body.projectId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'projectId is required',
        },
        { status: 400 }
      );
    }

    // Get project info
    const projectRepo = new ProjectRepository();
    const project = await projectRepo.findById(body.projectId);

    if (!project) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Check if project has required product info
    if (!project.productName || !project.productCategory) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error:
            'Project must have productName and productCategory set to generate keywords',
        },
        { status: 400 }
      );
    }

    // Get target info features if available
    const targetInfo = project.targetInfo as Record<string, unknown> | null;
    const features: string[] = Array.isArray(targetInfo?.features)
      ? (targetInfo.features as string[])
      : [];

    const productInfo: ProductInfo = {
      productName: project.productName,
      productCategory: project.productCategory,
      features: features,
    };

    // Use Gemini to generate keywords
    let keywords: string[];
    try {
      const geminiClient = getGeminiClient();
      const prompt = buildSearchKeywordsPrompt(productInfo);
      const response = await geminiClient.generateText(prompt);
      const parsed = parseSearchKeywordsResponse(response);

      if (!parsed || !parsed.keywords || parsed.keywords.length === 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Failed to generate keywords from AI response',
          },
          { status: 500 }
        );
      }

      keywords = parsed.keywords;
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Failed to generate keywords using AI',
        },
        { status: 502 }
      );
    }

    const responseData: KeywordsResponseData = {
      keywords: keywords,
    };

    return NextResponse.json<ApiResponse<KeywordsResponseData>>({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error in meta-ads keywords:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to generate search keywords',
      },
      { status: 500 }
    );
  }
}
