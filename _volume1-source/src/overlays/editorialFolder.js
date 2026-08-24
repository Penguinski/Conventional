function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderDocument(document, index, total, translated = false) {
  const paragraphs = translated && document.translation ? document.translation : document.paragraphs;
  return `
    <article class="dossier-document" data-editorial-document aria-live="polite">
      <p class="dossier-folio">DOCUMENTO ${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</p>
      <h2 id="dossier-document-title">${escapeHtml(document.heading)}</h2>
      <div class="dossier-metadata">${document.metadata.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>
      <div class="dossier-reading${document.translation ? ' dossier-reading--with-action' : ''}">
        <div class="dossier-copy" data-translation-state="${translated ? 'italiano' : 'originale'}">${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>
        ${document.translation ? `<button class="dossier-translation" type="button" data-action="editorial-translation" aria-pressed="${translated}">${translated ? 'Leggi l’originale' : 'Leggi la traduzione'}</button>` : ''}
      </div>
      ${document.note ? `<p class="dossier-note">${escapeHtml(document.note)}</p>` : ''}
      <span class="dossier-stamp" aria-hidden="true">ARCHIVIATO</span>
    </article>`;
}

export function renderEditorialFolder({ title, documents, index = 0 }) {
  const tabs = documents.map((document, tabIndex) => `
    <button class="dossier-tab${tabIndex === index ? ' is-current' : ''}" type="button" data-action="editorial-go" data-index="${tabIndex}" aria-label="Apri il documento ${tabIndex + 1}: ${escapeHtml(document.tab)}"${tabIndex === index ? ' aria-current="page"' : ''}>${escapeHtml(document.tab)}</button>`).join('');
  return `
    <div class="editorial-folder-overlay" data-editorial-folder role="dialog" aria-modal="true" aria-labelledby="dossier-title">
      <div class="editorial-folder" data-folder-object>
        <div class="dossier-cover" aria-hidden="true">
          <svg viewBox="0 0 1000 787" preserveAspectRatio="none"><path d="M3 27 H52 V3 H348 L375 27 H997 V784 H3 Z" /></svg>
          <span></span>
        </div>
        <header class="dossier-header">
          <p>CONVENTIONAL · VOL.1</p>
          <h1 id="dossier-title">${escapeHtml(title)}</h1>
        </header>
        <section class="dossier-first-cover" data-dossier-first-cover>
          <p>ARCHIVIO CONDOMINIALE</p><h2>Denunce da<br>cattivo vicino</h2><p class="dossier-cover-deck"><strong>Niente di tutto questo è inventato.</strong><br>Sei casi e norme reali, raccolti e rielaborati editorialmente.</p><button type="button" data-action="editorial-open">Apri il fascicolo</button>
        </section>
        <nav class="dossier-tabs" aria-label="Documenti nel fascicolo" hidden>${tabs}</nav>
        <div data-editorial-page hidden>${renderDocument(documents[index], index, documents.length)}</div>
        <button class="dossier-close overlay-close" type="button" data-action="editorial-close" aria-label="Chiudi il fascicolo"><span aria-hidden="true">×</span></button>
      </div>
    </div>`;
}

export function createEditorialFolder({ host, background, title, documents, onClose }) {
  let overlay = null;
  let index = 0;
  let previousFocus = null;
  let translated = false;

  function openContents() {
    overlay?.querySelector('[data-dossier-first-cover]')?.setAttribute('hidden', '');
    overlay?.querySelector('.dossier-tabs')?.removeAttribute('hidden');
    overlay?.querySelector('[data-editorial-page]')?.removeAttribute('hidden');
    update();
  }

  function update() {
    if (!overlay) return;
    overlay.querySelector('[data-editorial-page]').innerHTML = renderDocument(documents[index], index, documents.length, translated);
    overlay.querySelectorAll('[data-action="editorial-go"]').forEach((tab, tabIndex) => {
      tab.classList.toggle('is-current', tabIndex === index);
      if (tabIndex === index) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  function go(nextIndex) {
    index = Math.max(0, Math.min(documents.length - 1, nextIndex));
    translated = false;
    update();
  }

  function close() {
    if (!overlay) return;
    const closing = overlay;
    overlay = null;
    closing.classList.add('is-closing');
    window.setTimeout(() => closing.remove(), 210);
    background?.removeAttribute('inert');
    previousFocus?.focus({ preventScroll: true });
    onClose?.();
  }

  function open(trigger) {
    if (overlay) return;
    index = 0;
    previousFocus = trigger ?? document.activeElement;
    const template = document.createElement('template');
    template.innerHTML = renderEditorialFolder({ title, documents, index });
    overlay = template.content.firstElementChild;
    overlay.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]');
      if (!action) return;
      if (action.dataset.action === 'editorial-open') openContents();
      if (action.dataset.action === 'editorial-close') close();
      if (action.dataset.action === 'editorial-go') go(Number(action.dataset.index));
      if (action.dataset.action === 'editorial-translation') { translated = !translated; update(); }
    });
    host.append(overlay);
    background?.setAttribute('inert', '');
    window.requestAnimationFrame(() => overlay?.classList.add('is-open'));
    overlay.querySelector('[data-action="editorial-close"]')?.focus({ preventScroll: true });
  }

  function handleKeydown(event) {
    if (!overlay) return false;
    if (event.key === 'Escape') close();
    else if (event.key === 'ArrowLeft') go(index - 1);
    else if (event.key === 'ArrowRight') go(index + 1);
    else return false;
    event.preventDefault();
    return true;
  }

  return {
    open,
    close,
    handleKeydown,
    get isOpen() { return Boolean(overlay); },
    get index() { return index; },
  };
}
