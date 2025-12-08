import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Singleton instance
let supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!supabase) {
    supabase = getSupabaseClient();
  }
  return supabase;
}
