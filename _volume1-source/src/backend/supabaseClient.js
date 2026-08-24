import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseConfiguration = Boolean(supabaseUrl && supabasePublishableKey);

let client = null;

export function getSupabaseClient() {
  if (!hasSupabaseConfiguration) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return client;
}
