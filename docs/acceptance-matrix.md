# Matrice di accettazione

| Criterio | Prova richiesta |
|---|---|
| Home fedele alla tavola | confronto screenshot a 390×844 |
| Due colonne mobile | screenshot 375, 390 e 430 px senza overflow |
| Quattro colonne desktop | screenshot 1366×768 |
| 12 giochi completabili | test E2E di un flusso per gioco |
| Contatore corretto | E2E: apertura non incrementa, completamento sì |
| Routing condivisibile | E2E query `?gioco=` e Indietro/Avanti |
| Persistenza | E2E reload e test migrazione stato |
| Fotocamera privata | review statica + fallback E2E |
| Accessibilità | tastiera, focus trap, target 44 px, reduced motion |
| Supabase opzionale | schema/RLS + fallback locale verificato |
| Qualità tecnica | lint, typecheck, unit, build |
| Accettazione percettiva | revisione esplicita di Alek, ancora distinta dalle prove tecniche |
