# Conventional — Volume 1: Lost and Found

Sito statico one-page per il primo volume ufficiale di Conventional: un magazine digitale editoriale dedicato alle tracce umane del quotidiano.

## Come aprire il sito

Apri `index.html` direttamente nel browser. Non servono build, server locali o dipendenze esterne.

## Struttura file

- `index.html`: struttura della pagina, sezioni editoriali, meta SEO e markup accessibile.
- `styles.css`: palette, layout responsive, fallback visivi e sistema tipografico.
- `script.js`: menu mobile, reveal, filtri, hotspot, quiz, download PNG e canvas finale.
- `data.js`: contenuti modificabili di inventario, note, hotspot, quiz, usura e tracce invisibili.
- `assets/img/README-images.md`: lista e indicazioni per sostituire le immagini definitive.
- `favicon.svg`: favicon tipografica con la lettera C.

## Dove modificare testi e dati

I contenuti ripetuti vivono in `data.js`: inventario, catalogo dell'usura, quiz, hotspot, field notes e blocchi sulle tracce non visibili.

I testi lunghi delle sezioni editoriali sono in `index.html`, così restano facili da leggere e impaginare.

## Dove sostituire le immagini

Inserisci i file definitivi in `assets/img/` mantenendo gli stessi nomi previsti. Il sito funziona anche senza immagini: ogni visual ha un fallback CSS con texture, retino, bordo editoriale e label tipografica.

## Immagini richieste

- `assets/img/hero-trace.jpg`
- `assets/img/house-map.jpg`
- `assets/img/og-volume-1.jpg`
- `assets/img/inventory-01-soap.jpg`
- `assets/img/inventory-02-pencil.jpg`
- `assets/img/inventory-03-bed.jpg`
- `assets/img/inventory-04-keyboard.jpg`
- `assets/img/inventory-05-frame.jpg`
- `assets/img/inventory-06-fridge.jpg`
- `assets/img/inventory-07-chair.jpg`
- `assets/img/inventory-08-spoon.jpg`
- `assets/img/inventory-09-book.jpg`
- `assets/img/inventory-10-handle.jpg`
- `assets/img/inventory-11-history.jpg`
- `assets/img/inventory-12-screenshot.jpg`
- `assets/img/inventory-13-coffee.jpg`
- `assets/img/inventory-14-shoe.jpg`
- `assets/img/inventory-15-elevator.jpg`
- `assets/img/inventory-16-roll.jpg`
- `assets/img/inventory-17-drawer.jpg`
- `assets/img/inventory-18-whatsapp.jpg`
- `assets/img/wear-01-soap.jpg`
- `assets/img/wear-02-eraser.jpg`
- `assets/img/wear-03-sponge.jpg`
- `assets/img/wear-04-tape.jpg`
- `assets/img/wear-05-pencil.jpg`
- `assets/img/wear-06-pen.jpg`
- `assets/img/wear-07-keyboard.jpg`
- `assets/img/wear-08-handle.jpg`
- `assets/img/wear-09-shoe.jpg`
- `assets/img/wear-10-cup.jpg`
- `assets/img/wear-11-book.jpg`
- `assets/img/wear-12-wall.jpg`

## Pubblicazione

Per GitHub Pages, carica la cartella su un repository e abilita Pages dalla branch principale. Per Netlify, trascina la cartella nel pannello di deploy oppure collega il repository. Non c'è comando di build.

## Checklist pre-lancio

- Sostituire le immagini placeholder con asset definitivi.
- Verificare `og-volume-1.jpg` con un'anteprima social.
- Provare menu mobile, filtri, hotspot, quiz e canvas.
- Controllare la pagina su desktop, tablet e mobile.
- Verificare che non ci siano errori in console.
- Aggiornare eventuali link social reali nel footer.
