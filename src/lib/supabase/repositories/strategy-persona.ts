import { getSupabase } from '../client';
import type { StrategyPersonaRow, NewStrategyPersona, Json } from '../types';

// Input type for creating a strategy persona
export interface CreateStrategyPersonaInput {
  projectId: string;
  name: string;
  gender?: string | null;
  ageFrom?: number | null;
  ageTo?: number | null;
  issue?: string | null;
  funnel?: string | null;
  appealAxes?: string[] | null;
}

// Output type with camelCase fields
export interface StrategyPersona {
  id: string;
  projectId: string | null;
  name: string;
  gender: string | null;
  ageFrom: number | null;
  ageTo: number | null;
  issue: string | null;
  funnel: string | null;
  appealAxes: string[];
  createdAt: Date;
}

// Helper to convert snake_case DB fields to camelCase
function toStrategyPersona(row: StrategyPersonaRow): StrategyPersona {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    gender: row.gender,
    ageFrom: row.age_from,
    ageTo: row.age_to,
    issue: row.issue,
    funnel: row.funnel,
    appealAxes: (row.appeal_axes as string[]) || [],
    createdAt: new Date(row.created_at),
  };
}

export class StrategyPersonaRepository {
  private supabase = getSupabase();

  async create(input: CreateStrategyPersonaInput): Promise<StrategyPersona> {
    const now = new Date().toISOString();

    const newStrategyPersona: NewStrategyPersona = {
      project_id: input.projectId,
      name: input.name,
      gender: input.gender ?? null,
      age_from: input.ageFrom ?? null,
      age_to: input.ageTo ?? null,
      issue: input.issue ?? null,
      funnel: input.funnel ?? null,
      appeal_axes: (input.appealAxes ?? []) as unknown as Json,
      created_at: now,
    };

    const { data, error } = await this.supabase
      .from('acs_strategy_personas')
      .insert(newStrategyPersona)
      .select()
      .single();

    if (error) throw error;
    return toStrategyPersona(data);
  }

  async findById(id: string): Promise<StrategyPersona | null> {
    const { data, error } = await this.supabase
      .from('acs_strategy_personas')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return toStrategyPersona(data);
  }

  async findByProjectId(projectId: string): Promise<StrategyPersona[]> {
    const { data, error } = await this.supabase
      .from('acs_strategy_personas')
      .select()
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(toStrategyPersona);
  }

  async findAll(): Promise<StrategyPersona[]> {
    const { data, error } = await this.supabase
      .from('acs_strategy_personas')
      .select()
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(toStrategyPersona);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('acs_strategy_personas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
