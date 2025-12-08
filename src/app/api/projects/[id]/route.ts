import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository } from '@/lib/supabase/repositories';
import { UpdateProjectInput } from '@/types/project';
import { ApiResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/:id - Get a single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repository = new ProjectRepository();
    const project = await repository.findById(id);

    if (!project) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch project',
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects/:id - Update a project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const input: UpdateProjectInput = {};
    if (body.name !== undefined) input.name = body.name;
    if (body.description !== undefined) input.description = body.description;
    if (body.productUrl !== undefined) input.productUrl = body.productUrl;
    if (body.productName !== undefined) input.productName = body.productName;
    if (body.productCategory !== undefined) input.productCategory = body.productCategory;
    if (body.targetInfo !== undefined) input.targetInfo = body.targetInfo;

    const repository = new ProjectRepository();
    const project = await repository.update(id, input);

    if (!project) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update project',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/:id - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repository = new ProjectRepository();
    const deleted = await repository.delete(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete project',
      },
      { status: 500 }
    );
  }
}
