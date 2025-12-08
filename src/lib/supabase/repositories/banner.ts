import { getSupabase } from '../client';
import type { Banner, NewBanner, UpdateBanner } from '../types';
import { CreateBannerInput, UpdateBannerInput } from '@/types/banner';

// Helper to convert snake_case DB fields to camelCase
function toBanner(row: Banner) {
  return {
    ...row,
    projectId: row.project_id,
    personaId: row.persona_id,
    imagePath: row.image_path,
    aspectRatio: row.aspect_ratio,
    metaAdId: row.meta_ad_id,
    errorMessage: row.error_message,
    generationStartedAt: row.generation_started_at ? new Date(row.generation_started_at) : null,
    generationCompletedAt: row.generation_completed_at ? new Date(row.generation_completed_at) : null,
    createdAt: new Date(row.created_at),
  };
}

export class BannerRepository {
  private supabase = getSupabase();

  async create(input: CreateBannerInput) {
    const now = new Date().toISOString();

    const newBanner: NewBanner = {
      project_id: input.projectId,
      persona_id: input.personaId ?? null,
      prompt: input.prompt,
      image_path: null,
      aspect_ratio: input.aspectRatio,
      size: input.size,
      status: 'pending',
      meta_ad_id: null,
      error_message: null,
      generation_started_at: null,
      generation_completed_at: null,
      created_at: now,
    };

    const { data, error } = await this.supabase
      .from('acs_banners')
      .insert(newBanner)
      .select()
      .single();

    if (error) throw error;
    return toBanner(data);
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('acs_banners')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return toBanner(data);
  }

  async findByProjectId(projectId: string) {
    const { data, error } = await this.supabase
      .from('acs_banners')
      .select()
      .eq('project_id', projectId);

    if (error) throw error;
    return data.map(toBanner);
  }

  async findByStatus(status: string) {
    const { data, error } = await this.supabase
      .from('acs_banners')
      .select()
      .eq('status', status);

    if (error) throw error;
    return data.map(toBanner);
  }

  async update(id: string, input: UpdateBannerInput) {
    const updateData: UpdateBanner = {};

    if (input.imagePath !== undefined) updateData.image_path = input.imagePath;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.metaAdId !== undefined) updateData.meta_ad_id = input.metaAdId;
    if (input.errorMessage !== undefined) updateData.error_message = input.errorMessage;
    if (input.generationStartedAt !== undefined) {
      updateData.generation_started_at = input.generationStartedAt?.toISOString() ?? null;
    }
    if (input.generationCompletedAt !== undefined) {
      updateData.generation_completed_at = input.generationCompletedAt?.toISOString() ?? null;
    }

    const { data, error } = await this.supabase
      .from('acs_banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return toBanner(data);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('acs_banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async countByProjectId(projectId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('acs_banners')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (error) throw error;
    return count ?? 0;
  }
}
