// Kept separate from supabaseClient.ts so pages can check configuration
// without pulling the Supabase SDK into the initial bundle.

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured =
  !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('your-project-ref');

if (!isSupabaseConfigured) {
  // The app still runs with local fallback data (see src/data/products.ts)
  // so the public site works even before Supabase is connected.
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Admin login and live product data will not work until you add them to .env.local — see README.md.'
  );
}
