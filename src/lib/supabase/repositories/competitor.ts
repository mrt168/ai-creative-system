import { getSupabase } from '../client';
import type {
  CompetitorAd,
  NewCompetitorAd,
  CompetitorAnalysis,
  NewCompetitorAnalysis,
  Json,
} from '../types';

// Input types
export interface CreateCompetitorAdInput {
  projectId: string;
  metaAdId: string;
  pageName?: string;
  pageId?: string;
  adCreativeBody?: string;
  adSnapshotUrl?: string;
  mediaType?: string;
  publisherPlatforms?: string[];
  adDeliveryStartDate?: string;
  searchTerm?: string;
  countryCode?: string;
  analysis?: Record<string, unknown>;
}

export interface CreateCompetitorAnalysisInput {
  projectId: string;
  searchTerm: string;
  countryCode?: string;
  adCount?: number;
  analysisSummary?: Record<string, unknown>;
  appealAxesDistribution?: Record<string, number>;
}

// Helper to convert snake_case DB fields to camelCase for CompetitorAd
function toCompetitorAd(row: CompetitorAd): CompetitorAd & {
  projectId: string;
  metaAdId: string;
  pageName: string | null;
  pageId: string | null;
  adCreativeBody: string | null;
  adSnapshotUrl: string | null;
  mediaType: string | null;
  publisherPlatforms: Json | null;
  adDeliveryStartDate: string | null;
  searchTerm: string | null;
  countryCode: string | null;
  createdAt: Date;
} {
  return {
    ...row,
    projectId: row.project_id,
    metaAdId: row.meta_ad_id,
    pageName: row.page_name,
    pageId: row.page_id,
    adCreativeBody: row.ad_creative_body,
    adSnapshotUrl: row.ad_snapshot_url,
    mediaType: row.media_type,
    publisherPlatforms: row.publisher_platforms,
    adDeliveryStartDate: row.ad_delivery_start_date,
    searchTerm: row.search_term,
    countryCode: row.country_code,
    createdAt: new Date(row.created_at),
  };
}

// Helper to convert snake_case DB fields to camelCase for CompetitorAnalysis
function toCompetitorAnalysis(row: CompetitorAnalysis): CompetitorAnalysis & {
  projectId: string;
  searchTerm: string;
  countryCode: string | null;
  adCount: number | null;
  analysisSummary: Json | null;
  appealAxesDistribution: Json | null;
  createdAt: Date;
} {
  return {
    ...row,
    projectId: row.project_id,
    searchTerm: row.search_term,
    countryCode: row.country_code,
    adCount: row.ad_count,
    analysisSummary: row.analysis_summary,
    appealAxesDistribution: row.appeal_axes_distribution,
    createdAt: new Date(row.created_at),
  };
}

export class CompetitorRepository {
  private supabase = getSupabase();

  // ============================================
  // CompetitorAd methods (acs_competitor_ads)
  // ============================================

  async createAd(input: CreateCompetitorAdInput): Promise<ReturnType<typeof toCompetitorAd>> {
    const now = new Date().toISOString();

    const newAd: NewCompetitorAd = {
      project_id: input.projectId,
      meta_ad_id: input.metaAdId,
      page_name: input.pageName ?? null,
      page_id: input.pageId ?? null,
      ad_creative_body: input.adCreativeBody ?? null,
      ad_snapshot_url: input.adSnapshotUrl ?? null,
      media_type: input.mediaType ?? null,
      publisher_platforms: (input.publisherPlatforms as unknown as Json) ?? null,
      ad_delivery_start_date: input.adDeliveryStartDate ?? null,
      search_term: input.searchTerm ?? null,
      country_code: input.countryCode ?? null,
      analysis: (input.analysis as unknown as Json) ?? null,
      created_at: now,
    };

    const { data, error } = await this.supabase
      .from('acs_competitor_ads')
      .insert(newAd)
      .select()
      .single();

    if (error) throw error;
    return toCompetitorAd(data);
  }

  async findAdsByProjectId(projectId: string): Promise<ReturnType<typeof toCompetitorAd>[]> {
    const { data, error } = await this.supabase
      .from('acs_competitor_ads')
      .select()
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(toCompetitorAd);
  }

  async findAdsBySearchTerm(
    projectId: string,
    searchTerm: string
  ): Promise<ReturnType<typeof toCompetitorAd>[]> {
    const { data, error } = await this.supabase
      .from('acs_competitor_ads')
      .select()
      .eq('project_id', projectId)
      .eq('search_term', searchTerm)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(toCompetitorAd);
  }

  async deleteAdsByProjectId(projectId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('acs_competitor_ads')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
    return true;
  }

  async upsertAd(input: CreateCompetitorAdInput): Promise<ReturnType<typeof toCompetitorAd>> {
    const now = new Date().toISOString();

    const adData: NewCompetitorAd = {
      project_id: input.projectId,
      meta_ad_id: input.metaAdId,
      page_name: input.pageName ?? null,
      page_id: input.pageId ?? null,
      ad_creative_body: input.adCreativeBody ?? null,
      ad_snapshot_url: input.adSnapshotUrl ?? null,
      media_type: input.mediaType ?? null,
      publisher_platforms: (input.publisherPlatforms as unknown as Json) ?? null,
      ad_delivery_start_date: input.adDeliveryStartDate ?? null,
      search_term: input.searchTerm ?? null,
      country_code: input.countryCode ?? null,
      analysis: (input.analysis as unknown as Json) ?? null,
      created_at: now,
    };

    // Use meta_ad_id as the unique key for upsert
    const { data, error } = await this.supabase
      .from('acs_competitor_ads')
      .upsert(adData, {
        onConflict: 'meta_ad_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;
    return toCompetitorAd(data);
  }

  // ============================================
  // CompetitorAnalysis methods (acs_competitor_analyses)
  // ============================================

  async createAnalysis(
    input: CreateCompetitorAnalysisInput
  ): Promise<ReturnType<typeof toCompetitorAnalysis>> {
    const now = new Date().toISOString();

    const newAnalysis: NewCompetitorAnalysis = {
      project_id: input.projectId,
      search_term: input.searchTerm,
      country_code: input.countryCode ?? null,
      ad_count: input.adCount ?? null,
      analysis_summary: (input.analysisSummary as unknown as Json) ?? null,
      appeal_axes_distribution: (input.appealAxesDistribution as unknown as Json) ?? null,
      created_at: now,
    };

    const { data, error } = await this.supabase
      .from('acs_competitor_analyses')
      .insert(newAnalysis)
      .select()
      .single();

    if (error) throw error;
    return toCompetitorAnalysis(data);
  }

  async findAnalysesByProjectId(
    projectId: string
  ): Promise<ReturnType<typeof toCompetitorAnalysis>[]> {
    const { data, error } = await this.supabase
      .from('acs_competitor_analyses')
      .select()
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(toCompetitorAnalysis);
  }

  async findLatestAnalysis(
    projectId: string,
    searchTerm: string
  ): Promise<ReturnType<typeof toCompetitorAnalysis> | null> {
    const { data, error } = await this.supabase
      .from('acs_competitor_analyses')
      .select()
      .eq('project_id', projectId)
      .eq('search_term', searchTerm)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116 means no rows found
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return toCompetitorAnalysis(data);
  }

  async deleteAnalysesByProjectId(projectId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('acs_competitor_analyses')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
    return true;
  }
}
