import { getSupabase } from '../client';
import type { Persona, NewPersona, UpdatePersona } from '../types';
import { CreatePersonaInput, UpdatePersonaInput } from '@/types/persona';

// Helper to convert snake_case DB fields to camelCase
function toPersona(row: Persona) {
  return {
    ...row,
    projectId: row.project_id,
    ageRange: row.age_range,
    incomeLevel: row.income_level,
    interests: row.interests as string[] | null,
    painPoints: row.pain_points as string[] | null,
    buyingMotivation: row.buying_motivation,
    communicationStyle: row.communication_style,
    createdAt: new Date(row.created_at),
  };
}

export class PersonaRepository {
  private supabase = getSupabase();

  async create(input: CreatePersonaInput) {
    const now = new Date().toISOString();

    const newPersona: NewPersona = {
      project_id: input.projectId,
      name: input.name,
      age_range: input.ageRange ?? null,
      gender: input.gender ?? null,
      occupation: input.occupation ?? null,
      income_level: input.incomeLevel ?? null,
      interests: input.interests ?? [],
      pain_points: input.painPoints ?? [],
      buying_motivation: input.buyingMotivation ?? null,
      communication_style: input.communicationStyle ?? null,
      created_at: now,
    };

    const { data, error } = await this.supabase
      .from('acs_personas')
      .insert(newPersona)
      .select()
      .single();

    if (error) throw error;
    return toPersona(data);
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('acs_personas')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return toPersona(data);
  }

  async findByProjectId(projectId: string) {
    const { data, error } = await this.supabase
      .from('acs_personas')
      .select()
      .eq('project_id', projectId);

    if (error) throw error;
    return data.map(toPersona);
  }

  async update(id: string, input: UpdatePersonaInput) {
    const updateData: UpdatePersona = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.ageRange !== undefined) updateData.age_range = input.ageRange;
    if (input.gender !== undefined) updateData.gender = input.gender;
    if (input.occupation !== undefined) updateData.occupation = input.occupation;
    if (input.incomeLevel !== undefined) updateData.income_level = input.incomeLevel;
    if (input.interests !== undefined) updateData.interests = input.interests;
    if (input.painPoints !== undefined) updateData.pain_points = input.painPoints;
    if (input.buyingMotivation !== undefined) updateData.buying_motivation = input.buyingMotivation;
    if (input.communicationStyle !== undefined) updateData.communication_style = input.communicationStyle;

    const { data, error } = await this.supabase
      .from('acs_personas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return toPersona(data);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('acs_personas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
