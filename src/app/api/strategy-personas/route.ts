import { NextResponse } from 'next/server';
import { StrategyPersonaRepository } from '@/lib/supabase/repositories';
import { ApiResponse } from '@/types/api';

// GET /api/strategy-personas - List all strategy personas across all projects
export async function GET() {
  try {
    const strategyPersonaRepository = new StrategyPersonaRepository();
    const strategyPersonas = await strategyPersonaRepository.findAll();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: strategyPersonas,
    });
  } catch (error) {
    console.error('Error fetching all strategy personas:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch strategy personas',
      },
      { status: 500 }
    );
  }
}
