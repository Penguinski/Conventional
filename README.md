# Conventional — Volume 1: Lost and Found

Rivista enigmistica editoriale mobile-first con 12 giochi sulle tracce, 5 card non ludiche, progresso locale versionato e backend Supabase opzionale.

## Comandi essenziali

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Per gli E2E: `npm run test:e2e`.

## Pubblicazione

Il workflow `.github/workflows/pages.yml` compila e pubblica `dist/` su GitHub Pages. Il `base` relativo di Vite funziona sia su un repository `username.github.io/nome-repo/` sia su dominio personalizzato.

## Supabase e Turnstile

1. Crea un progetto Supabase e applica `supabase/migrations/202607230001_initial.sql`.
2. Abilita Anonymous Sign-Ins in Supabase Auth.
3. Copia `.env.example` in `.env.local` e imposta URL e chiave anon pubblica. Non usare mai la service-role key nel frontend.
4. Crea un sito Cloudflare Turnstile e imposta `VITE_TURNSTILE_SITE_KEY`. La verifica server-side e i limiti di frequenza sono richiesti prima di attivare invii pubblici.
5. Modera `dust_drawings` dal dashboard Supabase e configura una procedura periodica di pulizia degli utenti anonimi inattivi.

Senza variabili d’ambiente, la rivista funziona interamente in locale e dichiara indisponibili galleria e classifiche globali.
