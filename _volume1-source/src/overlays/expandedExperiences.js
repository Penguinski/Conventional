import '../styles/expandedExperiences.css';
import { artworks, artworkAsset } from '../content/artworks.js';
import { elevatorArticle, homeArticle, intercomArticle } from '../content/newArticles.js';
import { arturoStory, avoidNeighborsArticle, elevatorFunFact, gossipArticle, paoloStory } from '../content/volumeOneFeatures.js';
import { createElevatorPositionGame } from './elevatorPositionGame.js';

const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function closeButton(label = 'Chiudi') {
  return `<button class="overlay-close feature-close" type="button" data-feature-close aria-label="${esc(label)}">×</button>`;
}

function mirrorNoteMarkup({ title, kicker, sections }) {
  const paragraphs = sections.flatMap(({ paragraphs: sectionParagraphs }) => sectionParagraphs);
  return `<div class="feature-overlay feature-overlay--paper feature-overlay--mirror-note" role="dialog" aria-modal="true" aria-labelledby="mirror-note-title">
    <article class="mirror-note-panel">
      <header class="mirror-note-header"><p class="feature-kicker">${esc(kicker)}</p><h1 id="mirror-note-title">${esc(title)}</h1></header>
      <div class="mirror-note-divider" aria-hidden="true"><span></span></div>
      <div class="mirror-note-body">${paragraphs.map((text) => `<p>${esc(text)}</p>`).join('')}</div>
      ${closeButton('Chiudi l’appunto')}
    </article></div>`;
}

function articleMarkup({ title, kicker, sections, kind = 'article' }) {
  const hasCover = kind === 'gossip' || kind === 'guide';
  if (kind === 'note') return mirrorNoteMarkup({ title, kicker, sections });
  const coverDeck = kind === 'gossip'
    ? 'Come nasce una voce, perché circola e cosa cambia mentre attraversa il condominio.'
    : 'Protocollo per lasciare l’appartamento riducendo al minimo l’interazione umana.';
  return `<div class="feature-overlay feature-overlay--paper" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <article class="feature-reader feature-reader--${kind} ${hasCover ? 'feature-reader--cover' : 'feature-reader--reading'}" data-article-reader data-article-state="${hasCover ? 'cover' : 'reading'}">
      ${hasCover ? `<section class="feature-article-cover" data-article-cover><p>${kind === 'gossip' ? 'ARTICOLO' : 'GUIDA PRATICA'}</p><h1>${esc(title)}</h1><p class="feature-cover-deck">${esc(coverDeck)}</p><button type="button" data-article-open>${kind === 'gossip' ? 'Leggi l’articolo' : 'Apri la guida'} <span aria-hidden="true">→</span></button></section>` : ''}
      <header class="feature-reader-reading-header" ${hasCover ? 'hidden' : ''}>
        <p class="feature-kicker">${esc(kicker)}</p><span class="feature-reader-separator" aria-hidden="true">|</span><h1>${esc(title)}</h1><span class="feature-reader-header-count" data-article-count></span>
      </header>
      <div class="feature-reader-page" data-article-page ${hasCover ? 'hidden' : ''}></div>
      <nav class="feature-pager" aria-label="Navigazione articolo" ${hasCover ? 'hidden' : ''}><button type="button" data-article-prev aria-label="Pagina precedente">‹</button><button type="button" data-article-next aria-label="Pagina successiva">›</button></nav>
      ${closeButton()}
    </article></div>`;
}

function formatInlineArticleText(value) {
  return esc(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function longFormArticleMarkup({ title, kicker, deck, paragraphs }) {
  return `<div class="feature-overlay feature-overlay--paper feature-overlay--longform" role="dialog" aria-modal="true" aria-labelledby="longform-article-title">
    <article class="feature-longform" data-longform-article>
      <div class="feature-longform-scroll" data-longform-scroll tabindex="0">
        <header class="feature-longform-header">
          <p class="feature-kicker">${esc(kicker)}</p>
          <h1 id="longform-article-title">${esc(title)}</h1>
          ${deck ? `<p class="feature-longform-deck">${esc(deck)}</p>` : ''}
        </header>
        <div class="feature-longform-body">
          ${paragraphs.map((text) => `<p>${formatInlineArticleText(text)}</p>`).join('')}
        </div>
      </div>
      ${closeButton('Chiudi l’articolo')}
    </article>
  </div>`;
}

function storyMarkup(kind, title, kicker) {
  return `<div class="feature-overlay feature-overlay--story" role="dialog" aria-modal="true" aria-labelledby="story-title"><aside class="story-panel story-panel--${kind}">
    <header><p class="feature-kicker">${esc(kicker)}</p><h1 id="story-title">${esc(title)}</h1></header>
    <div class="story-copy" data-story-copy></div>
    <footer><button type="button" data-story-prev>←</button><span data-story-count></span><button type="button" data-story-next>→</button></footer>
    ${closeButton('Chiudi il racconto')}</aside></div>`;
}

function artworkMarkup(artwork) {
  return `<div class="feature-overlay feature-overlay--artwork" role="dialog" aria-modal="true" aria-labelledby="artwork-title"><figure class="artwork-lightbox">
    <img src="${artworkAsset(artwork)}" alt="Hélène Appel, ${esc(artwork.title)}, ${artwork.year}" draggable="false">
    <figcaption><h1 id="artwork-title"><span>Hélène Appel,</span><em>${esc(artwork.title)},</em><span>${artwork.year}</span></h1><p><span>${esc(artwork.medium)}</span><span>${esc(artwork.size)}</span></p></figcaption>
    ${closeButton('Chiudi il quadro')}</figure></div>`;
}

export function createExpandedExperiences({ host, background, scenes, audio }) {
  let overlay = null;
  let previousFocus = null;
  let story = null;
  let storyIndex = 0;
  let article = null;
  let longFormArticle = null;
  let articleIndex = 0;
  let articlePointerStart = null;
  let paoloVoiceInterval = 0;
  let paoloVoiceLayer = null;
  let paoloVoiceSequence = 0;
  const paoloVoiceLetterTimers = new Map();
  let arturoVoiceInterval = 0;
  let arturoVoiceLayer = null;
  let arturoVoiceSequence = 0;
  const arturoVoiceLetterTimers = new Map();
  const elevatorGame = createElevatorPositionGame({
    host,
    background,
    onReadArticle: (trigger) => openLongFormArticle(elevatorArticle, trigger, true),
  });

  function mount(markup, trigger, keepSceneActive = false, preserveElevatorGame = false) {
    if (!preserveElevatorGame) elevatorGame.close(false);
    if (overlay) close(false);
    previousFocus = trigger ?? document.activeElement;
    const template = document.createElement('template');
    template.innerHTML = markup;
    overlay = template.content.firstElementChild;
    overlay.addEventListener('click', handleClick);
    overlay.addEventListener('pointerdown', handleArticlePointerDown, { passive: true });
    overlay.addEventListener('pointerup', handleArticlePointerUp, { passive: true });
    overlay.addEventListener('pointercancel', handleArticlePointerCancel, { passive: true });
    host.append(overlay);
    if (!keepSceneActive) background?.setAttribute('inert', '');
    requestAnimationFrame(() => overlay?.classList.add('is-open'));
    overlay.querySelector('[data-feature-close]')?.focus({ preventScroll: true });
  }

  function stopPaoloVoiceTrail() {
    window.clearInterval(paoloVoiceInterval);
    paoloVoiceInterval = 0;
    paoloVoiceLetterTimers.forEach((timer) => window.clearTimeout(timer));
    paoloVoiceLetterTimers.clear();
    paoloVoiceLayer?.remove();
    paoloVoiceLayer = null;
  }

  function startPaoloVoiceTrail(scene) {
    stopPaoloVoiceTrail();
    if (!scene || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true) return;

    paoloVoiceLayer = document.createElement('div');
    paoloVoiceLayer.className = 'paolo-voice-trail';
    paoloVoiceLayer.setAttribute('aria-hidden', 'true');
    scene.append(paoloVoiceLayer);
    paoloVoiceSequence = 0;

    const positions = [31, 43, 36, 51, 46];
    const drifts = [-16, 10, -8, 14, -12];
    const rotations = [-7, 4, -3, 6, -5];
    const sizes = [27, 34, 30, 37, 32];
    const durations = [3900, 4300, 4100, 4500, 4000];

    const spawn = () => {
      if (!paoloVoiceLayer?.isConnected) return;
      const sequence = paoloVoiceSequence;
      const variant = sequence % positions.length;
      paoloVoiceSequence += 1;
      const letter = document.createElement('span');
      letter.className = 'paolo-voice-letter';
      letter.dataset.voiceSequence = String(sequence);
      letter.textContent = 'R';
      letter.style.setProperty('--voice-x', `${positions[variant]}%`);
      letter.style.setProperty('--voice-drift', `${drifts[variant]}px`);
      letter.style.setProperty('--voice-drift-quarter', `${drifts[variant] * .25}px`);
      letter.style.setProperty('--voice-drift-three-quarter', `${drifts[variant] * .75}px`);
      letter.style.setProperty('--voice-rotation', `${rotations[variant]}deg`);
      letter.style.setProperty('--voice-mid-rotation', `${rotations[variant] * -.35}deg`);
      letter.style.setProperty('--voice-end-rotation', `${rotations[variant] * -.6}deg`);
      letter.style.setProperty('--voice-size', `${sizes[variant]}px`);
      letter.style.setProperty('--voice-duration', `${durations[variant]}ms`);

      let removalTimer = 0;
      const remove = () => {
        window.clearTimeout(removalTimer);
        paoloVoiceLetterTimers.delete(letter);
        letter.remove();
      };
      letter.addEventListener('animationend', remove, { once: true });
      removalTimer = window.setTimeout(remove, durations[variant] + 180);
      paoloVoiceLetterTimers.set(letter, removalTimer);
      paoloVoiceLayer.append(letter);
    };

    spawn();
    paoloVoiceInterval = window.setInterval(spawn, 1050);
  }

  function stopArturoVoiceTrail() {
    window.clearInterval(arturoVoiceInterval);
    arturoVoiceInterval = 0;
    arturoVoiceLetterTimers.forEach((timer) => window.clearTimeout(timer));
    arturoVoiceLetterTimers.clear();
    arturoVoiceLayer?.remove();
    arturoVoiceLayer = null;
  }

  function startArturoVoiceTrail(scene) {
    stopArturoVoiceTrail();
    if (!scene || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true) return;

    arturoVoiceLayer = document.createElement('div');
    arturoVoiceLayer.className = 'arturo-voice-trail';
    arturoVoiceLayer.setAttribute('aria-hidden', 'true');
    scene.append(arturoVoiceLayer);
    arturoVoiceSequence = 0;

    const positions = [32, 45, 38, 54];
    const travels = [118, 142, 128, 154];
    const rotations = [-5, 3, -2, 4];
    const sizes = [25, 31, 28, 34];
    const durations = [3100, 3500, 3300, 3700];

    const spawn = () => {
      if (!arturoVoiceLayer?.isConnected) return;
      const sequence = arturoVoiceSequence;
      const variant = sequence % positions.length;
      arturoVoiceSequence += 1;
      const letter = document.createElement('span');
      letter.className = 'arturo-voice-letter';
      letter.dataset.voiceSequence = String(sequence);
      letter.textContent = 'R';
      letter.style.setProperty('--voice-y', `${positions[variant]}%`);
      letter.style.setProperty('--voice-travel', `${travels[variant]}px`);
      letter.style.setProperty('--voice-travel-quarter', `${travels[variant] * .22}px`);
      letter.style.setProperty('--voice-travel-three-quarter', `${travels[variant] * .72}px`);
      letter.style.setProperty('--voice-rotation', `${rotations[variant]}deg`);
      letter.style.setProperty('--voice-mid-rotation', `${rotations[variant] * -.35}deg`);
      letter.style.setProperty('--voice-end-rotation', `${rotations[variant] * -.55}deg`);
      letter.style.setProperty('--voice-size', `${sizes[variant]}px`);
      letter.style.setProperty('--voice-duration', `${durations[variant]}ms`);

      let removalTimer = 0;
      const remove = () => {
        window.clearTimeout(removalTimer);
        arturoVoiceLetterTimers.delete(letter);
        letter.remove();
      };
      letter.addEventListener('animationend', remove, { once: true });
      removalTimer = window.setTimeout(remove, durations[variant] + 180);
      arturoVoiceLetterTimers.set(letter, removalTimer);
      arturoVoiceLayer.append(letter);
    };

    spawn();
    arturoVoiceInterval = window.setInterval(spawn, 1100);
  }

  function resetScrollStart(scroller) {
    if (!scroller) return;
    scroller.scrollTop = 0;
    window.requestAnimationFrame(() => {
      if (scroller.isConnected) scroller.scrollTop = 0;
    });
  }

  function resetStoryScene() {
    stopPaoloVoiceTrail();
    stopArturoVoiceTrail();
    Object.values(scenes).forEach((node) => { delete node.dataset.storyEvent; delete node.dataset.storyFocus; node.classList.remove('story-light-off'); });
    audio?.stopNarrative?.();
  }

  function close(restore = true) {
    if (elevatorGame.isOpen && !overlay) return elevatorGame.close(restore);
    if (!overlay) return false;
    const gameRemainsOpen = elevatorGame.isOpen;
    resetStoryScene();
    const closing = overlay;
    overlay = null; story = null; article = null; longFormArticle = null; articlePointerStart = null;
    closing.classList.remove('is-open'); closing.classList.add('is-closing');
    setTimeout(() => closing.remove(), 180);
    if (!gameRemainsOpen) background?.removeAttribute('inert');
    if (restore) previousFocus?.focus({ preventScroll: true });
    return true;
  }

  function renderArticle() {
    if (!overlay || !article) return;
    const section = article.sections[articleIndex];
    const page = overlay.querySelector('[data-article-page]');
    page.classList.remove('is-changing');
    page.innerHTML = `<div class="feature-reader-section-title" lang="it"><h2>${esc(section.title)}</h2></div><div class="feature-reader-copy">${section.paragraphs.map((text) => `<p>${esc(text)}</p>`).join('')}</div>`;
    page.scrollTop = 0;
    requestAnimationFrame(() => page.classList.add('is-changing'));
    requestAnimationFrame(() => page.classList.remove('is-changing'));
    overlay.querySelector('[data-article-count]').textContent = `${articleIndex + 1} / ${article.sections.length}`;
    const previous = overlay.querySelector('[data-article-prev]');
    const next = overlay.querySelector('[data-article-next]');
    previous.hidden = articleIndex === 0;
    previous.disabled = articleIndex === 0;
    next.hidden = articleIndex === article.sections.length - 1;
    next.disabled = articleIndex === article.sections.length - 1;
  }

  function moveArticle(delta) {
    if (!article || !overlay || overlay.querySelector('[data-article-reader]')?.dataset.articleState !== 'reading') return;
    const nextIndex = Math.max(0, Math.min(article.sections.length - 1, articleIndex + delta));
    if (nextIndex === articleIndex) return;
    articleIndex = nextIndex;
    renderArticle();
  }

  function handleArticlePointerDown(event) {
    if (!article || !event.target.closest('[data-article-page]') || event.target.closest('button')) return;
    if (overlay?.querySelector('[data-article-reader]')?.dataset.articleState !== 'reading') return;
    articlePointerStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function handleArticlePointerUp(event) {
    if (!articlePointerStart || event.pointerId !== articlePointerStart.pointerId) return;
    const deltaX = event.clientX - articlePointerStart.x;
    const deltaY = event.clientY - articlePointerStart.y;
    articlePointerStart = null;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    moveArticle(deltaX < 0 ? 1 : -1);
  }

  function handleArticlePointerCancel() {
    articlePointerStart = null;
  }

  function openArticle(config, trigger) {
    article = config; articleIndex = 0;
    mount(articleMarkup(config), trigger);
    article = config;
    if (config.kind !== 'note') renderArticle();
  }

  function openLongFormArticle(config, trigger, preserveElevatorGame = false) {
    longFormArticle = config;
    mount(longFormArticleMarkup(config), trigger, false, preserveElevatorGame);
  }

  function openElevatorArticle(trigger) { openLongFormArticle(elevatorArticle, trigger); }
  function openHomeArticle(trigger) { openLongFormArticle(homeArticle, trigger); }
  function openIntercomArticle(trigger) { openLongFormArticle(intercomArticle, trigger); }

  function renderStory() {
    if (!story || !overlay) return;
    const beat = story.beats[storyIndex];
    const scene = scenes[story.scene];
    resetStoryScene();
    if (story.kind === 'paolo') scene.classList.add('story-light-off');
    scene.dataset.storyEvent = beat.event || 'still';
    scene.dataset.storyFocus = beat.focus || 'room';
    const panelSide = beat.panelSide || 'right';
    overlay.dataset.panelSide = panelSide;
    overlay.querySelector('.story-panel').dataset.panelSide = panelSide;
    if (beat.sound) audio?.playEffect?.(beat.sound);
    const copy = overlay.querySelector('[data-story-copy]');
    copy.innerHTML = `<p>${esc(beat.text)}</p>`;
    resetScrollStart(copy);
    if (story.kind === 'paolo' && storyIndex === 1) startPaoloVoiceTrail(scene);
    if (story.kind === 'arturo' && storyIndex === 2) startArturoVoiceTrail(scene);
    overlay.querySelector('[data-story-count]').textContent = `${storyIndex + 1} / ${story.beats.length}`;
    overlay.querySelector('[data-story-prev]').disabled = storyIndex === 0;
    overlay.querySelector('[data-story-next]').disabled = storyIndex === story.beats.length - 1;
  }

  function openStory(kind, trigger) {
    const isPaolo = kind === 'paolo';
    story = { kind, scene: isPaolo ? 'home-paolo' : 'home-arturo', beats: isPaolo ? paoloStory : arturoStory };
    storyIndex = 0;
    mount(storyMarkup(kind, isPaolo ? 'Quello che Paolo sente' : 'Quello che succede davvero', isPaolo ? 'DAL PIANO DI SOTTO' : 'INTERNO 8'), trigger, true);
    story = { kind, scene: isPaolo ? 'home-paolo' : 'home-arturo', beats: isPaolo ? paoloStory : arturoStory };
    renderStory();
  }

  function openElevatorFact(trigger) {
    openArticle({ title: 'Uno specchio ben piazzato', kicker: 'APPUNTO DALL’ASCENSORE', kind: 'note', sections: [{ title: 'Durante l’attesa', paragraphs: [elevatorFunFact] }] }, trigger);
  }
  function openGossip(trigger) { openArticle({ title: 'Il meccanismo del pettegolezzo', kicker: 'ARTICOLO', kind: 'gossip', sections: gossipArticle }, trigger); }
  function openAvoidNeighbors(trigger) { openArticle({ title: 'Come evitare i vicini', kicker: 'GUIDA TASCABILE', kind: 'guide', sections: avoidNeighborsArticle }, trigger); }
  function openArtwork(id, trigger) { const artwork = artworks[id]; if (artwork) mount(artworkMarkup(artwork), trigger); }

  function openElevatorGame(trigger) { elevatorGame.open(trigger); }

  function handleClick(event) {
    if (event.target === overlay || event.target.closest('[data-feature-close]')) { close(); return; }
    if (event.target.closest('[data-article-open]')) {
      const reader = overlay.querySelector('[data-article-reader]');
      reader?.classList.remove('feature-reader--cover');
      reader?.classList.add('feature-reader--reading');
      if (reader) reader.dataset.articleState = 'reading';
      overlay.querySelector('[data-article-cover]')?.setAttribute('hidden', '');
      overlay.querySelector('.feature-reader-reading-header')?.removeAttribute('hidden');
      overlay.querySelector('[data-article-page]')?.removeAttribute('hidden');
      overlay.querySelector('.feature-pager')?.removeAttribute('hidden');
      renderArticle();
      return;
    }
    if (event.target.closest('[data-article-prev]')) { moveArticle(-1); return; }
    if (event.target.closest('[data-article-next]')) {
      moveArticle(1);
      return;
    }
    if (event.target.closest('[data-story-prev]')) { storyIndex = Math.max(0, storyIndex - 1); renderStory(); return; }
    if (event.target.closest('[data-story-next]')) { storyIndex = Math.min(story.beats.length - 1, storyIndex + 1); renderStory(); return; }
  }

  function handleKeydown(event) {
    if (elevatorGame.handleKeydown(event)) return true;
    if (article && overlay?.querySelector('[data-article-reader]')?.dataset.articleState === 'reading' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      moveArticle(event.key === 'ArrowRight' ? 1 : -1);
      return true;
    }
    if (!overlay || event.key !== 'Escape') return false;
    event.preventDefault(); close(); return true;
  }
  return {
    openStory,
    openElevatorFact,
    openGossip,
    openAvoidNeighbors,
    openArtwork,
    openElevatorGame,
    openElevatorArticle,
    openHomeArticle,
    openIntercomArticle,
    close,
    handleKeydown,
  };
}
