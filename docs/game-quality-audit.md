# Audit funzionale dei giochi

| N. | Gioco | Stato | Motivo operativo |
|---:|---|---|---|
| 01 | Labirinto matto | REBUILD | Crash pointer, arrivo calcolato su stato arretrato, classificazione troppo semplice. |
| 02 | Trova l'intruso | REBUILD CON PLACEHOLDER | Griglia testuale; relazione spaziale e pan/zoom non sono realmente giocabili. |
| 03 | Il cassetto disordinato | REBUILD | Spostamento fisso, soglia arbitraria e reperto denunciato dallo stile. |
| 04 | Collega i punti | REBUILD | Quindici tap separati invece di un gesto continuo. |
| 05 | Lascia un segno | REBUILD | Crash pointer ed export diverso dalla composizione visibile. |
| 06 | Prima / Dopo | REBUILD CON PLACEHOLDER | Hotspot senza differenze grafiche corrispondenti. |
| 07 | Il caso dei piatti | REBUILD | Indizi solo testuali, cancello dei tre indizi e soluzione quasi dichiarata. |
| 08 | Cinque tracce | KEEP | Motore valido; servono dizionario, tastiera, perdita e salvataggio versionati. |
| 09 | Parole incrociate | KEEP | Griglia valida; serve navigazione parola/casella e UX mobile. |
| 10 | Scontrino umano | REBUILD | Risposte non determinano righe distinte e manca navigazione indietro. |
| 11 | Fondo di tazza | REBUILD CON PLACEHOLDER | Analisi reale minima ma esiti binari e nessuna scelta interpretativa. |
| 12 | Il piede sa | REBUILD CON PLACEHOLDER | Interfaccia duplicata dal caffè e analisi non separata per zona. |

## Infrastruttura condivisa

- REBUILD: motore pointer con coordinate estratte nel listener, ref per il tratto, rendering per frame e gestione completa della capture.
- REBUILD: error boundary globale e per singolo gioco.
- REBUILD: linguette card con forma e testo separati.
- REMOVE: menu hamburger, bacheca cloud non configurata, nickname tecnico e testo backend nel footer.

## Baseline riprodotta

Lint, typecheck, test unitari e build risultavano verdi, ma i canvas conservavano l'evento React dentro updater asincroni. La suite E2E non poteva partire perché mancavano gli eseguibili Playwright: il gate E2E precedente non costituiva quindi una prova disponibile del comportamento reale.

## Esito della riparazione

Tutti i dodici interventi indicati nella tabella sono stati implementati. Le voci `REBUILD CON PLACEHOLDER` restano volutamente geometriche, ma non hanno meccaniche sospese: hotspot, livelli, trascinamenti, zoom, scelte e stati finali sono operativi. I giochi 08 e 09 hanno mantenuto il nucleo logico esistente con dizionario/persistenza e navigazione mobile ricostruiti.

Il difetto canvas è stato rimosso con un solo motore pointer condiviso. Le coordinate vengono estratte nel listener, i tratti vivono in ref, il rendering è schedulato con `requestAnimationFrame`, la capture copre `up`, `cancel` e `lostpointercapture`, e la risoluzione segue DPR e resize. Una seconda correzione emersa dagli E2E conserva sincronicamente l'ultimo progresso prima della scrittura IndexedDB, evitando la perdita dell'ultimo completamento durante un reload immediato.

Stato finale verificato: `IMPLEMENTED AND TESTED` per N. 01–12.
