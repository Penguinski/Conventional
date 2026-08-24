import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('Credenziali pubbliche Supabase mancanti');
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: authError } = await supabase.auth.signInAnonymously();
if (authError) throw authError;

const deadline = Date.now() + 4 * 60 * 1000;
while (Date.now() < deadline) {
  const { count, error } = await supabase
    .from('bulletin_board_post_its')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  if (count === 0) {
    console.log('Bacheca verificata: 0 post-it.');
    process.exit(0);
  }
  console.log(`Bacheca non ancora vuota (${count} post-it); nuovo controllo tra 10 secondi.`);
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}

throw new Error('Go-live bloccato: la bacheca non contiene 0 post-it.');
