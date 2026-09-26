import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from './supabaseConfig';

// createClient throws on an empty URL, so use a harmless placeholder when
// Supabase isn't configured — requests will simply fail and callers fall back.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://not-configured.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'not-configured'
);
