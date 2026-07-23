# Report di riparazione — Conventional Vol. 1

## Modifiche

- eliminati il crash dei canvas e le schermate bianche con un motore pointer condiviso e due error boundary;
- ricostruite le meccaniche dei giochi N. 01–07 e N. 10–12; consolidati N. 08–09;
- sostituiti i falsi bersagli con oggetti, differenze, tracce e indizi geometrici realmente interattivi;
- rimosso il menu hamburger e ogni testo pubblico relativo a nickname, backend o classifica;
- ricostruite le linguette triangolari con etichetta separata e orientamento interno;
- resa resistente al reload immediato la persistenza locale;
- aggiunti audit, brief asset e nota privata della soluzione del mistero.

## Prove

- `npm run lint`: passato;
- `npm run typecheck`: passato;
- `npm test`: 10/10;
- `npm run build`: passato;
- `npm run test:e2e`: 18 passati, 12 skip intenzionali per test specifici di dispositivo;
- flusso reale N. 01–12: 12/12 e 12/12 dopo reload;
- viewport: 375×812, 390×844, 430×932, 1366×768;
- browser: Chromium mobile, Chromium desktop con mouse, WebKit mobile;
- screenshot: `docs/qa-repair/`.

## Asset ancora da fornire

Le illustrazioni finali non fanno parte di questa passata. I placeholder sostituibili, i rapporti, i livelli e i dati invarianti sono elencati in `docs/asset-brief.md`; la sostituzione non richiede modifiche alla logica.
