import '../styles/mariaJunkDrawer.css';
import memoryAssetSource from '../assets/cassetto.svg?raw';
import packetAssetUrl from '../assets/bustina.svg';
import { rossiStickerCards } from '../content/rossiStickerCards.js';

const pairCount = 6;
let memoryAssetDocument = null;

const memoryStickerIds = ['landing-cat', 'maria-biscuits', 'neighbors-parcel', 'stair-light', 'night-intercom'];
const memoryStickers = memoryStickerIds.map((id) => rossiStickerCards.find((card) => card.id === id)).filter(Boolean);

const memoryItems = [
  { id: 'thread-spool', label: 'rocchetto di filo', asset: 'memory-thread-spool', viewBox: '45 75 130 145' },
  { id: 'button', label: 'bottone', asset: 'memory-button', viewBox: '235 85 130 130' },
  { id: 'scissors', label: 'forbicine', asset: 'memory-scissors', viewBox: '425 75 130 145' },
  { id: 'safety-pin', label: 'spilla di sicurezza', asset: 'memory-safety-pin', viewBox: '625 75 135 130' },
  { id: 'battery', label: 'pila', asset: 'memory-battery', viewBox: '825 75 110 145' },
  { id: 'paperclip', label: 'graffetta', asset: 'memory-paperclip', viewBox: '995 75 130 145' },
];

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function memoryGroupMarkup(assetId) {
  if (!memoryAssetDocument) {
    memoryAssetDocument = new DOMParser().parseFromString(memoryAssetSource, 'image/svg+xml');
  }
  const sourceGroup = memoryAssetDocument.getElementById(assetId);
  if (!sourceGroup) throw new Error(`Memory asset group not found: ${assetId}`);

  const clone = sourceGroup.cloneNode(true);
  clone.removeAttribute('id');
  const inheritedAttributes = ['stroke', 'stroke-linecap', 'stroke-linejoin'];
  let ancestor = sourceGroup.parentElement;
  while (ancestor && ancestor.tagName.toLowerCase() !== 'svg') {
    inheritedAttributes.forEach((attribute) => {
      if (!clone.hasAttribute(attribute) && ancestor.hasAttribute(attribute)) clone.setAttribute(attribute, ancestor.getAttribute(attribute));
    });
    ancestor = ancestor.parentElement;
  }
  return new XMLSerializer().serializeToString(clone);
}

function assetSvg(assetId, viewBox) {
  return `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${memoryGroupMarkup(assetId)}</svg>`;
}

function cardSvg(item) {
  return assetSvg(item.asset, item.viewBox);
}

function backSvg() {
  return assetSvg('memory-card-back', '330 280 140 200');
}

function stickerMotif(motif) {
  const motifs = {
    cat: '<path d="m31 38 8-20 14 14 17-14 6 22c13 9 19 24 15 41-5 21-22 32-43 27-20-5-30-22-25-42 2-11 5-20 8-28Z"/><circle cx="48" cy="52" r="3"/><circle cx="68" cy="52" r="3"/><path d="M52 64q7 6 14 0"/>',
    kitchen: '<path d="M34 20h52v87H34Z"/><path d="M34 50h52M45 33h30M47 67v27M73 67v27"/>',
    box: '<path d="m20 43 40-22 40 22-40 23Z"/><path d="M20 43v47l40 23 40-23V43M60 66v47"/>',
    light: '<path d="M39 63c-18-24-5-49 21-49s39 25 21 49c-8 10-9 16-9 22H48c0-6-1-12-9-22Z"/><path d="M48 86h24M51 98h18"/>',
    building: '<path d="M25 16h70v96H25Z"/><path d="M38 31h15v17H38Zm29 0h15v17H67ZM38 60h15v17H38Zm29 0h15v17H67ZM49 89h22v23H49Z"/>',
  };
  return motifs[motif] || motifs.building;
}

function renderSticker(card, index) {
  return `<article class="memory-sticker" style="--sticker-color:${card.colors[0]};--sticker-accent:${card.colors[1]};--sticker-index:${index}">
    <svg viewBox="0 0 120 128" aria-hidden="true">${stickerMotif(card.motif)}</svg>
    <span>N. ${String(card.slot + 1).padStart(2, '0')}</span><strong>${card.title}</strong>
  </article>`;
}

function packetSvg() {
  return `<img class="memory-packet-art" src="${packetAssetUrl}" alt="" aria-hidden="true">`;
}

function renderCard(item, index) {
  return `<button class="memory-card" type="button" data-memory-card data-memory-index="${index}" aria-label="Carta ${index + 1} coperta">
    <span class="memory-card__inner">
      <span class="memory-card__face memory-card__face--back">${backSvg()}</span>
      <span class="memory-card__face memory-card__face--front">${cardSvg(item)}</span>
    </span>
  </button>`;
}

function renderDrawer(deck) {
  return `<div class="junk-drawer-overlay" role="dialog" aria-modal="true" aria-labelledby="junk-drawer-title">
    <section class="junk-drawer-shell">
      <header><p>IL CASSETTO DEL CAOS</p><h1 id="junk-drawer-title">Memory</h1><span class="junk-drawer-feedback" data-memory-feedback aria-live="polite">Trova le coppie e recupera la vecchia bustina di figurine tra le cianfrusaglie.</span></header>
      <div class="junk-drawer-tray" data-memory-tray>
        <div class="memory-grid" role="group" aria-label="Carte del Memory">${deck.map(renderCard).join('')}</div>
        <section class="memory-reward" data-memory-reward hidden aria-label="Vecchia bustina di figurine trovata">
          <p>Eccola.</p>
          <button class="memory-packet" type="button" data-memory-packet aria-label="Apri la vecchia bustina di figurine">
            ${packetSvg()}<span>Apri la bustina</span>
          </button>
          <div class="memory-packet-contents" data-memory-packet-contents hidden>
            <div class="memory-stickers" aria-label="Le cinque figurine trovate">${memoryStickers.map(renderSticker).join('')}</div>
            <p class="memory-rossi-invite">Vuoi sbustarne altre? Vai all’album della famiglia Rossi.</p>
          </div>
        </section>
      </div>
      <button class="junk-drawer-close overlay-close" type="button" data-junk-close aria-label="Chiudi il cassetto"><span aria-hidden="true">×</span></button>
    </section>
  </div>`;
}

export function createMariaJunkDrawer({ host, background }) {
  let overlay = null;
  let previousFocus = null;
  let memory = null;

  function clearTimers() {
    if (!memory) return;
    if (memory.mismatchTimer) window.clearTimeout(memory.mismatchTimer);
    if (memory.packetTimer) window.clearTimeout(memory.packetTimer);
    memory.removalTimers.forEach((timer) => window.clearTimeout(timer));
    memory.mismatchTimer = null;
    memory.packetTimer = null;
    memory.removalTimers.clear();
  }

  function close({ restoreFocus = true } = {}) {
    if (!overlay) return false;
    clearTimers();
    const closing = overlay;
    overlay = null;
    memory = null;
    closing.classList.add('is-closing');
    window.setTimeout(() => closing.remove(), 180);
    background?.removeAttribute('inert');
    if (restoreFocus) previousFocus?.focus({ preventScroll: true });
    return true;
  }

  function updateCardLabel(card, index, flipped) {
    const item = memory.deck[index];
    card.setAttribute('aria-label', flipped ? `Carta ${index + 1}: ${item.label}` : `Carta ${index + 1} coperta`);
  }

  function setFlipped(index, flipped) {
    const card = overlay?.querySelector(`[data-memory-index="${index}"]`);
    if (!card) return;
    card.classList.toggle('is-flipped', flipped);
    updateCardLabel(card, index, flipped);
  }

  function removeMatchedPair(firstIndex, secondIndex) {
    [firstIndex, secondIndex].forEach((index, pairIndex) => {
      const card = overlay?.querySelector(`[data-memory-index="${index}"]`);
      if (!card) return;
      card.style.setProperty('--memory-away-x', pairIndex === 0 ? '-28%' : '28%');
      card.style.setProperty('--memory-away-y', index < 6 ? '-18%' : '18%');
      card.classList.add('is-matched');
      const timer = window.setTimeout(() => {
        card.classList.add('is-removed');
        card.disabled = true;
        card.setAttribute('aria-hidden', 'true');
        memory?.removalTimers.delete(timer);
      }, 270);
      memory.removalTimers.add(timer);
    });
  }

  function revealReward() {
    if (!overlay || !memory) return;
    memory.completed = true;
    const reward = overlay.querySelector('[data-memory-reward]');
    reward?.removeAttribute('hidden');
    window.requestAnimationFrame(() => reward?.classList.add('is-visible'));
  }

  function openPacket() {
    if (!overlay || !memory?.completed || memory.packetOpened) return;
    memory.packetOpened = true;
    const reward = overlay.querySelector('[data-memory-reward]');
    const packet = overlay.querySelector('[data-memory-packet]');
    packet.disabled = true;
    reward.classList.add('is-opening');
    overlay.querySelector('[data-memory-feedback]').textContent = 'Eccola.';
    memory.packetTimer = window.setTimeout(() => {
      if (!overlay || !memory) return;
      reward.classList.add('is-opened');
      const contents = overlay.querySelector('[data-memory-packet-contents]');
      contents.removeAttribute('hidden');
      window.requestAnimationFrame(() => contents.classList.add('is-visible'));
      memory.packetTimer = null;
    }, 360);
  }

  function resolvePair() {
    const { firstIndex, secondIndex } = memory;
    const first = memory.deck[firstIndex];
    const second = memory.deck[secondIndex];
    if (first.id === second.id) {
      memory.matches += 1;
      removeMatchedPair(firstIndex, secondIndex);
      const lastPair = memory.matches === pairCount;
      memory.firstIndex = null;
      memory.secondIndex = null;
      memory.locked = false;
      if (lastPair) window.setTimeout(revealReward, 330);
      return;
    }
    memory.mismatchTimer = window.setTimeout(() => {
      setFlipped(firstIndex, false);
      setFlipped(secondIndex, false);
      overlay?.querySelector(`[data-memory-index="${firstIndex}"]`)?.classList.remove('is-mismatch');
      overlay?.querySelector(`[data-memory-index="${secondIndex}"]`)?.classList.remove('is-mismatch');
      memory.mismatchTimer = null;
      memory.firstIndex = null;
      memory.secondIndex = null;
      memory.locked = false;
    }, 520);
  }

  function handleCardClick(card) {
    if (!memory || memory.locked || memory.completed || card.disabled || card.classList.contains('is-removed') || card.classList.contains('is-flipped')) return;
    const index = Number(card.dataset.memoryIndex);
    setFlipped(index, true);
    if (memory.firstIndex == null) {
      memory.firstIndex = index;
      return;
    }
    memory.secondIndex = index;
    memory.locked = true;
    if (memory.deck[memory.firstIndex].id !== memory.deck[memory.secondIndex].id) {
      overlay?.querySelector(`[data-memory-index="${memory.firstIndex}"]`)?.classList.add('is-mismatch');
      card.classList.add('is-mismatch');
    }
    resolvePair();
  }

  function open(trigger) {
    if (overlay) return;
    previousFocus = trigger ?? document.activeElement;
    memory = {
      deck: shuffle(memoryItems.flatMap((item) => [item, item])),
      firstIndex: null,
      secondIndex: null,
      locked: false,
      matches: 0,
      completed: false,
      packetOpened: false,
      packetTimer: null,
      mismatchTimer: null,
      removalTimers: new Set(),
    };
    const template = document.createElement('template');
    template.innerHTML = renderDrawer(memory.deck);
    overlay = template.content.firstElementChild;
    overlay.addEventListener('click', (event) => {
      const card = event.target.closest('[data-memory-card]');
      if (card) { handleCardClick(card); return; }
      if (event.target === overlay || event.target.closest('[data-junk-close]')) { close(); return; }
      if (event.target.closest('[data-memory-packet]')) { openPacket(); return; }
    });
    host.append(overlay);
    background?.setAttribute('inert', '');
    window.requestAnimationFrame(() => overlay?.classList.add('is-open'));
    overlay.querySelector('[data-junk-close]')?.focus({ preventScroll: true });
  }

  function handleKeydown(event) {
    if (!overlay || event.key !== 'Escape') return false;
    event.preventDefault();
    close();
    return true;
  }

  return { open, close, handleKeydown };
}
