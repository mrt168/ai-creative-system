import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { PersonaRepository } from '@/lib/db/repositories/persona';
import { UpdatePersonaInput } from '@/types/persona';
import { ApiResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/personas/:id - Get a single persona
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();
    const repository = new PersonaRepository(db);
    const persona = await repository.findById(id);

    if (!persona) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Persona not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: persona,
    });
  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch persona',
      },
      { status: 500 }
    );
  }
}

// PUT /api/personas/:id - Update a persona
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const input: UpdatePersonaInput = {};
    if (body.name !== undefined) input.name = body.name;
    if (body.ageRange !== undefined) input.ageRange = body.ageRange;
    if (body.gender !== undefined) input.gender = body.gender;
    if (body.occupation !== undefined) input.occupation = body.occupation;
    if (body.incomeLevel !== undefined) input.incomeLevel = body.incomeLevel;
    if (body.interests !== undefined) input.interests = body.interests;
    if (body.painPoints !== undefined) input.painPoints = body.painPoints;
    if (body.buyingMotivation !== undefined) input.buyingMotivation = body.buyingMotivation;
    if (body.communicationStyle !== undefined) input.communicationStyle = body.communicationStyle;

    const db = getDb();
    const repository = new PersonaRepository(db);
    const persona = await repository.update(id, input);

    if (!persona) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Persona not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: persona,
    });
  } catch (error) {
    console.error('Error updating persona:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update persona',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/personas/:id - Delete a persona
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();
    const repository = new PersonaRepository(db);
    const deleted = await repository.delete(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Persona not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting persona:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete persona',
      },
      { status: 500 }
    );
  }
}
