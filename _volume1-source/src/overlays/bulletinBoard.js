import { createBulletinBoardStore } from '../interactions/bulletinBoardStore.js';
import { attachPostItDrawing, renderStrokes, sanitizeStrokes } from '../interactions/postItDrawing.js';
import { mergePostItRecord } from '../interactions/postItState.js';
import { createNeighborQuiz } from './neighborQuiz.js';

function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function rotationFor(id) { return (([...String(id)].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 9) - 4) * 0.45; }

export function createBulletinBoard({ host, background, boardScene, store = createBulletinBoardStore() }) {
  const rows = new Map();
  let overlay = null;
  let surface = null;
  let previousFocus = null;
  let draft = null;
  let drawing = null;
  let drag = null;
  let ready = false;
  let generation = 0;
  const pendingMoves = new Set();
  const renderedStrokeSignatures = new WeakMap();

  const quiz = createNeighborQuiz({
    host,
    onClose: () => {
      overlay?.classList.remove('is-quiz-open');
      overlay?.querySelector('.neighbor-quiz-note')?.focus({ preventScroll: true });
    },
  });

  function maximumZ() { return Math.max(0, ...[...rows.values()].map((row) => Number(row.z_index) || 0)); }
  function setStatus(message = '', state = '') {
    const node = overlay?.querySelector('[data-board-status]');
    if (!node) return;
    node.textContent = message;
    node.dataset.state = state;
  }

  function positionPostIt(element, row) {
    element.style.left = `${clamp(Number(row.x), 0, 1) * 100}%`;
    element.style.top = `${clamp(Number(row.y), 0, 1) * 100}%`;
    element.style.zIndex = String(row.z_index);
    element.style.setProperty('--post-it-rotation', `${rotationFor(row.id)}deg`);
  }

  function renderStrokeLayer(element, strokes) {
    const sanitized = sanitizeStrokes(strokes);
    const signature = JSON.stringify(sanitized);
    if (renderedStrokeSignatures.get(element) === signature) return;
    renderStrokes(element.querySelector('svg'), sanitized);
    renderedStrokeSignatures.set(element, signature);
  }

  function makePostIt(row) {
    const element = document.createElement('article');
    element.className = 'shared-post-it';
    element.dataset.postItId = row.id;
    element.tabIndex = 0;
    element.setAttribute('aria-label', row.owner_id === store.ownerId ? 'Il tuo post-it. Trascina per spostarlo.' : 'Post-it condiviso. Trascina per spostarlo.');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    element.append(svg);
    renderStrokeLayer(element, row.strokes);
    positionPostIt(element, row);
    return element;
  }

  function renderRows() {
    if (!surface) return;
    const existing = new Map([...surface.querySelectorAll('[data-post-it-id]')].map((node) => [node.dataset.postItId, node]));
    existing.delete('draft');
    for (const row of [...rows.values()].sort((a, b) => a.z_index - b.z_index)) {
      let element = existing.get(row.id);
      if (!element) {
        element = makePostIt(row);
        surface.append(element);
      } else {
        renderStrokeLayer(element, row.strokes);
        positionPostIt(element, row);
        existing.delete(row.id);
      }
    }
    existing.forEach((node) => node.remove());
    const pad = overlay.querySelector('[data-board-new]');
    const unavailable = !ready || Boolean(draft);
    pad.disabled = unavailable;
    pad.classList.toggle('is-used', unavailable);
  }

  function mergeRows(data) {
    rows.clear();
    for (const row of data ?? []) rows.set(row.id, mergePostItRecord({}, row));
    renderRows();
  }

  async function sync(syncGeneration = generation) {
    try {
      const data = await store.load();
      if (!overlay || syncGeneration !== generation) return;
      ready = true;
      mergeRows(data);
      setStatus('Bacheca sincronizzata', 'ready');
    } catch (error) {
      console.error(error);
      if (!overlay || syncGeneration !== generation) return;
      setStatus('Impossibile sincronizzare la bacheca.', 'error');
    }
  }

  function handleRealtime(payload) {
    if (!overlay) return;
    const row = payload.new;
    if (payload.eventType === 'DELETE') rows.delete(payload.old.id);
    else if (row?.id) {
      const current = rows.get(row.id);
      const merged = mergePostItRecord(current, row);
      if ((drag?.id === row.id || pendingMoves.has(row.id)) && current) {
        merged.x = current.x;
        merged.y = current.y;
        merged.z_index = current.z_index;
      }
      rows.set(row.id, merged);
    }
    renderRows();
  }

  function createDraft() {
    if (!ready || draft) return;
    const compactLandscape = window.matchMedia?.('(orientation: landscape) and (max-width: 900px)').matches === true;
    draft = { id: 'draft', x: 0.5, y: compactLandscape ? 0.43 : 0.52, z_index: Math.min(2000000000, maximumZ() + 1), strokes: [] };
    const element = makePostIt(draft);
    element.classList.add('is-drawing');
    element.removeAttribute('tabindex');
    const controls = document.createElement('div');
    controls.className = 'post-it-drawing-controls';
    controls.innerHTML = '<button type="button" data-board-action="reset-drawing">Ricomincia</button><button type="button" data-board-action="publish-drawing">Lascia qui</button>';
    element.append(controls);
    surface.append(element);
    drawing = attachPostItDrawing(element.querySelector('svg'), (strokes) => { draft.strokes = strokes; });
    renderRows();
    element.querySelector('svg').focus?.({ preventScroll: true });
  }

  async function publishDraft() {
    const strokes = drawing?.getStrokes() ?? [];
    if (!draft || !strokes.length) {
      setStatus('Disegna qualcosa prima di lasciare il post-it.', 'error');
      return;
    }
    const publishGeneration = generation;
    setStatus('Sto lasciando il post-it…', 'loading');
    try {
      const row = await store.createPostIt({ strokes, x: draft.x, y: draft.y, zIndex: draft.z_index });
      if (!overlay || publishGeneration !== generation) return;
      surface.querySelector('[data-post-it-id="draft"]')?.remove();
      draft = null; drawing = null;
      rows.set(row.id, mergePostItRecord({}, row));
      renderRows();
      setStatus('Post-it pubblicato', 'ready');
    } catch (error) {
      console.error(error);
      setStatus('Non è stato possibile pubblicare il post-it.', 'error');
      await sync(publishGeneration);
    }
  }

  function beginDrag(event, element) {
    if (draft || event.target.closest('button') || !event.isPrimary || event.button > 0) return;
    event.preventDefault();
    const row = rows.get(element.dataset.postItId);
    if (!row) return;
    const nextZ = Math.min(2000000000, maximumZ() + 1);
    row.z_index = nextZ;
    positionPostIt(element, row);
    element.classList.add('is-dragging');
    element.setPointerCapture?.(event.pointerId);
    drag = { id: row.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: row.x, y: row.y, element };
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    const bounds = surface.getBoundingClientRect();
    const row = rows.get(drag.id);
    const rect = drag.element.getBoundingClientRect();
    const halfX = rect.width / bounds.width / 2;
    const halfY = rect.height / bounds.height / 2;
    row.x = clamp(drag.x + (event.clientX - drag.startX) / bounds.width, halfX, 1 - halfX);
    row.y = clamp(drag.y + (event.clientY - drag.startY) / bounds.height, halfY, 1 - halfY);
    positionPostIt(drag.element, row);
  }

  async function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const completed = drag;
    drag = null;
    completed.element.classList.remove('is-dragging');
    if (completed.element.hasPointerCapture?.(completed.pointerId)) completed.element.releasePointerCapture(completed.pointerId);
    const row = rows.get(completed.id);
    if (!row) return;
    const moveGeneration = generation;
    pendingMoves.add(row.id);
    try {
      const saved = await store.movePostIt(row.id, { x: row.x, y: row.y, zIndex: row.z_index });
      if (moveGeneration !== generation) return;
      rows.set(saved.id, mergePostItRecord(rows.get(saved.id), saved));
      renderRows();
    } catch (error) {
      console.error(error);
      if (moveGeneration !== generation) return;
      setStatus('Spostamento non sincronizzato.', 'error');
      await sync(moveGeneration);
    } finally {
      pendingMoves.delete(row.id);
    }
  }

  function cancelDrag() {
    if (!drag) return;
    void endDrag({ pointerId: drag.pointerId });
  }

  function installSurfaceEvents() {
    surface.addEventListener('pointerdown', (event) => {
      const postIt = event.target.closest('[data-post-it-id]:not(.is-drawing)');
      if (postIt) beginDrag(event, postIt);
    });
    surface.addEventListener('pointermove', moveDrag);
    surface.addEventListener('pointerup', endDrag);
    surface.addEventListener('pointercancel', endDrag);
    surface.addEventListener('lostpointercapture', endDrag);
  }

  async function open(trigger) {
    if (overlay) return;
    const openingGeneration = ++generation;
    previousFocus = trigger ?? document.activeElement;
    const source = boardScene.querySelector('.qwen-svg [data-svg-id="bulletin-board"]')?.getBoundingClientRect() ?? trigger.getBoundingClientRect();
    const template = document.createElement('template');
    template.innerHTML = `<div class="bulletin-board-overlay" role="dialog" aria-modal="true" aria-label="Bacheca condominiale"><div class="bulletin-board-panel"><div class="bulletin-board-surface" data-board-surface><button class="board-new-post-it" type="button" data-board-new data-board-action="new-post-it" aria-label="Prendi un nuovo post-it" disabled><span>+</span></button><button class="neighbor-quiz-note" type="button" data-board-action="open-quiz">Che vicino sei?</button></div><p class="bulletin-board-status" data-board-status aria-live="polite"></p><button class="bulletin-board-close overlay-close" type="button" data-board-action="close" aria-label="Chiudi la bacheca">×</button></div></div>`;
    overlay = template.content.firstElementChild;
    host.append(overlay);
    surface = overlay.querySelector('[data-board-surface]');
    installSurfaceEvents();
    overlay.addEventListener('click', (event) => {
      const action = event.target.closest('[data-board-action]')?.dataset.boardAction;
      if (action === 'close') close();
      if (action === 'new-post-it') createDraft();
      if (action === 'reset-drawing') drawing?.clear();
      if (action === 'publish-drawing') publishDraft();
      if (action === 'open-quiz') { overlay.classList.add('is-quiz-open'); quiz.open(); }
    });
    background?.setAttribute('inert', '');
    const panel = overlay.querySelector('.bulletin-board-panel');
    const target = panel.getBoundingClientRect();
    panel.style.setProperty('--board-from-x', `${source.left + source.width / 2 - (target.left + target.width / 2)}px`);
    panel.style.setProperty('--board-from-y', `${source.top + source.height / 2 - (target.top + target.height / 2)}px`);
    panel.style.setProperty('--board-from-scale-x', String(source.width / target.width));
    panel.style.setProperty('--board-from-scale-y', String(source.height / target.height));
    window.requestAnimationFrame(() => overlay?.classList.add('is-open'));
    overlay.querySelector('.bulletin-board-close')?.focus({ preventScroll: true });
    if (!store.configured) {
      setStatus('Configurazione Supabase mancante: la bacheca condivisa non è ancora collegata.', 'error');
      overlay.querySelector('[data-board-new]').disabled = true;
      return;
    }
    setStatus('Caricamento della bacheca…', 'loading');
    await sync(openingGeneration);
    if (!overlay || openingGeneration !== generation) return;
    store.subscribe(handleRealtime, sync);
  }

  async function close() {
    if (!overlay) return false;
    if (quiz.isOpen) { quiz.close(); return true; }
    cancelDrag();
    generation += 1;
    const closing = overlay;
    overlay = null; surface = null; draft = null; drawing = null; drag = null; ready = false;
    closing.classList.remove('is-open');
    window.setTimeout(() => closing.remove(), 300);
    background?.removeAttribute('inert');
    previousFocus?.focus({ preventScroll: true });
    await store.unsubscribe();
    rows.clear();
    return true;
  }

  function handleKeydown(event) {
    if (quiz.handleKeydown(event)) return true;
    if (!overlay || event.key !== 'Escape') return false;
    event.preventDefault(); close(); return true;
  }

  function handleViewportChange() {
    if (!overlay) return;
    cancelDrag();
    window.requestAnimationFrame(renderRows);
  }

  return { open, close, handleKeydown, handleViewportChange, get isOpen() { return Boolean(overlay); } };
}
