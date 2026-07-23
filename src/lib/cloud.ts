let clientPromise: Promise<import("@supabase/supabase-js").SupabaseClient | null> | null = null;

export function cloudAvailable(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export async function getCloudClient() {
  if (!cloudAvailable()) return null;
  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    }),
  );
  return clientPromise;
}

export async function ensureAnonymousIdentity() {
  const client = await getCloudClient();
  if (!client) return { client: null, userId: null };
  const current = await client.auth.getUser();
  if (current.data.user) return { client, userId: current.data.user.id };
  const signed = await client.auth.signInAnonymously();
  if (signed.error) throw signed.error;
  return { client, userId: signed.data.user?.id ?? null };
}
