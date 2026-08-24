import '../styles/rossiStickerAlbum.css';
import {
  applyStickerPack,
  drawStickerPack,
  rossiStickerCards,
  rossiStickerRarityLabels,
} from '../content/rossiStickerCards.js';

const storageKey = 'conventional:rossi-sticker-album:v1';
const cardsPerSpread = 8;
const totalSpreads = Math.ceil(rossiStickerCards.length / cardsPerSpread);
const cardsById = new Map(rossiStickerCards.map((card) => [card.id, card]));
const raritySymbols = { common: '●', uncommon: '◆', rare: '★' };

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readCollection() {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const owned = Object.fromEntries(Object.entries(raw.owned || {})
      .filter(([id, count]) => cardsById.has(id) && Number.isFinite(Number(count)) && Number(count) > 0)
      .map(([id, count]) => [id, Math.min(999, Math.floor(Number(count)))]));
    return { version: 1, owned, packsOpened: Math.max(0, Math.floor(Number(raw.packsOpened) || 0)) };
  } catch {
    return { version: 1, owned: {}, packsOpened: 0 };
  }
}

function saveCollection(collection) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(collection));
  } catch {
    // The current pack still works if private browsing refuses persistence.
  }
}

function motifMarkup(motif) {
  const motifs = {
    keys: '<circle cx="38" cy="42" r="16"/><circle cx="38" cy="42" r="6"/><path d="m50 53 35 34m-9-9 9-9m-18 0 8-8"/>',
    elevator: '<rect x="25" y="18" width="70" height="94" rx="5"/><path d="M60 20v90M70 42h12M70 58h12M70 74h12"/>',
    cat: '<path d="m31 38 8-20 14 14 17-14 6 22c13 9 19 24 15 41-5 21-22 32-43 27-20-5-30-22-25-42 2-11 5-20 8-28Z"/><circle cx="48" cy="52" r="3"/><circle cx="68" cy="52" r="3"/><path d="M52 64q7 6 14 0"/>',
    home: '<path d="M20 61 60 25l40 36v48H20Z"/><path d="M47 109V74h26v35"/>',
    kitchen: '<path d="M34 20h52v87H34Z"/><path d="M34 50h52M45 33h30M47 67v27M73 67v27"/>',
    building: '<path d="M25 16h70v96H25Z"/><path d="M38 31h15v17H38Zm29 0h15v17H67ZM38 60h15v17H38Zm29 0h15v17H67ZM49 89h22v23H49Z"/>',
    plant: '<path d="M38 76h44l-6 34H44Z"/><path d="M60 76C35 58 39 35 58 42c-3-25 22-28 20-5 18-9 31 12 8 26-9 5-18 9-26 13Z"/>',
    box: '<path d="m20 43 40-22 40 22-40 23Z"/><path d="M20 43v47l40 23 40-23V43M60 66v47"/>',
    light: '<path d="M39 63c-18-24-5-49 21-49s39 25 21 49c-8 10-9 16-9 22H48c0-6-1-12-9-22Z"/><path d="M48 86h24M51 98h18"/>',
    paper: '<path d="M29 14h62v100l-10-8-10 8-11-8-10 8-10-8-11 8Z"/><path d="M42 39h36M42 56h29M42 73h36"/>',
    mirror: '<path d="M60 14c24 0 38 19 33 47-5 25-17 52-33 52S32 86 27 61c-5-28 9-47 33-47Z"/><path d="m44 79 33-45"/>',
    marker: '<path d="m39 16 27 6-16 78-24 16-7-27Z"/><path d="m26 89 24 11M36 28l27 6"/>',
    ghost: '<path d="M30 110V52c0-24 13-38 30-38s30 14 30 38v58L75 99l-15 11-15-11Z"/><circle cx="50" cy="52" r="4"/><circle cx="70" cy="52" r="4"/>',
    sky: '<circle cx="78" cy="37" r="22"/><path d="M13 105 44 69l17 19 15-14 31 31Z"/>',
    dog: '<path d="M34 44 20 23l28 9c8-5 16-5 24 0l28-9-14 22c7 10 7 30 0 42-12 21-40 21-52 0-7-13-7-32 0-43Z"/><circle cx="48" cy="57" r="4"/><circle cx="72" cy="57" r="4"/><path d="M53 75q7 8 14 0"/>',
    person: '<circle cx="60" cy="34" r="20"/><path d="M27 110c3-34 13-51 33-51s30 17 33 51Z"/>',
    star: '<path d="m60 12 14 30 34 4-25 23 7 33-30-17-30 17 7-33-25-23 34-4Z"/>',
  };
  return motifs[motif] || motifs.star;
}

function renderCardArt(card) {
  if (card.asset) return `<img src="${escapeHtml(card.asset)}" alt="" draggable="false"/>`;
  return `<svg viewBox="0 0 120 128" aria-hidden="true">${motifMarkup(card.motif)}</svg>`;
}

function renderCard(card, { reveal = false, isNew = false } = {}) {
  return `<article class="rossi-sticker-card rarity--${card.rarity}${reveal ? ' is-reveal' : ''}" style="--card-color:${card.colors[0]};--card-accent:${card.colors[1]}">
    <div class="rossi-card-art">${renderCardArt(card)}</div>
    <p class="rossi-card-number">N. ${String(card.slot + 1).padStart(2, '0')}</p>
    <h3>${escapeHtml(card.title)}</h3>
    <p class="rossi-card-rarity"><span aria-hidden="true">${raritySymbols[card.rarity]}</span> ${rossiStickerRarityLabels[card.rarity]}</p>
    ${reveal ? `<strong class="rossi-card-status ${isNew ? 'is-new' : 'is-duplicate'}">${isNew ? 'Nuova!' : 'Doppione'}</strong>` : ''}
  </article>`;
}

function renderSlot(card, owned) {
  if (owned[card.id]) return `<div class="rossi-album-slot is-filled">${renderCard(card)}${owned[card.id] > 1 ? `<span class="rossi-copy-count" title="Copie trovate">×${owned[card.id]}</span>` : ''}</div>`;
  return `<div class="rossi-album-slot is-empty"><span>${String(card.slot + 1).padStart(2, '0')}</span><p>${escapeHtml(card.title)}</p></div>`;
}

function renderPage(cards, owned, label) {
  return `<section class="rossi-album-page" aria-label="${label}"><div class="rossi-album-page-grid">${cards.map((card) => renderSlot(card, owned)).join('')}</div></section>`;
}

function spreadCards(index) {
  const start = index * cardsPerSpread;
  return rossiStickerCards.slice(start, start + cardsPerSpread);
}

function renderSpread(index, owned) {
  const cards = spreadCards(index);
  return `${renderPage(cards.slice(0, 4), owned, `Pagina ${index * 2 + 1}`)}${renderPage(cards.slice(4, 8), owned, `Pagina ${index * 2 + 2}`)}`;
}

function renderAlbum(collection, spreadIndex) {
  const collected = Object.keys(collection.owned).length;
  return `<div class="rossi-album-overlay" role="dialog" aria-modal="true" aria-labelledby="rossi-album-title">
    <section class="rossi-album-shell">
      <header>
        <div><p>CASA ROSSI PRESENTA</p><h1 id="rossi-album-title">Piccole glorie condominiali</h1></div>
        <p class="rossi-album-progress" data-album-progress><strong>${collected}</strong> / ${rossiStickerCards.length} figurine</p>
      </header>
      <div class="rossi-album-spread" data-sticker-spread>${renderSpread(spreadIndex, collection.owned)}</div>
      <footer>
        <button type="button" data-album-prev aria-label="Pagina precedente"${spreadIndex === 0 ? ' disabled' : ''}>←</button>
        <span data-album-counter>${spreadIndex + 1} / ${totalSpreads}</span>
        <button class="rossi-pack-cta" type="button" data-open-pack>SBUSTA UNA BUSTINA</button>
        <button type="button" data-album-next aria-label="Pagina successiva"${spreadIndex === totalSpreads - 1 ? ' disabled' : ''}>→</button>
      </footer>
      <button class="rossi-album-close overlay-close" type="button" data-album-close aria-label="Chiudi l’album"><span aria-hidden="true">×</span></button>
    </section>
  </div>`;
}

function renderPackOverlay() {
  return `<div class="rossi-pack-overlay" data-pack-stage="sealed" role="dialog" aria-modal="true" aria-labelledby="rossi-pack-title">
    <div class="rossi-pack-body">
      <div class="rossi-pack-sealed">
        <p id="rossi-pack-title">UNA BUSTINA NUOVA</p>
        <div class="rossi-packet">
          <div class="rossi-packet-tear" data-pack-tear role="button" tabindex="0" aria-label="Trascina lateralmente per aprire la bustina"><span></span><b>STRAPPA QUI</b></div>
          <div class="rossi-packet-face"><span>5</span><strong>PICCOLE<br/>GLORIE</strong><small>FIGURINE CONDOMINIALI</small></div>
        </div>
        <p class="rossi-pack-instruction">Trascina il bordo superiore per aprire</p>
      </div>
      <div class="rossi-pack-reveal" data-pack-reveal aria-live="polite"></div>
      <button class="rossi-pack-close overlay-close" type="button" data-pack-close aria-label="Chiudi la bustina"><span aria-hidden="true">×</span></button>
    </div>
  </div>`;
}

function renderReveal(reveal, index, total) {
  return `<p class="rossi-reveal-count">FIGURINA ${index + 1} / ${total}</p>
    <button class="rossi-reveal-card" type="button" data-reveal-card aria-label="${index === total - 1 ? 'Metti le figurine nell’album' : 'Mostra la prossima figurina'}">
      ${renderCard(reveal.card, { reveal: true, isNew: reveal.isNew })}
    </button>
    <p class="rossi-reveal-help">${index === total - 1 ? 'Tocca per metterle nell’album' : 'Tocca o scorri di lato'}</p>`;
}

export function createRossiStickerAlbum({ host, background, audio }) {
  let overlay = null;
  let previousFocus = null;
  let collection = readCollection();
  let spreadIndex = 0;
  let pendingPack = null;
  let tearDrag = null;
  let revealDrag = null;
  let suppressRevealClickUntil = 0;

  function updateAlbum() {
    if (!overlay) return;
    overlay.querySelector('[data-sticker-spread]').innerHTML = renderSpread(spreadIndex, collection.owned);
    overlay.querySelector('[data-album-prev]').disabled = spreadIndex === 0;
    overlay.querySelector('[data-album-next]').disabled = spreadIndex === totalSpreads - 1;
    overlay.querySelector('[data-album-counter]').textContent = `${spreadIndex + 1} / ${totalSpreads}`;
    overlay.querySelector('[data-album-progress]').innerHTML = `<strong>${Object.keys(collection.owned).length}</strong> / ${rossiStickerCards.length} figurine`;
  }

  function goToSpread(index) {
    spreadIndex = Math.max(0, Math.min(totalSpreads - 1, index));
    updateAlbum();
  }

  function closePack() {
    const packOverlay = overlay?.querySelector('.rossi-pack-overlay');
    if (!packOverlay) return false;
    tearDrag = null;
    revealDrag = null;
    pendingPack = null;
    packOverlay.classList.add('is-closing');
    window.setTimeout(() => packOverlay.remove(), 160);
    overlay.querySelector('[data-open-pack]')?.focus({ preventScroll: true });
    return true;
  }

  function showReveal() {
    if (!pendingPack || !overlay) return;
    const packOverlay = overlay.querySelector('.rossi-pack-overlay');
    packOverlay.dataset.packStage = 'reveal';
    packOverlay.querySelector('[data-pack-reveal]').innerHTML = renderReveal(pendingPack.reveals[pendingPack.index], pendingPack.index, pendingPack.reveals.length);
    packOverlay.querySelector('[data-reveal-card]')?.focus({ preventScroll: true });
  }

  function tearOpen() {
    if (!pendingPack || pendingPack.stage !== 'sealed') return;
    pendingPack.stage = 'opening';
    audio?.playEffect?.('pack');
    const packOverlay = overlay.querySelector('.rossi-pack-overlay');
    packOverlay.dataset.packStage = 'opening';
    window.setTimeout(showReveal, 300);
  }

  function finishPack() {
    if (!pendingPack) return;
    collection = {
      version: 1,
      owned: pendingPack.nextOwned,
      packsOpened: collection.packsOpened + 1,
    };
    saveCollection(collection);
    const lastSlot = Math.max(...pendingPack.reveals.filter((item) => item.isNew).map((item) => item.card.slot), -1);
    if (lastSlot >= 0) spreadIndex = Math.floor(lastSlot / cardsPerSpread);
    closePack();
    updateAlbum();
  }

  function advanceReveal() {
    if (!pendingPack || pendingPack.stage !== 'opening') return;
    if (pendingPack.index >= pendingPack.reveals.length - 1) { finishPack(); return; }
    pendingPack.index += 1;
    showReveal();
  }

  function openPack() {
    if (!overlay || pendingPack) return;
    const cards = drawStickerPack();
    const result = applyStickerPack(collection.owned, cards);
    pendingPack = { cards, reveals: result.reveals, nextOwned: result.owned, index: 0, stage: 'sealed' };
    const template = document.createElement('template');
    template.innerHTML = renderPackOverlay();
    const packOverlay = template.content.firstElementChild;
    overlay.append(packOverlay);
    window.requestAnimationFrame(() => packOverlay.classList.add('is-open'));
    packOverlay.querySelector('[data-pack-tear]')?.focus({ preventScroll: true });
  }

  function finishTearDrag(event) {
    if (!tearDrag || (event?.pointerId != null && event.pointerId !== tearDrag.pointerId)) return;
    const { target, pointerId, progress } = tearDrag;
    tearDrag = null;
    if (target.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId);
    if (progress >= .42) tearOpen();
    else {
      target.style.setProperty('--tear-progress', '0');
      target.style.setProperty('--tear-offset', '0px');
    }
  }

  function finishRevealDrag(event) {
    if (!revealDrag || (event?.pointerId != null && event.pointerId !== revealDrag.pointerId)) return;
    const { target, pointerId, delta } = revealDrag;
    revealDrag = null;
    target.style.removeProperty('--reveal-dx');
    if (target.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId);
    if (Math.abs(delta) > 46) {
      suppressRevealClickUntil = performance.now() + 350;
      advanceReveal();
    }
  }

  function handlePointerDown(event) {
    const tear = event.target.closest('[data-pack-tear]');
    if (tear && pendingPack?.stage === 'sealed' && event.button <= 0) {
      event.preventDefault();
      tearDrag = { target: tear, pointerId: event.pointerId, startX: event.clientX, progress: 0 };
      tear.setPointerCapture(event.pointerId);
      return;
    }
    const revealCard = event.target.closest('[data-reveal-card]');
    if (revealCard && event.button <= 0) {
      revealDrag = { target: revealCard, pointerId: event.pointerId, startX: event.clientX, delta: 0 };
      revealCard.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event) {
    if (tearDrag && event.pointerId === tearDrag.pointerId) {
      event.preventDefault();
      const width = tearDrag.target.getBoundingClientRect().width;
      const distance = Math.abs(event.clientX - tearDrag.startX);
      tearDrag.progress = Math.min(1, distance / Math.max(80, width * .55));
      tearDrag.target.style.setProperty('--tear-progress', String(tearDrag.progress));
      tearDrag.target.style.setProperty('--tear-offset', `${Math.min(120, distance)}px`);
      return;
    }
    if (revealDrag && event.pointerId === revealDrag.pointerId) {
      event.preventDefault();
      revealDrag.delta = event.clientX - revealDrag.startX;
      revealDrag.target.style.setProperty('--reveal-dx', `${Math.max(-105, Math.min(105, revealDrag.delta))}px`);
    }
  }

  function close() {
    if (!overlay) return false;
    if (closePack()) return true;
    const closing = overlay;
    overlay = null;
    closing.classList.add('is-closing');
    window.setTimeout(() => closing.remove(), 180);
    background?.removeAttribute('inert');
    previousFocus?.focus({ preventScroll: true });
    return true;
  }

  function handleClick(event) {
    if (event.target === overlay || event.target.closest('[data-album-close]')) { close(); return; }
    if (event.target.closest('[data-pack-close]')) { closePack(); return; }
    if (event.target.closest('[data-album-prev]')) { goToSpread(spreadIndex - 1); return; }
    if (event.target.closest('[data-album-next]')) { goToSpread(spreadIndex + 1); return; }
    if (event.target.closest('[data-open-pack]')) { openPack(); return; }
    if (event.target.closest('[data-pack-tear]') && event.detail === 0) { tearOpen(); return; }
    if (event.target.closest('[data-reveal-card]') && performance.now() >= suppressRevealClickUntil) advanceReveal();
  }

  function open(trigger) {
    if (overlay) return;
    previousFocus = trigger ?? document.activeElement;
    collection = readCollection();
    spreadIndex = 0;
    const template = document.createElement('template');
    template.innerHTML = renderAlbum(collection, spreadIndex);
    overlay = template.content.firstElementChild;
    overlay.addEventListener('click', handleClick);
    overlay.addEventListener('pointerdown', handlePointerDown);
    overlay.addEventListener('pointermove', handlePointerMove);
    overlay.addEventListener('pointerup', (event) => { finishTearDrag(event); finishRevealDrag(event); });
    overlay.addEventListener('pointercancel', (event) => { finishTearDrag(event); finishRevealDrag(event); });
    overlay.addEventListener('lostpointercapture', (event) => { finishTearDrag(event); finishRevealDrag(event); }, true);
    host.append(overlay);
    background?.setAttribute('inert', '');
    window.requestAnimationFrame(() => overlay?.classList.add('is-open'));
    overlay.querySelector('[data-open-pack]')?.focus({ preventScroll: true });
  }

  function handleKeydown(event) {
    if (!overlay) return false;
    if (event.key === 'Escape') close();
    else if (!pendingPack && event.key === 'ArrowLeft') goToSpread(spreadIndex - 1);
    else if (!pendingPack && event.key === 'ArrowRight') goToSpread(spreadIndex + 1);
    else if (pendingPack?.stage === 'sealed' && (event.key === 'Enter' || event.key === ' ')) tearOpen();
    else return false;
    event.preventDefault();
    return true;
  }

  return { open, close, handleKeydown };
}
