import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://notworthy.vip';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
});

// Database types
export interface UserSettings {
  id: string;
  user_id: string;
  github_username?: string;
  repo_filter?: 'pinned' | 'recent' | 'stars';
  max_repos?: number;
  bio_override?: string;
  display_name_override?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  event_type: 'fetch_profile' | 'fetch_repos' | 'settings_update' | 'error' | 'login' | 'logout';
  event_data?: any;
  error_message?: string;
  created_at: string;
}
