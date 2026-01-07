import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository, StrategyPersonaRepository } from '@/lib/supabase/repositories';
import { ApiResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/:id/strategy-personas - List all strategy personas for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const projectRepository = new ProjectRepository();
    const strategyPersonaRepository = new StrategyPersonaRepository();

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

    const strategyPersonas = await strategyPersonaRepository.findByProjectId(id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: strategyPersonas,
    });
  } catch (error) {
    console.error('Error fetching strategy personas:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch strategy personas',
      },
      { status: 500 }
    );
  }
}

// POST /api/projects/:id/strategy-personas - Create a new strategy persona
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Strategy persona name is required',
        },
        { status: 400 }
      );
    }

    const projectRepository = new ProjectRepository();
    const strategyPersonaRepository = new StrategyPersonaRepository();

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

    const strategyPersona = await strategyPersonaRepository.create({
      projectId: id,
      name: body.name,
      gender: body.gender,
      ageFrom: body.ageFrom,
      ageTo: body.ageTo,
      issue: body.issue,
      funnel: body.funnel,
      appealAxes: body.appealAxes,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: strategyPersona,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating strategy persona:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create strategy persona',
      },
      { status: 500 }
    );
  }
}
