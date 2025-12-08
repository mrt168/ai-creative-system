import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository, BannerRepository } from '@/lib/supabase/repositories';
import { ApiResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/:id/banners - List all banners for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const projectRepository = new ProjectRepository();
    const bannerRepository = new BannerRepository();

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

    const banners = await bannerRepository.findByProjectId(id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch banners',
      },
      { status: 500 }
    );
  }
}
