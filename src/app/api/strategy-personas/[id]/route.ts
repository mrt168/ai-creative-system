import { NextRequest, NextResponse } from 'next/server';
import { StrategyPersonaRepository } from '@/lib/supabase/repositories';
import { ApiResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/strategy-personas/:id - Get a single strategy persona
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repository = new StrategyPersonaRepository();
    const strategyPersona = await repository.findById(id);

    if (!strategyPersona) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Strategy persona not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: strategyPersona,
    });
  } catch (error) {
    console.error('Error fetching strategy persona:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch strategy persona',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/strategy-personas/:id - Delete a strategy persona
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repository = new StrategyPersonaRepository();

    // Check if the strategy persona exists before deleting
    const strategyPersona = await repository.findById(id);
    if (!strategyPersona) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Strategy persona not found',
        },
        { status: 404 }
      );
    }

    await repository.delete(id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting strategy persona:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete strategy persona',
      },
      { status: 500 }
    );
  }
}
