import { getSupabase } from '../client';
import type { Project, NewProject, UpdateProject, Json } from '../types';
import { CreateProjectInput, UpdateProjectInput } from '@/types/project';

// Helper to convert snake_case DB fields to camelCase
function toProject(row: Project): Project & {
  productUrl: string | null;
  productName: string | null;
  productCategory: string | null;
  targetInfo: unknown;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    ...row,
    productUrl: row.product_url,
    productName: row.product_name,
    productCategory: row.product_category,
    targetInfo: row.target_info,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class ProjectRepository {
  private supabase = getSupabase();

  async create(input: CreateProjectInput) {
    const now = new Date().toISOString();

    const newProject: NewProject = {
      name: input.name,
      description: input.description ?? null,
      product_url: input.productUrl ?? null,
      product_name: input.productName ?? null,
      product_category: input.productCategory ?? null,
      target_info: (input.targetInfo as unknown as Json) ?? null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await this.supabase
      .from('acs_projects')
      .insert(newProject)
      .select()
      .single();

    if (error) throw error;
    return toProject(data);
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('acs_projects')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return toProject(data);
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('acs_projects')
      .select()
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(toProject);
  }

  async update(id: string, input: UpdateProjectInput) {
    const updateData: UpdateProject = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.productUrl !== undefined) updateData.product_url = input.productUrl;
    if (input.productName !== undefined) updateData.product_name = input.productName;
    if (input.productCategory !== undefined) updateData.product_category = input.productCategory;
    if (input.targetInfo !== undefined) updateData.target_info = input.targetInfo as unknown as Json;

    const { data, error } = await this.supabase
      .from('acs_projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return toProject(data);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('acs_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
