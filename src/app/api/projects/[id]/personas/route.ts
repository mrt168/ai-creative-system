import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ProjectRepository } from '@/lib/db/repositories/project';
import { PersonaRepository } from '@/lib/db/repositories/persona';
import { ApiResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/:id/personas - List all personas for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();
    const projectRepository = new ProjectRepository(db);
    const personaRepository = new PersonaRepository(db);

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

    const personas = await personaRepository.findByProjectId(id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: personas,
    });
  } catch (error) {
    console.error('Error fetching personas:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch personas',
      },
      { status: 500 }
    );
  }
}

// POST /api/projects/:id/personas - Create a new persona
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Persona name is required',
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const projectRepository = new ProjectRepository(db);
    const personaRepository = new PersonaRepository(db);

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

    const persona = await personaRepository.create({
      projectId: id,
      name: body.name,
      ageRange: body.ageRange,
      gender: body.gender,
      occupation: body.occupation,
      incomeLevel: body.incomeLevel,
      interests: body.interests,
      painPoints: body.painPoints,
      buyingMotivation: body.buyingMotivation,
      communicationStyle: body.communicationStyle,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: persona,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create persona',
      },
      { status: 500 }
    );
  }
}
