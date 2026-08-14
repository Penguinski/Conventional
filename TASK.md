Voglio che tu faccia una nuova passata sostanziale sul prototipo web di CONVENTIONAL – Volume 1.

IMPORTANTE: non considerare la tua precedente versione come un'architettura da preservare a tutti i costi.

La tua precedente versione è stata la più riuscita VISIVAMENTE tra i prototipi che abbiamo testato: qualità delle illustrazioni flat, proporzioni, palette, semplicità, coerenza degli elementi e atmosfera generale sono molto vicine alla direzione che vogliamo.

Quindi:

- RIUTILIZZA liberamente il linguaggio visivo, gli SVG e gli asset precedenti che reputi validi.
- NON sentirti obbligato a conservare layout, struttura HTML, logica responsive o navigazione precedente.
- Se per ottenere un risultato migliore devi rifare CSS, JavaScript, struttura delle scene o parte del markup, fallo.
- Considera la vecchia versione una reference visiva e un deposito di asset, non una base tecnica intoccabile.

Ti allego anche il file `Numero 1 (1).md`.

LEGGILO COMPLETAMENTE PRIMA DI IMPLEMENTARE.

È un work in progress editoriale, quindi non tutto ciò che contiene finirà nel progetto finale, ma deve guidare la progettazione del prototipo.

Non limitarti a descrivere cosa faresti.
IMPLEMENTA DAVVERO IL PROTOTIPO.
Voglio poterlo aprire, usare, testare da desktop e soprattutto da smartphone.

==================================================
1. COS'È CONVENTIONAL
==================================================

Conventional è un magazine digitale indipendente dedicato all'ordinario.

Osserva situazioni, oggetti, abitudini, convenzioni sociali e piccoli attriti quotidiani che normalmente sembrano insignificanti, fino a far emergere ciò che hanno di strano, riconoscibile, assurdo, divertente o interessante.

Il Volume 1 sarà costruito attorno a un CONDOMINIO INTERATTIVO.

Non deve sembrare:
- un sito corporate;
- un normale magazine con una navbar e delle card;
- un videogioco completo;
- una planimetria immobiliare;
- una casa realistica da interior design.

Deve sembrare un ibrido tra:
- magazine digitale;
- piccolo gioco esplorativo 2D;
- casa delle bambole / teatrino;
- ambiente illustrato;
- raccolta di contenuti editoriali;
- oggetto web da curiosare.

L'utente deve avere voglia di cliccare sulle cose semplicemente per vedere cosa succede.

==================================================
2. CONCETTO GENERALE DEL PALAZZO
==================================================

La struttura definitiva prevista è:

PIANO 0
- ingresso / androne
- citofono
- cassette postali
- bacheca
- ascensore
- oggetti comuni

PIANO 1
- appartamento 1A
- appartamento 1B

PIANO 2
- appartamento 2A
- appartamento 2B

PIANO 3
- appartamento 3A
- appartamento 3B

Totale:
6 appartamenti
6 abitanti
circa 2 CONTENUTI PRINCIPALI per abitante
≈ 12 contenuti editoriali principali.

Garage/cantina e terrazzo possono esistere come spazi aggiuntivi o futuri, ma NON devono complicare il prototipo se non sono necessari.

L'ascensore è il principale sistema di navigazione verticale.

NON vogliamo una pagina che si scrolla verso il basso mostrando i piani uno sotto l'altro, perché concettualmente scorrere verso il basso mentre si sale nel palazzo è sbagliato.

L'utente arriva a un piano.
Vede il pianerottolo.
Vede due appartamenti.
Può entrare.
Può tornare nel pianerottolo.
Può prendere l'ascensore.
Può cambiare piano.

==================================================
3. PERSONAGGI / ABITANTI
==================================================

I personaggi non devono essere caricature assurde.
Devono essere persone NORMALI caratterizzate da comportamenti domestici estremamente riconoscibili.

Tre direzioni già stabilite:

A. IL MANIACO DELL'ORDINE
Casa pulitissima, oggetti allineati, superfici vuote, attenzione ossessiva a ordine e pulizia.

B. L'INCASINATO / ACCUMULATORE
Non butta quasi niente.
Casa piena di oggetti, sacchetti, vestiti, scatole, cavi, pile, contenitori, cose "che potrebbero servire".

C. ARTURO
È il personaggio dei due racconti presenti nel file.
I vicini credono sia inquietante perché di notte sentono:
- voce gutturale;
- rantoli;
- tonfi;
- passi trascinati;
- urla;
- tastiera meccanica;
- una biglia che rotola.

In realtà:
- è un normalissimo traduttore freelance italiano-francese;
- lavora di notte;
- legge le traduzioni ad alta voce;
- il cane Ugo ha problemi respiratori;
- il robot aspirapolvere sbatte contro il muro;
- usa una tastiera meccanica rumorosa;
- porta ciabatte del Grinch;
- gioca a minigolf in casa.

Questo contrasto deve essere sfruttato bene.

Gli altri tre abitanti possono essere PROVVISORIAMENTE costruiti usando archetipi realistici vicini ai profili già presenti nel quiz del file, per esempio:
- Minimalista accidentale / persona sempre "in fase di trasloco";
- Iper-sociale / persona che conosce tutti e ritira i pacchi;
- Proprietario morale / persona che conosce regolamenti, orari e questioni comuni.

NON trattarli come personaggi editoriali definitivi.
Servono soprattutto per dare varietà visiva agli appartamenti e testare l'architettura.

==================================================
4. PRINCIPIO FONDAMENTALE: DUE LIVELLI DI INTERAZIONE
==================================================

Il sito deve distinguere chiaramente tra:

A. CONTENUTI PRINCIPALI
Sono circa 2 per appartamento.

Possono essere:
- articolo;
- racconto;
- quiz;
- minigioco;
- archivio;
- esperienza interattiva;
- contenuto audio;
- contenuto visuale.

Devono poter occupare anche TUTTO LO SCHERMO.

B. MICROINTERAZIONI AMBIENTALI
Devono essercene molte di più.

Una stanza NON deve avere soltanto due cose cliccabili.

Idealmente quasi ogni oggetto interessante dovrebbe reagire.

Esempi:
- lampada → accendi/spegni;
- pianta → si muove / piccola nota;
- finestra → rumore dalla strada;
- porta → bussare;
- televisore → cambia canale;
- rubinetto → acqua;
- robot aspirapolvere → parte e sbatte;
- cane → piccolo suono;
- tastiera → clack;
- pacco → si apre;
- scarpe → piccola curiosità;
- quadro → si inclina;
- tappeto → si solleva;
- cassetto → si apre;
- frigorifero → si apre;
- telefono → vibra;
- citofono → qualcuno risponde;
- cassetta postale → esce una lettera;
- bacheca → fogli manipolabili.

Queste microinterazioni NON devono tutte aprire una modale.

Molte devono semplicemente reagire nel mondo.

Principio:
"Ho cliccato una cosa perché ero curioso → è successo qualcosa."

La sensazione di esplorazione è essenziale.

==================================================
5. NON USARE UNA SOLA MODALE PER TUTTO
==================================================

Questo è molto importante.

Progetta un vero CONTENT SYSTEM con almeno 4 modalità differenti.

TIPO 1 — MICRO REACTION
Rimane nella stanza.
Durata 1-5 secondi.
Animazione, suono, piccolo cambiamento, oggetto che si apre ecc.

TIPO 2 — SHORT CONTENT / BOTTOM SHEET
Contenuto breve:
- curiosità;
- mini testo;
- didascalia;
- mini archivio;
- breve dialogo.

Desktop:
piccolo pannello laterale o floating card.

Mobile:
bottom sheet nativo, grande e comodamente leggibile.

TIPO 3 — LONG FORM READER
Per articoli e racconti veri.

Deve essere una schermata editoriale full-screen.

NON una piccola modale con dentro 1500 parole.

Deve avere:
- breadcrumb / contesto;
- titolo;
- eventuale sottotitolo;
- tempo di lettura;
- testo molto leggibile;
- immagini / illustrazioni dove necessarie;
- larghezza riga corretta su desktop;
- font almeno 17-18 px su mobile;
- line-height generoso;
- pulsante chiarissimo per tornare ESATTAMENTE alla stanza da cui si proveniva;
- scroll indipendente;
- stato della stanza preservato tornando indietro.

TIPO 4 — FULL SCREEN EXPERIENCE
Per:
- quiz;
- minigiochi;
- esperienze narrative;
- interazioni complesse.

Occupa 100dvh.
Ha una propria UI.
Ha sempre un modo chiaro di tornare al condominio.

==================================================
6. CONTENUTI REALI DA USARE NEL PROTOTIPO
==================================================

Usa il file `Numero 1 (1).md`.

NON serve implementare tutto il file.
Serve però implementare abbastanza materiale reale da dimostrare che il sistema può gestire seriamente il magazine.

Voglio almeno questi casi:

--------------------------------------------------
A. ARTURO / RUMORI DEL VICINO
--------------------------------------------------

Usa i due racconti:

- "Racconto, POV vicino"
- "Racconto, POV Arturo"

NON limitarli a due pagine di testo separate.

Trasformali in una piccola esperienza narrativa.

Possibile direzione:

1. L'utente entra nell'appartamento sotto quello di Arturo o interagisce con il soffitto.
2. Parte "La notte".
3. Vengono presentati uno alla volta alcuni rumori:
   - voce francese;
   - rantolo;
   - TONF;
   - passi trascinati;
   - frase urlata;
   - tastiera;
   - TOCK della pallina.
4. Il sistema costruisce inizialmente la lettura inquietante del vicino.
5. Alla fine:
   "Vuoi vedere cosa stava realmente succedendo al piano di sopra?"
6. Switch di POV.
7. Gli stessi suoni vengono reinterpretati:
   - traduzione francese;
   - cane Ugo;
   - robot aspirapolvere;
   - ciabatte Grinch;
   - tastiera;
   - minigolf.

Può essere un mix tra testo, animazione e oggetti della stanza.

Deve essere divertente e chiarissimo anche senza audio reale.

Se non ci sono asset audio, puoi:
- sintetizzare semplici suoni con Web Audio API;
- usare onomatopee animate;
- predisporre una struttura facilmente sostituibile con file audio futuri.

--------------------------------------------------
B. MINIGIOCO ASCENSORE
--------------------------------------------------

Nel file c'è molto materiale basato su Hirschauer e sulla civil inattention.

Non trasformarlo in una lezione accademica.

Costruisci un minigioco breve, circa 20-60 secondi.

Esempio di struttura:

SCENA 1
Aspetti l'ascensore con altre persone.
Devi decidere se aspettare o prendere le scale.

SCENA 2
Le porte si aprono.
Devi entrare rispettando implicitamente la precedenza.

SCENA 3
Sei dentro con 1-3 persone.
Devi scegliere dove posizionarti.
Le posizioni devono mostrare la "geometria silenziosa":
diagonale, distanza massima ecc.

SCENA 4
Dove guardi?
- telefono
- display piano
- scarpe
- volto del vicino

SCENA 5
Sale un vicino che riconosci ma di cui non sai il nome.
Possibili scelte:
- buongiorno
- telefono
- meteo
- silenzio
- "che piano?"

SCENA 6
Uscita.

Alla fine genera un piccolo "referto condominiale" ironico.

Esempio:
CONTATTO VISIVO: 0,8 s
SMALL TALK PRODOTTO: 3 parole
INTIMITÀ CREATA: TRASCURABILE
RISCHIO DI CONOSCERE IL SUO NOME: 7%

Il tono deve essere Conventional: serio nella forma, leggermente assurdo nel risultato.

Il gioco deve funzionare MOLTO BENE DA TOUCH.

--------------------------------------------------
C. ARTICOLO "EVITARE I VICINI"
--------------------------------------------------

Usa il testo presente nel file.

Serve per testare il LONG FORM READER.

Può essere aperto, per esempio:
- interagendo con lo spioncino;
- incontrando il vicino sul pianerottolo;
- cliccando uno smartphone;
- da un elemento coerente dell'ambiente.

NON mostrarlo in una card minuscola.

Deve essere una vera esperienza di lettura responsive.

Puoi creare piccole interruzioni editoriali durante il testo:
- "civil inattention";
- familiar stranger;
- liking gap;
- piccola visualizzazione;
- quote card;
- semplice diagramma.

NON riscrivere arbitrariamente il contenuto.
Usa il file come fonte editoriale.

--------------------------------------------------
D. STORIA DEL BIDET
--------------------------------------------------

Il bagno di uno degli appartamenti deve avere un bidet interattivo.

Cliccandolo si apre l'articolo "Storia del bidet".

È un altro test del LONG FORM READER.

Puoi creare una testata illustrata e una timeline molto semplice:
1700 → 1800 → Seconda guerra mondiale → Italia 1975 → oggi.

L'articolo deve restare leggibile anche se è lungo.

--------------------------------------------------
E. CASI REALI DI LITI TRA VICINI
--------------------------------------------------

Usa la sezione presente nel file.

Non serve usare tutti i casi.

Selezionane 5-7 fra quelli più visivi/divertenti, preferendo quelli che nel file vengono indicati come forti o solidi.

Per esempio:
- gatto Rémi;
- vegana contro barbecue;
- gallo Maurice / galli;
- Tate Modern;
- nano da giardino;
- recinto di dispetto;
- pianista;
- altri se li reputi migliori.

Presentali come PICCOLO ARCHIVIO INTERATTIVO.

Possibile accesso:
- bacheca condominiale;
- fascicolo dell'amministratore;
- cartellina lasciata su un tavolo.

UI:
- card/fascicoli;
- paese;
- anno;
- "motivo del litigio";
- sintesi;
- elemento visivo schematico;
- avanti/indietro.

Non serve caricare immagini esterne.
Puoi rappresentare i casi con piccole illustrazioni flat.

--------------------------------------------------
F. TELEVENDITE
--------------------------------------------------

Dentro uno degli appartamenti deve esserci una TV interattiva.

Cliccandola NON aprire subito un articolo.

Trasformala in una piccola esperienza "channel surfing".

Usa alcuni gadget della sezione Televendite:
- Hawaii Chair;
- Rejuvenique;
- Shake Weight;
- Potty Putter;
- Flowbee;
- Comfort Wipe;
- ecc.

Ogni cambio canale mostra:
- prodotto;
- piccola illustrazione placeholder;
- slogan;
- breve descrizione;
- pulsante "canale successivo".

Deve sembrare una televendita assurda, ma coerente con il linguaggio grafico del sito.

--------------------------------------------------
G. QUIZ "CHE INQUILINO SEI?"
--------------------------------------------------

Nel file esiste già:
- dataset delle domande;
- scoring;
- dimensioni:
  social
  ordine
  regole
  rumore
  curiosita
  possesso

e i profili:
- Fantasma
- Impiccione
- Proprietario Morale
- Iper-sociale
- Minimalista Accidentale
- Rumoroso
- Incasinato
- Maniaco dell'Ordine

NON incorporare l'HTML originale come iframe o pagina esterna.

Estrai:
- data;
- scoring;
- risultati.

RIPROGETTA completamente la UI dentro il sistema Conventional.

Una domanda per schermata.
Bottoni touch-friendly.
Progress chiaro.
Animazioni minime.
Risultato finale ben disegnato.

IMPORTANTE:
non hardcodare "20 domande".
Usa sempre `questions.length`, perché il dataset è ancora work in progress.

Possibile risultato finale:
una scheda / targhetta / citofono / contratto / cartellino da porta che dice che tipo di inquilino sei.

Se semplice, aggiungi un pulsante per scaricare/condividere il risultato in futuro, ma NON spendere molto tempo sulla vera funzione share adesso.

==================================================
7. COME DISTRIBUIRE QUESTI CONTENUTI
==================================================

Non considero ancora definitiva la collocazione editoriale.

Puoi proporre tu una distribuzione sensata nel prototipo.

Una possibile logica:

ANDRONE
- citofono → microinterazioni
- cassette → microinterazioni
- bacheca → liti condominiali
- ascensore → minigioco ascensore

PIANEROTTOLO
- spioncino / vicino → articolo "evitare i vicini"

APPARTAMENTO ARTURO
- soffitto / rumori / scrivania / robot → esperienza doppio POV
- vari oggetti → microinterazioni

BAGNO DI UN ALTRO APPARTAMENTO
- bidet → articolo storia del bidet

SOGGIORNO
- TV → televendite

ALTRO OGGETTO
- quiz "Che inquilino sei?"

Ma se trovi una soluzione spaziale migliore, usala.

L'importante è che il contenuto sembri EMERGERE DALL'OGGETTO e non essere una card casuale appiccicata sopra la stanza.

==================================================
8. ART DIRECTION
==================================================

La tua precedente versione è la reference principale.

Mantieni la qualità delle tue illustrazioni.

Voglio:

- flat;
- illustrato;
- semplice;
- pulito;
- colorato;
- leggermente giocoso;
- bordi scuri;
- forme semplici;
- niente fotorealismo;
- niente 3D;
- niente gradienti glossy;
- niente glassmorphism;
- niente UI SaaS;
- niente look da dashboard;
- niente aesthetic videogioco fantasy;
- niente pixel art.

Il condominio può essere una RAPPRESENTAZIONE ASTRATTA.

NON deve essere architettonicamente realistico.

Puoi alterare:
- proporzioni;
- dimensione dei mobili;
- posizione delle porte;
- scala degli oggetti;

se migliora:
- leggibilità;
- composizione;
- interazione.

Pensa a ogni stanza come un piccolo TEATRINO.

Palette indicativa, non obbligatoria:
- crema caldo / off-white come base;
- mustard/giallo caldo;
- terracotta/arancio;
- verde salvia;
- blu polveroso;
- quasi nero per i contorni.

Mantieni comunque una palette controllata.

L'ambiente deve avere personalità ma gli oggetti devono essere abbastanza semplici da poter essere ridisegnati in Illustrator da due graphic designer senza settimane di lavoro.

==================================================
9. REGOLE DI RESPONSIVE DESIGN — PRIORITÀ ASSOLUTA
==================================================

IL MOBILE È PRIORITARIO.

Il prototipo precedente non era abbastanza pensato per mobile.

Questa volta NON voglio:

DESKTOP:
[stanza enorme]

MOBILE:
[la stessa identica stanza rimpicciolita fino a diventare microscopica]

È VIETATO risolvere il responsive semplicemente con:
`transform: scale(...)`
o un unico SVG 1600×900 fatto entrare dentro 375 px.

==================================================
10. RESPONSIVE DEGLI SPAZI COMUNI
==================================================

Pianerottolo, androne e ascensore devono avere composizioni realmente adattate.

DESKTOP:
i due appartamenti possono essere visibili contemporaneamente.

MOBILE:
puoi cambiare composizione.

Per esempio:
- porta A in alto;
- ascensore al centro;
- porta B sotto;

oppure una composizione orizzontale navigabile se risulta più naturale.

Non essere schiavo della disposizione desktop.

Gli asset possono essere gli stessi.
Il LAYOUT deve essere progettato appositamente.

==================================================
11. RESPONSIVE DEGLI APPARTAMENTI: MONDO + CAMERA
==================================================

Per gli interni preferisco questo principio:

L'appartamento ha un "mondo" illustrato stabile.

Desktop:
la camera vede quasi l'intera stanza.

Mobile:
NON rimpicciolire l'intera stanza.

Mostra una porzione più ravvicinata della stanza.

Dividi l'appartamento in 2-3 inquadrature / zone.

Esempio:

VIEW 1
divano + finestra

VIEW 2
tavolo + personaggio

VIEW 3
frigo + sedia

Su mobile l'utente può passare tra le zone tramite:
- swipe;
- drag;
- frecce discrete;
- CSS scroll-snap;
- o camera animata.

Scegli la soluzione più stabile e piacevole.

Preferenza:
CSS scroll-snap o un sistema di camera semplice e robusto.

NON creare un vero personaggio controllabile.
NON servono:
- collisioni;
- joystick;
- pathfinding;
- sprite walking.

Prendiamo da Pokémon l'idea dell'ambiente esplorabile, NON la complessità del game engine.

==================================================
12. VIEWPORT DA TESTARE OBBLIGATORIAMENTE
==================================================

Testa almeno:

MOBILE SMALL
375 × 812

MOBILE
390 × 844

MOBILE LARGE
430 × 932

TABLET
768 × 1024

DESKTOP
1366 × 768

DESKTOP LARGE
1440 × 900

A 375 px:
- niente testo microscopico;
- niente oggetti importanti larghi 20 px;
- niente tooltip hover-only;
- niente elementi fuori dallo schermo;
- niente overflow accidentale della pagina;
- niente pulsanti irraggiungibili;
- niente header gigantesco.

Il sito deve SEMBRARE progettato per telefono.

==================================================
13. TOUCH / MOBILE UX
==================================================

Usa pointer events quando possibile.

Target interattivi:
minimo ~44×44 CSS px anche se il disegno visivo è più piccolo.

Non affidarti all'hover.

Desktop:
hover può dare feedback aggiuntivo.

Mobile:
tap deve essere autosufficiente.

Usa:
`100dvh`
quando serve per schermate full-screen.

Considera:
`env(safe-area-inset-top)`
`env(safe-area-inset-bottom)`

NON usare:
`user-scalable=no`

Non disabilitare lo zoom del browser.

Evita gesture custom fragili.

Se usi swipe:
deve convivere bene con lo scroll verticale.

==================================================
14. COME FAR CAPIRE COSA È INTERATTIVO
==================================================

NON voglio 40 icone lampeggianti sopra gli oggetti.

L'ambiente deve rimanere bello.

Usa segnali sottili:

Desktop:
- cursor pointer;
- micro movimento hover;
- outline leggero;
- oggetto che si solleva di 2-3 px;
- ombra minima.

Mobile:
- piccola animazione iniziale solo la prima volta;
- feedback immediato al tap;
- eventualmente un piccolo "tocca gli oggetti" all'ingresso nella prima stanza.

Gli hotspot invisibili devono essere più grandi dell'oggetto quando necessario.

==================================================
15. MICROINTERAZIONI
==================================================

Voglio ALMENO 10-15 microinterazioni funzionanti nel prototipo.

Non tutte devono essere sofisticate.

Esempi:

ANDRONE
- premere più volte pulsante ascensore;
- aprire una cassetta;
- lettera che spunta;
- citofono;
- bacheca;
- lampada;
- bicicletta/campanello;
- pianta;

PIANEROTTOLO
- bussare;
- spioncino;
- pacco;
- zerbino;
- scarpe;
- interruttore;

ARTURO
- robot aspirapolvere;
- cane;
- tastiera;
- lampada;
- minigolf;
- friggitrice ad aria;
- finestra;
- ciabatte;
- porta;

ALTRI INTERNI
- TV;
- frigorifero;
- bidet;
- cassetto;
- sedia coi vestiti;
- ecc.

Quando possibile aggiungi piccoli stati.

Esempio:
prima clicchi il robot → parte.
seconda volta → sbatte.
terza → Arturo reagisce.

Questo rende l'ambiente molto più vivo.

==================================================
16. ARCHITETTURA TECNICA
==================================================

Preferenza:
HTML + CSS + JavaScript vanilla.

Motivo:
- sito statico;
- semplice da mantenere;
- facilmente pubblicabile;
- niente build complessa;
- niente framework necessario.

Se la tua precedente versione usa già una struttura semplice, puoi modificarla.

NON introdurre React/Vue/Svelte se non c'è una ragione tecnica reale.

Il progetto deve poter essere pubblicato facilmente come sito statico.

Organizza però il codice bene.

Esempio indicativo:

/index.html

/css/
  base.css
  scenes.css
  content-ui.css
  responsive.css

/js/
  app.js
  navigation.js
  scenes.js
  content-router.js
  elevator-game.js
  quiz.js
  data.js

/assets/
  svg/
  audio/
  images/

Non è obbligatorio usare esattamente questa struttura.
È più importante che il sistema sia ordinato.

==================================================
17. SISTEMA DATA-DRIVEN
==================================================

NON creare 50 `onclick=""` sparsi nel markup.

Crea una struttura dati.

Ogni elemento interattivo dovrebbe idealmente avere qualcosa del genere:

{
  id: "arturo-robot",
  type: "micro",
  action: "startRobot",
  title: "...",
  contentId: null
}

oppure:

{
  id: "bathroom-bidet",
  type: "reader",
  contentId: "storia-bidet"
}

oppure:

{
  id: "elevator",
  type: "experience",
  contentId: "elevator-game"
}

Tipi consigliati:

micro
short
reader
experience
navigation

Crea un unico content router capace di aprire il formato corretto.

==================================================
18. STATO
==================================================

Mantieni uno stato semplice:

- piano attuale;
- appartamento attuale;
- ultima vista/camera;
- microinterazioni già scoperte;
- contenuto attualmente aperto.

Quando chiudo un articolo:
devo tornare esattamente dove ero.

Quando esco da un minigioco:
devo tornare al mondo.

Quando passo di piano:
la transizione dell'ascensore deve mascherare il cambio scena.

Puoi usare sessionStorage/localStorage soltanto se semplice.

NON creare un backend.

==================================================
19. ASCENSORE COME NAVIGAZIONE
==================================================

L'ascensore deve essere una delle parti più soddisfacenti.

Quando lo chiamo:
1. feedback pulsante;
2. piccolo ritardo;
3. arrivo;
4. porte si aprono.

Quando scelgo un piano:
1. porte si chiudono;
2. breve movimento/suono;
3. indicatore cambia;
4. scena dietro cambia;
5. porte si riaprono.

Su mobile deve occupare bene lo schermo.

La pulsantiera deve essere facilmente tappabile.

Il MINIGIOCO ASCENSORE è diverso dalla normale navigazione:
può partire attraverso un evento specifico / corsa speciale / pulsante secondario.

==================================================
20. UI DEL LONG FORM READER
==================================================

Questa è una delle parti che voglio tu progetti con maggiore cura.

Desktop:
- colonna max 650-760px circa;
- molto respiro;
- eventualmente illustrazione/indice laterale;
- progress discreto;
- header compatto.

Mobile:
- padding ~20px;
- font body leggibile;
- line-height circa 1.55-1.7;
- titoli non giganteschi al punto da occupare tutto il primo viewport;
- pulsante back sempre riconoscibile;
- niente `100vh` che blocca il testo;
- normale scroll verticale.

Il reader deve poter gestire articoli anche molto lunghi.

Non sacrificare la leggibilità per mantenere la scenografia.

==================================================
21. UI DEL QUIZ
==================================================

Full-screen.

Una domanda alla volta.

Mobile first.

Evita risposte troppo piccole.

Le quattro risposte devono essere:
- leggibili;
- tappabili;
- con feedback;
- possibilmente senza richiedere scroll per una singola domanda sui telefoni comuni, se il testo lo consente.

Progress:
usa `current / questions.length`.

Risultato:
disegnalo come un oggetto del condominio.

Esempi:
- targhetta porta;
- scheda residente;
- verbale;
- cartellino citofono.

Mantieni il testo dei profili dal dataset.

==================================================
22. UI DEI MINIGIOCHI
==================================================

Ogni gioco deve avere:
- istruzione iniziale brevissima;
- stato chiaro;
- feedback immediato;
- conclusione;
- pulsante torna al condominio.

Non introdurre:
- menu inutili;
- tutorial di 5 schermate;
- punteggi complessi;
- vite;
- monete;
- sistemi da mobile game.

Sono contenuti editoriali interattivi, non un gioco free-to-play.

==================================================
23. SUONI
==================================================

Il suono può dare tantissimo al progetto.

Ma deve essere controllato.

NON autoplayare audio forte quando il sito si apre.

Il primo suono deve derivare da un gesto dell'utente.

Crea un controllo mute/unmute discreto.

Se non abbiamo file audio:
usa semplici placeholder sintetizzati / Web Audio API
oppure prepara `<audio>` facilmente sostituibili.

Suoni utili:
- DING ascensore;
- porte;
- citofono;
- bussare;
- robot;
- tastiera;
- cane;
- biglia;
- TV.

==================================================
24. PERFORMANCE
==================================================

Il progetto deve funzionare bene anche su smartphone medi.

Evita:
- canvas enormi;
- filtri blur continui;
- animazioni infinite;
- decine di box-shadow pesanti;
- SVG giganteschi con migliaia di nodi;
- immagini raster 4K senza motivo.

SVG flat semplici sono ideali.

Anima preferibilmente:
transform
opacity

==================================================
25. ACCESSIBILITÀ MINIMA
==================================================

Gli oggetti cliccabili importanti devono essere raggiungibili anche da tastiera quando sensato.

Usa:
- button reali o role appropriati;
- aria-label;
- focus-visible;
- ESC per chiudere overlay su desktop;
- pulsante visibile di chiusura sempre presente.

Rispetta `prefers-reduced-motion`.

==================================================
26. COSA NON FARE
==================================================

NON:
- creare un normale sito magazine a card;
- creare una navbar con "Home / Articles / Games / About";
- mostrare i contenuti principali tutti in un indice;
- ridurre tutto a popup con 3 righe;
- mettere hotspot fluorescenti ovunque;
- trasformare il sito in un vero RPG;
- creare un personaggio controllabile;
- usare pixel art;
- usare un unico SVG enorme scalato su mobile;
- usare layout desktop rimpicciolito;
- usare testi placeholder se nel file esiste già il contenuto reale;
- inventare fatti accademici;
- riscrivere arbitrariamente gli articoli;
- dedicare tutto il tempo agli SVG lasciando la UX incompleta.

==================================================
27. PRIORITÀ
==================================================

Se devi scegliere dove spendere tempo, l'ordine è:

1. MOBILE UX
2. NAVIGAZIONE FUNZIONANTE
3. CONTENT SYSTEM
4. INTERAZIONI
5. LONG FORM READER
6. MINIGIOCO ASCENSORE
7. QUIZ
8. QUALITÀ VISIVA
9. MICROANIMAZIONI EXTRA

La grafica è importante, ma una bellissima stanza con tre cose cliccabili e contenuti illeggibili NON è il risultato che vogliamo.

==================================================
28. SCOPE DELLA PASSATA
==================================================

Non è necessario realizzare già il Volume 1 definitivo.

Voglio un VERTICAL SLICE MOLTO CONVINCENTE.

Deve dimostrare:

- ingresso/androne funzionante;
- ascensore;
- almeno un piano residenziale;
- due porte/appartamenti visibili;
- almeno UN appartamento veramente ricco ed esplorabile;
- preferibilmente un secondo interno più semplice per dimostrare varietà;
- 10-15+ microinterazioni;
- un articolo lungo;
- un racconto / esperienza narrativa;
- un quiz;
- un minigioco;
- un archivio/curiosità;
- TV/televendita o altra esperienza breve;
- desktop;
- mobile realmente progettato.

Per i piani/appartamenti non ancora completi puoi creare preview/placeholder stilizzati.

NON riempirli con contenuti editoriali inventati soltanto per far sembrare il sito finito.

==================================================
29. FLUSSO MINIMO CHE DEVE ESSERE TESTABILE
==================================================

Voglio poter fare questa sessione:

1. apro il sito su telefono;
2. sono nell'androne;
3. tocco alcuni oggetti;
4. apro la bacheca;
5. torno indietro;
6. chiamo l'ascensore;
7. salgo al piano 1;
8. esploro le due porte;
9. entro in un appartamento;
10. swipo/tocco per esplorare più zone della stanza;
11. interagisco con almeno 5 oggetti;
12. apro un articolo lungo;
13. leggo/scorro;
14. torno alla stessa posizione nella stanza;
15. apro un contenuto interattivo;
16. completo un minigioco/quiz;
17. torno nel pianerottolo;
18. riprendo l'ascensore.

Nessun passaggio deve sembrare rotto, ambiguo o pensato esclusivamente per mouse.

==================================================
30. PRIMA DI IMPLEMENTARE
==================================================

Fai questa procedura:

A. Leggi completamente:
- il codice del tuo prototipo precedente;
- `Numero 1 (1).md`.

B. Identifica:
- asset visivi riutilizzabili;
- codice da salvare;
- codice da riscrivere;
- contenuti editoriali utili al vertical slice.

C. Definisci internamente:
- scene;
- content types;
- data model;
- responsive strategy.

D. POI IMPLEMENTA.

Non fermarti dopo l'analisi.
Non chiedermi conferma per ogni decisione.
Prendi decisioni ragionevoli e costruisci il prototipo.

==================================================
31. CRITERIO FINALE DI SUCCESSO
==================================================

Il risultato deve dare questa sensazione:

"Sto curiosando dentro un piccolo condominio illustrato.
Ogni stanza appartiene chiaramente a qualcuno.
Le cose attorno a me sembrano poter reagire.
Ogni tanto un oggetto nasconde un vero contenuto editoriale.
Posso passare senza attrito da esplorazione a lettura, gioco, storia, quiz e poi tornare nel mondo.
Su telefono sembra che qualcuno abbia davvero progettato il sito per telefono, non che abbia semplicemente rimpicciolito il desktop."

Visivamente:
mantieni la qualità illustrativa della tua prima proposta.

Interattivamente:
sii MOLTO più generoso.

A livello UI:
tratta articoli lunghi, quiz e minigiochi come parti centrali del progetto, non come popup secondari.

A livello responsive:
mobile first, layout dedicati e camera/zone per gli appartamenti.

Procedi ora con l'implementazione completa del vertical slice.