function imageMarkup(mailbox) {
  return `<p class="mailbox-identity">CASELLA DI ${mailbox.resident.toUpperCase()}</p><div class="mailbox-publication-frame"><img class="mailbox-publication" src="${mailbox.asset}" alt="${mailbox.alt}" draggable="false"><button class="mailbox-close mailbox-publication-close overlay-close" type="button" aria-label="Chiudi la posta"><span aria-hidden="true">×</span></button></div>`;
}

function closeMarkup() {
  return '<button class="mailbox-close overlay-close" type="button" aria-label="Chiudi la posta"><span aria-hidden="true">×</span></button>';
}

function conventionalMarkup(mailbox) {
  return `
    <article class="mailbox-conventional">
      <p class="mailbox-kicker mailbox-identity">CASELLA DI CONVENTIONAL</p>
      <h1 id="mailbox-content-title">Benvenuto nel condominio.</h1>
      <div class="mailbox-conventional-grid">
        <section>
          <h2>Newsletter</h2>
          <div class="newsletter-embed"><iframe title="Iscriviti alla newsletter di Conventional" src="${mailbox.newsletterUrl}" loading="lazy"></iframe></div>
        </section>
        <section class="mailbox-archive">
          <h2>Archivio</h2>
          <p>Il numero precedente di Conventional.</p>
          <a href="${mailbox.volumeZeroUrl}" target="_blank" rel="noopener">Conventional — Volume 0</a>
        </section>
      </div>
    </article>`;
}

function extractionVisual(mailbox) {
  if (mailbox.type === 'image') return `<img src="${mailbox.asset}" alt="" draggable="false">`;
  return '<span class="mail-extraction-letter" aria-hidden="true">CONVENTIONAL</span>';
}

export function createMailboxOverlay({ host, background }) {
  let overlay = null;
  let extraction = null;
  let previousFocus = null;

  function close() {
    if (!overlay) return false;
    const closing = overlay;
    overlay = null;
    closing.classList.add('is-closing');
    window.setTimeout(() => closing.remove(), 180);
    background?.removeAttribute('inert');
    previousFocus?.focus({ preventScroll: true });
    return true;
  }

  function showContent(mailbox) {
    const template = document.createElement('template');
    template.innerHTML = `
      <div class="mailbox-overlay" role="dialog" aria-modal="true" ${mailbox.type === 'image' ? `aria-label="Posta di ${mailbox.resident}"` : 'aria-labelledby="mailbox-content-title"'}>
        <div class="mailbox-content${mailbox.type === 'image' ? ' mailbox-content--image' : ''}">
          ${mailbox.type === 'image' ? imageMarkup(mailbox) : mailbox.type === 'empty' ? '<p class="mailbox-empty">CASSETTA VUOTA</p>' : conventionalMarkup(mailbox)}
          ${mailbox.type === 'image' ? '' : closeMarkup()}
        </div>
      </div>`;
    overlay = template.content.firstElementChild;
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('.mailbox-close')) close();
    });
    host.append(overlay);
    background?.setAttribute('inert', '');
    window.requestAnimationFrame(() => overlay?.classList.add('is-open'));
    overlay.querySelector('.mailbox-close')?.focus({ preventScroll: true });
  }

  function open(mailbox, trigger, svgTarget) {
    if (!mailbox || overlay || extraction) return;
    previousFocus = trigger ?? document.activeElement;
    svgTarget?.classList.add('is-mailbox-opening');
    window.setTimeout(() => svgTarget?.classList.remove('is-mailbox-opening'), 360);
    if (mailbox.type === 'empty') {
      window.setTimeout(() => showContent(mailbox), 220);
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    extraction = document.createElement('div');
    extraction.className = 'mail-extraction';
    extraction.setAttribute('aria-hidden', 'true');
    extraction.innerHTML = extractionVisual(mailbox);
    extraction.style.setProperty('--mail-start-x', `${centerX}px`);
    extraction.style.setProperty('--mail-start-y', `${centerY}px`);
    host.append(extraction);
    window.requestAnimationFrame(() => extraction?.classList.add('is-extracted'));
    window.setTimeout(() => {
      extraction?.remove();
      extraction = null;
      showContent(mailbox);
    }, 360);
  }

  function handleKeydown(event) {
    if (!overlay || event.key !== 'Escape') return false;
    event.preventDefault();
    close();
    return true;
  }

  return { open, close, handleKeydown, get isOpen() { return Boolean(overlay); } };
}
