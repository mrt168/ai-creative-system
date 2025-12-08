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
