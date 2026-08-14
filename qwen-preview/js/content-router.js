// ============ CONTENT-ROUTER.JS - Gestione contenuti editoriali ============

import { CONTENT_DATA } from './data.js';

export function openReader(contentKey, title) {
  const content = CONTENT_DATA[contentKey];
  if (!content) return;
  
  const overlay = document.getElementById('readerOverlay');
  const readerTitle = document.getElementById('readerTitle');
  const readerBody = document.getElementById('readerBody');
  const readingTime = document.getElementById('readerReadingTime');
  
  readerTitle.textContent = title || content.title;
  readerBody.innerHTML = content.content;
  readingTime.textContent = content.readingTime;
  
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

export function closeReader() {
  const overlay = document.getElementById('readerOverlay');
  overlay.hidden = true;
  document.body.style.overflow = '';
}

export function openBottomSheet(title, htmlContent) {
  const sheet = document.getElementById('bottomSheet');
  const sheetTitle = document.getElementById('bottomSheetTitle');
  const sheetBody = document.getElementById('bottomSheetBody');
  
  sheetTitle.textContent = title;
  sheetBody.innerHTML = htmlContent;
  
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
}

export function closeBottomSheet() {
  const sheet = document.getElementById('bottomSheet');
  sheet.hidden = true;
  document.body.style.overflow = '';
}

export function openExperience(type) {
  let overlay, title;
  
  if (type === 'quiz') {
    overlay = document.getElementById('quizOverlay');
    title = 'Che inquilino sei?';
  } else if (type === 'elevator-game') {
    overlay = document.getElementById('elevatorGameOverlay');
    title = 'Ascensore Sociale';
  }
  
  if (overlay) {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }
}

export function closeExperience() {
  const quizOverlay = document.getElementById('quizOverlay');
  const elevatorOverlay = document.getElementById('elevatorGameOverlay');
  
  quizOverlay.hidden = true;
  elevatorOverlay.hidden = true;
  document.body.style.overflow = '';
}

// Liti condominiali archive
export function openLitiArchive() {
  const litiList = [
    { id: 'remi', title: 'Rémi il gatto condannato', location: 'Agde, Francia (2025)', summary: 'Un gatto rosso multato per sconfinamento nel giardino del vicino.' },
    { id: 'vegana', title: 'La vegana contro il barbecue', location: 'Perth, Australia (2019)', summary: 'Cilla Carden cita i vicini per l\'odore del pesce grigliato.' },
    { id: 'tate', title: 'Tate Modern "come uno zoo"', location: 'Londra, UK (2023)', summary: 'I residenti vincono contro la piattaforma panoramica che permetteva di spiare dentro casa.' },
    { id: 'nano', title: 'Il nano da giardino invasore', location: 'Surrey, UK (2023-26)', summary: 'Una coppia pianta un nano per rivendicare una striscia di prato.' },
    { id: 'maurice', title: 'Il gallo Maurice', location: 'Oléron, Francia (2019)', summary: 'Un gallo diventa simbolo nazionale dello scontro rurale-urbano.' },
    { id: 'christie', title: 'Christie v Davey', location: 'Inghilterra (1893)', summary: 'Il caso principe: musica vs. ritorsioni malevole.' }
  ];
  
  const html = `
    <div class="liti-archive" id="litiArchiveList">
      ${liti.map(l => `
        <div class="liti-card" data-liti-id="${l.id}">
          <h4>${l.title}</h4>
          <div class="meta">${l.location}</div>
          <p>${l.summary}</p>
        </div>
      `).join('')}
    </div>
    <div id="litiDetail" style="display:none;"></div>
  `;
  
  openBottomSheet('Liti Condominiali', html);
  
  // Add click handlers after DOM update
  setTimeout(() => {
    document.querySelectorAll('.liti-card').forEach(card => {
      card.addEventListener('click', () => showLitiDetail(card.dataset.litiId));
    });
  }, 100);
}

function showLitiDetail(id) {
  const details = {
    remi: {
      title: 'Rémi il gatto condannato',
      content: `
        <h3>Rémi il gatto condannato</h3>
        <p><strong>Agde, Francia — 2025-2026</strong></p>
        <p>Dominique Valdès è stata portata in tribunale perché il suo gatto rosso Rémi sconfinava nella proprietà del vicino. Il vicino accusava il gatto di aver lasciato impronte su intonaco fresco, urinato su un piumone e defecato in giardino.</p>
        <p><strong>Sentenza:</strong> 450 € di danni + 800 € spese processuali + 30 € per ogni intrusione futura.</p>
        <p>Il caso è diventato nazionale quando il vicino ha chiesto 5.700 € di penali accumulate. Il giudice ha liquidato a soli 100 €, ritenendo che le foto provassero la presenza di Rémi solo per 12 giorni.</p>
      `
    },
    vegana: {
      title: 'La vegana contro il barbecue',
      content: `
        <h3>La vegana contro il barbecue</h3>
        <p><strong>Perth, Australia — 2019</strong></p>
        <p>Cilla Carden, massaggiatrice vegana, ha citato i vicini sostenendo che grigliassero pesce e carne apposta per infastidirla ("È deliberato… tutto quello che sento è pesce").</p>
        <p>Ha presentato un ricorso di 600 pagine alla Corte Suprema dell'Australia Occidentale dopo che un tribunale inferiore aveva respinto il caso.</p>
        <p><strong>Sentenza:</strong> Ricorso respinto dal Chief Justice Peter Quinlan. I vicini hanno rimosso il barbecue per quieto vivere. Migliaia di persone hanno organizzato un barbecue di protesta sui social.</p>
      `
    },
    tate: {
      title: 'Tate Modern "come uno zoo"',
      content: `
        <h3>Tate Modern "come stare in uno zoo"</h3>
        <p><strong>Londra, Regno Unito — 2023</strong></p>
        <p>I proprietari di appartamenti Neo Bankside con pareti di vetro hanno citato la Tate Gallery perché la piattaforma panoramica al 10° piano permetteva a centinaia di migliaia di visitatori di guardare dentro le loro case.</p>
        <p><strong>Sentenza:</strong> La Corte Suprema britannica ha dato ragione ai residenti (3-2). Lord Leggatt: "Non è difficile immaginare quanto opprimente sarebbe vivere in tali circostanze — molto simile all'essere in mostra in uno zoo."</p>
      `
    },
    nano: {
      title: 'Il nano da giardino invasore',
      content: `
        <h3>Il nano da giardino "invasore"</h3>
        <p><strong>Surrey, Regno Unito — 2023-2026</strong></p>
        <p>Alison Unsted e il marito Darren hanno rimosso le piante dei vicini e piantato un nano da giardino per rivendicare una striscia di prato di 2,5 × 1 metri.</p>
        <p><strong>Sentenza:</strong> Hanno perso in primo grado ma vinto in appello all'Upper Tribunal di Londra. La giudice Cooke ha stabilito che possedevano la striscia almeno dal 2002.</p>
      `
    },
    maurice: {
      title: 'Il gallo Maurice',
      content: `
        <h3>Il gallo Maurice</h3>
        <p><strong>Oléron, Francia — 2019</strong></p>
        <p>Un gallo denunciato da due vicini pensionati per il canto troppo mattutino. Una petizione per "salvare Maurice" raccoglie oltre 100mila firme.</p>
        <p><strong>Sentenza:</strong> Il tribunale di Rochefort assolve il gallo. I vicini devono pagare 1.000 euro di risarcimento alla proprietaria.</p>
      `
    },
    christie: {
      title: 'Christie v Davey',
      content: `
        <h3>Christie v Davey (1893)</h3>
        <p><strong>Inghilterra — Il caso principe</strong></p>
        <p>Un insegnante di musica suonava per molte ore; il vicino Davey reagiva battendo sul muro, picchiando vassoi di latta, fischiando e urlando.</p>
        <p><strong>Sentenza:</strong> Il giudice North stabilì che la musica era un uso ragionevole, mentre i rumori di Davey erano fatti "deliberatamente e maliziosamente allo scopo di infastidire". Ingiunzione contro Davey.</p>
      `
    }
  };
  
  const detail = details[id];
  if (!detail) return;
  
  const listDiv = document.getElementById('litiArchiveList');
  const detailDiv = document.getElementById('litiDetail');
  
  listDiv.style.display = 'none';
  detailDiv.innerHTML = detail.content + '<button class="back-to-list-btn">← Torna alla lista</button>';
  detailDiv.style.display = 'block';
  
  detailDiv.querySelector('.back-to-list-btn').addEventListener('click', () => {
    listDiv.style.display = 'grid';
    detailDiv.style.display = 'none';
  });
}
