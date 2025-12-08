import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ProjectRepository } from '@/lib/db/repositories/project';
import { CreateProjectInput } from '@/types/project';
import { ApiResponse } from '@/types/api';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const db = getDb();
    const repository = new ProjectRepository(db);
    const projects = await repository.findAll();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch projects',
      },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Project name is required',
        },
        { status: 400 }
      );
    }

    const input: CreateProjectInput = {
      name: body.name,
      description: body.description,
      productUrl: body.productUrl,
      productName: body.productName,
      productCategory: body.productCategory,
      targetInfo: body.targetInfo,
    };

    const db = getDb();
    const repository = new ProjectRepository(db);
    const project = await repository.create(input);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create project',
      },
      { status: 500 }
    );
  }
}
