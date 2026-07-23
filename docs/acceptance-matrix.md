# Matrice di accettazione

| Criterio | Prova finale | Stato |
|---|---|---|
| Home fedele alla tavola | screenshot Chromium e WebKit a 390×844 | verificato |
| Due colonne mobile | screenshot 375, 390 e 430 px; E2E overflow ≤ 1 px | verificato |
| Quattro colonne desktop | screenshot 1366×768 | verificato |
| 12 giochi completabili | E2E con gesto continuo per N. 04, trascinamento reale per N. 03 e flusso completo N. 01–12 | verificato, 12/12 |
| Canvas mouse/touch | movimenti distribuiti, frame intermedi, `pointercancel`, `lostpointercapture`, console/pageerror | verificato |
| Contatore corretto | E2E 12/12 dopo i completamenti | verificato |
| Routing e scroll | query `?gioco=`, Indietro e ripristino posizione | verificato |
| Persistenza | test migrazione + E2E reload immediato dopo il dodicesimo gioco | verificato |
| Fotocamera privata | stream chiuso, elaborazione locale, modalità demo | verificato |
| Accessibilità | focus trap, tastiera, target minimi 44 px, reduced motion, testo minimo 10 px | verificato staticamente/E2E |
| Backend pubblico | menu, nickname e riferimenti tecnici rimossi; galleria non esposta | verificato |
| Qualità tecnica | lint, typecheck, 10 unit test, build, 18 E2E passati | verificato |
| Accettazione percettiva | resta distinta dalle prove tecniche | da Alek |
