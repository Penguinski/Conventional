# Asset brief — placeholder sostituibili

| Gioco/area | Placeholder attuale | Formato finale | Livelli da separare | Dati invarianti |
|---|---|---|---|---|
| Card | CSS e forme geometriche | SVG o WebP, rapporto 4:3 | sfondo, soggetto, traccia | numero gioco e orientamento linguetta |
| 01 Labirinto | canvas con muri vettoriali | SVG 360×440 | fondo, muri, usura, tratto | segmenti muri, A/X e coordinate normalizzate |
| 02 Intruso | scena SVG 760×520 | SVG illustrato | personaggi, tracce, bersagli | `actors[]`, `traces[]`, hotspot normalizzati |
| 03 Cassetto | forme HTML | SVG/PNG per oggetto | oggetti singoli, reperto, fondo | id, dimensione, posizione e z-index |
| 04 Punti | SVG 100×100 | SVG | punti, tratto, reveal | array ordinato dei punti |
| 05 Polvere | canvas 720×520 | SVG/PNG auto e vetro | sfondo, carrozzeria, vetro, maschera | coordinate pennello e maschera |
| 06 Prima/Dopo | due SVG geometrici | due SVG coerenti | stanza, oggetti varianti, marker | `differences[]` con coordinate e descrizione |
| 07 Mistero | mappa SVG | SVG illustrato | cucina, indizi, hotspot | id degli indizi e catena logica |
| 11 Tazza | canvas + overlay | immagine guida | foto, contorni, costellazioni | seed, metriche e scelta utente |
| 12 Suola | canvas + mappa usura | sagoma/illustrazione | foto, guida, quattro zone | metriche per zona e correzioni utente |

La sostituzione deve cambiare soltanto il renderer o il file grafico. ID, coordinate normalizzate, logica di completamento e dati degli hotspot restano invariati.
