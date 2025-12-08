import { NextRequest, NextResponse } from 'next/server';
import { BannerRepository } from '@/lib/supabase/repositories';
import { UpdateBannerInput } from '@/types/banner';
import { ApiResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/banners/:id - Get a single banner
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repository = new BannerRepository();
    const banner = await repository.findById(id);

    if (!banner) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Banner not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch banner',
      },
      { status: 500 }
    );
  }
}

// PUT /api/banners/:id - Update a banner (e.g., add Meta Ad ID)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const input: UpdateBannerInput = {};
    if (body.metaAdId !== undefined) input.metaAdId = body.metaAdId;
    if (body.status !== undefined) input.status = body.status;

    const repository = new BannerRepository();
    const banner = await repository.update(id, input);

    if (!banner) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Banner not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update banner',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/banners/:id - Delete a banner
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repository = new BannerRepository();
    const deleted = await repository.delete(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Banner not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete banner',
      },
      { status: 500 }
    );
  }
}
