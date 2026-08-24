import { getSupabaseClient, hasSupabaseConfiguration } from '../backend/supabaseClient.js';

const table = 'bulletin_board_post_its';

export function createBulletinBoardStore() {
  const client = getSupabaseClient();
  let user = null;
  let channel = null;

  async function ensureIdentity() {
    if (!client) throw new Error('Configurazione Supabase mancante');
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    let session = sessionData.session;
    user = session?.user ?? null;
    if (!user) {
      const { data, error } = await client.auth.signInAnonymously();
      if (error) throw error;
      user = data.user;
      session = data.session;
    }
    if (session?.access_token) await client.realtime.setAuth(session.access_token);
    return user;
  }

  async function load() {
    await ensureIdentity();
    const { data, error } = await client.from(table).select('*').order('z_index', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async function createPostIt({ strokes, x, y, zIndex }) {
    const identity = await ensureIdentity();
    const { data, error } = await client.from(table).insert({ owner_id: identity.id, strokes, x, y, z_index: zIndex }).select().single();
    if (error) throw error;
    return data;
  }

  async function movePostIt(id, { x, y, zIndex }) {
    const { data, error } = await client.from(table)
      .update({ x, y, z_index: zIndex, updated_at: new Date().toISOString() })
      .eq('id', id).select('id, x, y, z_index, updated_at').single();
    if (error) throw error;
    return data;
  }

  function subscribe(onChange, onReconnect) {
    if (!client || channel) return;
    channel = client.channel('conventional-bulletin-board')
      .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onReconnect?.();
      });
  }

  async function unsubscribe() {
    if (!client || !channel) return;
    const current = channel;
    channel = null;
    await client.removeChannel(current);
  }

  return {
    configured: hasSupabaseConfiguration,
    load,
    createPostIt,
    movePostIt,
    subscribe,
    unsubscribe,
    get ownerId() { return user?.id ?? null; },
  };
}
