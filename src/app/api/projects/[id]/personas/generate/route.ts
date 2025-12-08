import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository, PersonaRepository } from '@/lib/supabase/repositories';
import { getGeminiClient } from '@/lib/gemini/client';
import { PersonaAnalyzer } from '@/lib/gemini/persona-analyzer';
import { ApiResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/projects/:id/personas/generate - Auto-generate personas using AI
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.productInfo) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Product info is required',
        },
        { status: 400 }
      );
    }

    const { productInfo } = body;
    if (!productInfo.name || !productInfo.category) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Product name and category are required',
        },
        { status: 400 }
      );
    }

    const projectRepository = new ProjectRepository();
    const personaRepository = new PersonaRepository();

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

    // Generate personas using AI
    const client = getGeminiClient();
    const analyzer = new PersonaAnalyzer(client);

    const generatedPersonas = await analyzer.analyzeProduct({
      name: productInfo.name,
      category: productInfo.category,
      features: productInfo.features || [],
      targetAge: productInfo.targetAge || '',
      targetGender: productInfo.targetGender || '',
    });

    // Save generated personas to database
    const savedPersonas = await Promise.all(
      generatedPersonas.map((persona) =>
        personaRepository.create({
          projectId: id,
          name: persona.name,
          ageRange: persona.ageRange,
          gender: persona.gender,
          occupation: persona.occupation,
          incomeLevel: persona.incomeLevel,
          interests: persona.interests,
          painPoints: persona.painPoints,
          buyingMotivation: persona.buyingMotivation,
          communicationStyle: persona.communicationStyle,
        })
      )
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        personas: savedPersonas,
        count: savedPersonas.length,
      },
    });
  } catch (error) {
    console.error('Error generating personas:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to generate personas',
      },
      { status: 500 }
    );
  }
}
