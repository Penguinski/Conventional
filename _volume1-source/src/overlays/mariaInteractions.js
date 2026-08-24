let mariaRecipes = [];
let mariaRecipeIntro = '';
let recipePages = [];
let recipeContentPromise = null;
let junkDrawerModulePromise = null;
const recipeAssetPack = `${import.meta.env.BASE_URL ?? '/vol1-test/'}assets/maria/cibi.svg`;

function loadRecipeContent() {
  recipeContentPromise ??= import('../content/mariaRecipes.js').then((content) => {
    mariaRecipes = content.mariaRecipes;
    mariaRecipeIntro = content.mariaRecipeIntro;
    recipePages = mariaRecipes.map(buildRecipePages);
  });
  return recipeContentPromise;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderBuilding({ x, y, width, height, columns, rows, seed, color }) {
  const pad = 24;
  const gap = 18;
  const windowWidth = (width - pad * 2 - gap * (columns - 1)) / columns;
  const windowHeight = Math.min(58, (height - 70 - gap * (rows - 1)) / rows);
  const windows = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const lit = (index + seed) % 3 !== 0;
      const person = lit && (index + seed) % 2 === 0;
      const motionSeed = index + seed * 3;
      const motion = motionSeed % 5 === 0 ? 'still' : Math.floor(motionSeed / 2) % 2 === 0 ? 'left-to-right' : 'right-to-left';
      const duration = (8.4 + (motionSeed % 5) * 1.15).toFixed(2);
      const delay = ((motionSeed * 1.7) % 10).toFixed(2);
      const wx = x + pad + column * (windowWidth + gap);
      const wy = y + 42 + row * (windowHeight + gap);
      windows.push(`
        <g class="binocular-window${lit ? ' is-lit' : ''}${person ? ' has-person' : ''}" transform="translate(${wx} ${wy})">
          <rect width="${windowWidth}" height="${windowHeight}" rx="3" />
          <svg class="binocular-window-room" width="${windowWidth}" height="${windowHeight}" viewBox="0 0 ${windowWidth} ${windowHeight}" overflow="hidden" aria-hidden="true">
            ${person ? `<g class="binocular-figure binocular-figure--${motion}" style="--figure-window: ${windowWidth}px; --figure-center: ${windowWidth / 2}px; --figure-duration: ${duration}s; --figure-delay: -${delay}s">
              <g class="binocular-person" transform="translate(0 ${windowHeight - 41})">
                <circle cx="0" cy="7" r="6"/>
                <path class="binocular-person-body" d="M-8 18Q0 11 8 18L11 37H-11Z"/>
                <path class="binocular-person-limbs" d="M-7 20-14 31M7 20 14 31M-4 36-6 42M4 36 6 42"/>
              </g>
            </g>` : ''}
          </svg>
          <path d="M${windowWidth / 2} 0V${windowHeight}M0 ${windowHeight / 2}H${windowWidth}" />
        </g>`);
    }
  }
  return `<g class="binocular-building"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${color}"/><path d="M${x - 8} ${y}H${x + width + 8}"/>${windows.join('')}</g>`;
}

function renderBinocularView(period) {
  const buildings = [
    renderBuilding({ x: 70, y: 185, width: 350, height: 430, columns: 3, rows: 4, seed: 1, color: '#8e8292' }),
    renderBuilding({ x: 410, y: 105, width: 370, height: 510, columns: 4, rows: 5, seed: 2, color: '#b68d80' }),
    renderBuilding({ x: 770, y: 165, width: 360, height: 450, columns: 3, rows: 4, seed: 4, color: '#777e91' }),
  ].join('');
  return `
    <div class="maria-binocular-overlay" data-maria-overlay="binocular" data-period="${period}" role="dialog" aria-modal="true" aria-label="Vista attraverso il binocolo di Maria">
      <svg class="maria-binocular-view" viewBox="0 0 1200 620" role="img" aria-label="Palazzi lontani con finestre e sagome di vicini">
        <defs><clipPath id="maria-binocular-mask"><circle cx="370" cy="310" r="300"/><circle cx="830" cy="310" r="300"/></clipPath></defs>
        <g clip-path="url(#maria-binocular-mask)">
          <rect class="binocular-sky" width="1200" height="620"/>
          <circle class="binocular-orb" cx="955" cy="92" r="46"/>
          <path class="binocular-cloud" d="M115 126c25-38 75-34 91 5 31-22 76 1 72 38H73c-5-25 13-44 42-43Z"/>
          ${buildings}
        </g>
      </svg>
      <button class="maria-binocular-gossip" type="button" data-action="gossip-article">Leggi: il meccanismo del pettegolezzo</button>
      <button class="maria-overlay-close overlay-close" type="button" data-maria-close aria-label="Chiudi la vista dal binocolo"><span aria-hidden="true">×</span></button>
    </div>`;
}

function chunkRecipeSteps(steps) {
  const chunks = [];
  let chunk = [];
  let length = 0;
  steps.forEach((step) => {
    if (chunk.length && (chunk.length >= 3 || length + step.length > 520)) {
      chunks.push(chunk);
      chunk = [];
      length = 0;
    }
    chunk.push(step);
    length += step.length;
  });
  if (chunk.length) chunks.push(chunk);
  return chunks.length ? chunks : [[]];
}

function buildRecipePages(recipe, recipeIndex) {
  const stepChunks = chunkRecipeSteps(recipe.steps);
  let stepStart = 1;
  const stepPages = stepChunks.map((steps, chunkIndex) => {
    const page = {
      kind: 'steps', recipe, recipeIndex, steps, chunkIndex, stepStart,
      notes: chunkIndex === stepChunks.length - 1 ? recipe.notes : [],
    };
    stepStart += steps.length;
    return page;
  });
  const ingredientChunks = [];
  for (let index = 0; index < recipe.ingredients.length; index += 8) {
    ingredientChunks.push(recipe.ingredients.slice(index, index + 8));
  }
  return [
    { kind: 'intro', recipe, recipeIndex, ingredients: ingredientChunks[0] ?? [] },
    ...ingredientChunks.slice(1).map((ingredients, chunkIndex) => ({
      kind: 'ingredients', recipe, recipeIndex, ingredients, chunkIndex: chunkIndex + 1,
    })),
    ...stepPages,
  ];
}

function isSingleRecipePage() {
  return window.matchMedia('(orientation: landscape) and (max-width: 900px)').matches;
}

function renderRecipeAsset(recipe, className = 'maria-recipe-art') {
  const source = `${import.meta.env.BASE_URL ?? '/vol1-test/'}${recipe.image}`;
  return `<img class="${className}" src="${escapeHtml(source)}" alt="Illustrazione di ${escapeHtml(recipe.displayName)}" loading="lazy" decoding="async">`;
}

function renderOdorAsset(odor) {
  const odorPositions = { delicato: [180, 665], medio: [500, 665], forte: [820, 665] };
  const [x, y] = odorPositions[odor] ?? odorPositions.delicato;
  return `<svg class="maria-recipe-odor-art" viewBox="-30 -55 60 65" aria-hidden="true" focusable="false"><use href="${recipeAssetPack}#odor-${odor}" transform="translate(${-x} ${-y})"></use></svg>`;
}

function renderRecipeLeaf(page, side) {
  if (!page) return `<section class="maria-recipe-leaf maria-recipe-leaf--${side} is-blank" aria-hidden="true"></section>`;
  const { recipe, recipeIndex } = page;
  if (page.kind === 'intro') return `<section class="maria-recipe-leaf maria-recipe-leaf--${side}">
    <p class="maria-recipe-folio">RICETTA ${recipeIndex + 1} / ${mariaRecipes.length}</p>
    ${renderRecipeAsset(recipe, 'maria-recipe-art maria-recipe-art--page')}
    <h2>${escapeHtml(recipe.title)}</h2>
    ${recipe.description.map((paragraph) => `<p class="maria-recipe-intro">${escapeHtml(paragraph)}</p>`).join('')}
    <h3>INGREDIENTI</h3><ul>${page.ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
  </section>`;
  if (page.kind === 'ingredients') return `<section class="maria-recipe-leaf maria-recipe-leaf--${side}">
    <p class="maria-recipe-folio">${escapeHtml(recipe.title)}</p>
    <h2>INGREDIENTI · continua</h2>
    <ul>${page.ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
  </section>`;
  return `<section class="maria-recipe-leaf maria-recipe-leaf--${side}">
    <p class="maria-recipe-folio">${escapeHtml(recipe.title)}</p>
    <h2>PROCEDIMENTO${page.chunkIndex ? ' · continua' : ''}</h2>
    <ol start="${page.stepStart}">${page.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
    ${page.notes.length ? `<aside><strong>NOTA DI MARIA</strong>${page.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join('')}</aside>` : ''}
  </section>`;
}

function renderRecipePage(index, selectedIndex = 0) {
  const single = isSingleRecipePage();
  const pages = recipePages[selectedIndex] ?? [];
  const left = pages[index];
  const right = single ? null : pages[index + 1];
  return `<article class="maria-recipe-page${single ? ' is-single' : ''}" aria-live="polite">
    ${renderRecipeLeaf(left, 'left')}${single ? '' : renderRecipeLeaf(right, 'right')}
  </article>`;
}

function renderRecipeIntro() {
  return `<div class="maria-recipe-overlay" data-maria-overlay="recipe-intro" role="dialog" aria-modal="true" aria-labelledby="maria-recipe-intro-title">
    <section class="maria-recipe-cover"><p>IL RICETTARIO DI MARIA</p><h1 id="maria-recipe-intro-title">${escapeHtml(mariaRecipeIntro)}</h1><span aria-hidden="true">❀</span>
      <button type="button" data-recipe-open>Apri il ricettario</button><button class="maria-overlay-close overlay-close" type="button" data-maria-close aria-label="Chiudi"><span aria-hidden="true">×</span></button>
    </section></div>`;
}

function renderRecipeIndex() {
  return `
    <div class="maria-recipe-overlay" data-maria-overlay="recipe-index" role="dialog" aria-modal="true" aria-labelledby="maria-recipe-index-title">
      <div class="maria-recipe-book maria-recipe-book--index">
        <header>
          <p>IL RICETTARIO DI MARIA</p>
          <h1 id="maria-recipe-index-title">Scegli una ricetta</h1>
          <p class="maria-recipe-index-subtitle">Divise in base all’impatto sui vicini.</p>
        </header>
        <div class="maria-recipe-index-grid">
          ${mariaRecipes.map((recipe, index) => `<button class="maria-recipe-card" type="button" data-recipe-select="${index}" aria-label="Apri ${escapeHtml(recipe.displayName)}">
            <span class="maria-recipe-card-title">${escapeHtml(recipe.displayName)}</span>
            <span class="maria-recipe-art-slot">${renderRecipeAsset(recipe, 'maria-recipe-art maria-recipe-art--card')}</span>
            <span class="maria-recipe-odor maria-recipe-odor--${escapeHtml(recipe.odor)}">${renderOdorAsset(recipe.odor)}<span>${escapeHtml(recipe.odor)}</span></span>
          </button>`).join('')}
        </div>
        <button class="maria-overlay-close overlay-close" type="button" data-maria-close aria-label="Chiudi il ricettario"><span aria-hidden="true">×</span></button>
      </div>
    </div>`;
}

function renderRecipeBook(index = 0, selectedIndex = 0) {
  const pages = recipePages[selectedIndex] ?? [];
  const last = index >= pages.length - 1;
  return `
    <div class="maria-recipe-overlay" data-maria-overlay="recipes" role="dialog" aria-modal="true" aria-label="Il ricettario di Maria">
      <div class="maria-recipe-book">
        <div class="maria-recipe-content" data-recipe-page>${renderRecipePage(index, selectedIndex)}</div>
        <footer>
          <button class="maria-recipe-index-button" type="button" data-recipe-index-open>Indice</button>
          <div class="maria-recipe-pager">
            <button type="button" data-recipe-prev${index === 0 ? ' hidden disabled' : ''} aria-label="Pagina precedente">←</button>
            <span data-recipe-counter>${index + 1} / ${pages.length}</span>
            <button type="button" data-recipe-next aria-label="${last ? 'Chiudi il ricettario' : 'Pagina successiva'}">${last ? 'Fine' : '→'}</button>
          </div>
        </footer>
        <button class="maria-overlay-close overlay-close" type="button" data-maria-close aria-label="Chiudi il ricettario"><span aria-hidden="true">×</span></button>
      </div>
    </div>`;
}

export function createMariaInteractions({ host, background, scene, period, audio }) {
  let overlay = null;
  let junkDrawer = null;
  let previousFocus = null;
  let selectedRecipeIndex = 0;
  let recipeIndex = 0;

  function close() {
    if (junkDrawer?.close()) return true;
    if (!overlay) return false;
    const closing = overlay;
    overlay = null;
    closing.classList.add('is-closing');
    window.setTimeout(() => closing.remove(), 180);
    background?.removeAttribute('inert');
    previousFocus?.focus({ preventScroll: true });
    return true;
  }

  function mount(markup, trigger) {
    if (overlay) return;
    previousFocus = trigger ?? document.activeElement;
    const template = document.createElement('template');
    template.innerHTML = markup;
    overlay = template.content.firstElementChild;
    overlay.addEventListener('click', handleOverlayClick);
    host.append(overlay);
    background?.setAttribute('inert', '');
    window.requestAnimationFrame(() => overlay?.classList.add('is-open'));
    overlay.querySelector('[data-maria-close]')?.focus({ preventScroll: true });
  }

  function updateRecipe() {
    if (!overlay?.matches('[data-maria-overlay="recipes"]')) return;
    const pages = recipePages[selectedRecipeIndex] ?? [];
    const step = isSingleRecipePage() ? 1 : 2;
    if (!isSingleRecipePage()) recipeIndex -= recipeIndex % 2;
    recipeIndex = Math.max(0, Math.min(Math.max(0, pages.length - 1), recipeIndex));
    const content = overlay.querySelector('[data-recipe-page]');
    content.innerHTML = renderRecipePage(recipeIndex, selectedRecipeIndex);
    content.scrollTop = 0;
    const previous = overlay.querySelector('[data-recipe-prev]');
    previous.hidden = recipeIndex === 0;
    previous.disabled = recipeIndex === 0;
    const next = overlay.querySelector('[data-recipe-next]');
    const last = recipeIndex + step >= pages.length;
    next.textContent = last ? 'Fine' : '→';
    next.setAttribute('aria-label', last ? 'Chiudi il ricettario' : 'Pagina successiva');
    overlay.querySelector('[data-recipe-counter]').textContent = `${Math.min(recipeIndex + 1, pages.length)} / ${pages.length}`;
  }

  function goRecipe(index) {
    const pages = recipePages[selectedRecipeIndex] ?? [];
    recipeIndex = Math.max(0, Math.min(pages.length - 1, index));
    updateRecipe();
  }

  function handleOverlayClick(event) {
    const target = event.target;
    if (target === overlay || target.closest('[data-maria-close]')) { close(); return; }
    if (target.closest('[data-recipe-open]')) {
      audio?.playEffect?.('book');
      const trigger = previousFocus;
      const old = overlay; overlay = null; old.remove();
      mount(renderRecipeIndex(), trigger);
      return;
    }
    if (target.closest('[data-recipe-select]')) {
      selectedRecipeIndex = Number(target.closest('[data-recipe-select]').dataset.recipeSelect);
      recipeIndex = 0;
      audio?.playEffect?.('book');
      const trigger = previousFocus;
      const old = overlay; overlay = null; old.remove();
      mount(renderRecipeBook(recipeIndex, selectedRecipeIndex), trigger);
      return;
    }
    if (target.closest('[data-recipe-index-open]')) {
      const trigger = previousFocus;
      const old = overlay; overlay = null; old.remove();
      mount(renderRecipeIndex(), trigger);
      return;
    }
    if (!target.closest('[data-recipe-prev], [data-recipe-next]')) return;
    const step = isSingleRecipePage() ? 1 : 2;
    if (target.closest('[data-recipe-prev]')) goRecipe(recipeIndex - step);
    if (target.closest('[data-recipe-next]')) {
      const pages = recipePages[selectedRecipeIndex] ?? [];
      if (recipeIndex + step >= pages.length) close();
      else goRecipe(recipeIndex + step);
    }
    if (target.closest('[data-recipe-prev], [data-recipe-next]')) audio?.playEffect?.('book');
  }

  function openBinocular(trigger) { mount(renderBinocularView(period), trigger); }
  async function openJunkDrawer(trigger) {
    junkDrawerModulePromise ??= import('./mariaJunkDrawer.js');
    const { createMariaJunkDrawer } = await junkDrawerModulePromise;
    if (!trigger?.closest('.scene--home-maria.is-active') || overlay) return;
    junkDrawer ??= createMariaJunkDrawer({ host, background });
    junkDrawer.open(trigger);
  }
  async function openRecipes(trigger) {
    await loadRecipeContent();
    if (!mariaRecipes.length || overlay || !trigger?.closest('.scene--home-maria.is-active')) return;
    selectedRecipeIndex = 0;
    recipeIndex = 0;
    audio?.playEffect?.('book');
    mount(renderRecipeIntro(), trigger);
  }

  function toggleFridge(trigger) {
    const fridge = scene.querySelector('[data-svg-id="maria-fridge"]');
    if (!fridge) return;
    const open = fridge.classList.toggle('is-open');
    trigger?.setAttribute('aria-pressed', String(open));
    trigger?.setAttribute('aria-label', `${open ? 'Chiudi' : 'Apri'} il frigo di Maria`);
  }

  function handleKeydown(event) {
    if (junkDrawer?.handleKeydown(event)) return true;
    if (!overlay) return false;
    if (event.key === 'Escape') close();
    else if (overlay.matches('[data-maria-overlay="recipes"]') && event.key === 'ArrowLeft') goRecipe(recipeIndex - (isSingleRecipePage() ? 1 : 2));
    else if (overlay.matches('[data-maria-overlay="recipes"]') && event.key === 'ArrowRight') goRecipe(recipeIndex + (isSingleRecipePage() ? 1 : 2));
    else return false;
    event.preventDefault();
    return true;
  }

  window.addEventListener('resize', () => {
    if (overlay?.matches('[data-maria-overlay="recipes"]')) updateRecipe();
  }, { passive: true });

  return { openBinocular, openJunkDrawer, openRecipes, toggleFridge, close, handleKeydown };
}
