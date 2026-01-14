export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      acs_projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          product_url: string | null;
          product_name: string | null;
          product_category: string | null;
          target_info: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          product_url?: string | null;
          product_name?: string | null;
          product_category?: string | null;
          target_info?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          product_url?: string | null;
          product_name?: string | null;
          product_category?: string | null;
          target_info?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      acs_personas: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          age_range: string | null;
          gender: string | null;
          occupation: string | null;
          income_level: string | null;
          interests: Json | null;
          pain_points: Json | null;
          buying_motivation: string | null;
          communication_style: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          age_range?: string | null;
          gender?: string | null;
          occupation?: string | null;
          income_level?: string | null;
          interests?: Json | null;
          pain_points?: Json | null;
          buying_motivation?: string | null;
          communication_style?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          age_range?: string | null;
          gender?: string | null;
          occupation?: string | null;
          income_level?: string | null;
          interests?: Json | null;
          pain_points?: Json | null;
          buying_motivation?: string | null;
          communication_style?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'acs_personas_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'acs_projects';
            referencedColumns: ['id'];
          }
        ];
      };
      acs_banners: {
        Row: {
          id: string;
          project_id: string;
          persona_id: string | null;
          prompt: string;
          image_path: string | null;
          aspect_ratio: string;
          size: string;
          status: string;
          meta_ad_id: string | null;
          error_message: string | null;
          generation_started_at: string | null;
          generation_completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          persona_id?: string | null;
          prompt: string;
          image_path?: string | null;
          aspect_ratio: string;
          size: string;
          status?: string;
          meta_ad_id?: string | null;
          error_message?: string | null;
          generation_started_at?: string | null;
          generation_completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          persona_id?: string | null;
          prompt?: string;
          image_path?: string | null;
          aspect_ratio?: string;
          size?: string;
          status?: string;
          meta_ad_id?: string | null;
          error_message?: string | null;
          generation_started_at?: string | null;
          generation_completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'acs_banners_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'acs_projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'acs_banners_persona_id_fkey';
            columns: ['persona_id'];
            isOneToOne: false;
            referencedRelation: 'acs_personas';
            referencedColumns: ['id'];
          }
        ];
      };
      acs_strategy_personas: {
        Row: {
          id: string;
          project_id: string | null;
          name: string;
          gender: string | null;
          age_from: number | null;
          age_to: number | null;
          issue: string | null;
          funnel: string | null;
          appeal_axes: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          name: string;
          gender?: string | null;
          age_from?: number | null;
          age_to?: number | null;
          issue?: string | null;
          funnel?: string | null;
          appeal_axes?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          name?: string;
          gender?: string | null;
          age_from?: number | null;
          age_to?: number | null;
          issue?: string | null;
          funnel?: string | null;
          appeal_axes?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'acs_strategy_personas_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'acs_projects';
            referencedColumns: ['id'];
          }
        ];
      };
      acs_competitor_ads: {
        Row: {
          id: string;
          project_id: string;
          meta_ad_id: string;
          page_name: string | null;
          page_id: string | null;
          ad_creative_body: string | null;
          ad_snapshot_url: string | null;
          media_type: string | null;
          publisher_platforms: Json | null;
          ad_delivery_start_date: string | null;
          search_term: string | null;
          country_code: string | null;
          analysis: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          meta_ad_id: string;
          page_name?: string | null;
          page_id?: string | null;
          ad_creative_body?: string | null;
          ad_snapshot_url?: string | null;
          media_type?: string | null;
          publisher_platforms?: Json | null;
          ad_delivery_start_date?: string | null;
          search_term?: string | null;
          country_code?: string | null;
          analysis?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          meta_ad_id?: string;
          page_name?: string | null;
          page_id?: string | null;
          ad_creative_body?: string | null;
          ad_snapshot_url?: string | null;
          media_type?: string | null;
          publisher_platforms?: Json | null;
          ad_delivery_start_date?: string | null;
          search_term?: string | null;
          country_code?: string | null;
          analysis?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'acs_competitor_ads_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'acs_projects';
            referencedColumns: ['id'];
          }
        ];
      };
      acs_competitor_analyses: {
        Row: {
          id: string;
          project_id: string;
          search_term: string;
          country_code: string | null;
          ad_count: number | null;
          analysis_summary: Json | null;
          appeal_axes_distribution: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          search_term: string;
          country_code?: string | null;
          ad_count?: number | null;
          analysis_summary?: Json | null;
          appeal_axes_distribution?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          search_term?: string;
          country_code?: string | null;
          ad_count?: number | null;
          analysis_summary?: Json | null;
          appeal_axes_distribution?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'acs_competitor_analyses_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'acs_projects';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Project = Database['public']['Tables']['acs_projects']['Row'];
export type NewProject = Database['public']['Tables']['acs_projects']['Insert'];
export type UpdateProject = Database['public']['Tables']['acs_projects']['Update'];

export type Persona = Database['public']['Tables']['acs_personas']['Row'];
export type NewPersona = Database['public']['Tables']['acs_personas']['Insert'];
export type UpdatePersona = Database['public']['Tables']['acs_personas']['Update'];

export type Banner = Database['public']['Tables']['acs_banners']['Row'];
export type NewBanner = Database['public']['Tables']['acs_banners']['Insert'];
export type UpdateBanner = Database['public']['Tables']['acs_banners']['Update'];

export type StrategyPersonaRow = Database['public']['Tables']['acs_strategy_personas']['Row'];
export type NewStrategyPersona = Database['public']['Tables']['acs_strategy_personas']['Insert'];
export type UpdateStrategyPersona = Database['public']['Tables']['acs_strategy_personas']['Update'];

export type CompetitorAd = Database['public']['Tables']['acs_competitor_ads']['Row'];
export type NewCompetitorAd = Database['public']['Tables']['acs_competitor_ads']['Insert'];
export type UpdateCompetitorAd = Database['public']['Tables']['acs_competitor_ads']['Update'];

export type CompetitorAnalysis = Database['public']['Tables']['acs_competitor_analyses']['Row'];
export type NewCompetitorAnalysis = Database['public']['Tables']['acs_competitor_analyses']['Insert'];
export type UpdateCompetitorAnalysis = Database['public']['Tables']['acs_competitor_analyses']['Update'];
