const baseUrl = import.meta.env.BASE_URL ?? '/vol1-test/';
const elevatorAsset = `${baseUrl}assets/elevator/ascensore4.svg`;
const assetPack = `${baseUrl}assets/elevator/ascensore3-assets.svg`;

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const slots = [
  { x: 30, y: 33, name: 'angolo posteriore sinistro', distance: 5, centrality: 1, exit: 4, adaptation: 3 },
  { x: 50, y: 33, name: 'centro posteriore', distance: 3, centrality: 4, exit: 2, adaptation: 3 },
  { x: 70, y: 33, name: 'angolo posteriore destro', distance: 5, centrality: 1, exit: 4, adaptation: 3 },
  { x: 30, y: 51, name: 'lato sinistro', distance: 4, centrality: 2, exit: 3, adaptation: 4 },
  { x: 50, y: 51, name: 'centro cabina', distance: 1, centrality: 5, exit: 2, adaptation: 2 },
  { x: 70, y: 51, name: 'lato destro', distance: 4, centrality: 2, exit: 3, adaptation: 4 },
  { x: 30, y: 68, name: 'vicino alle porte, sinistra', distance: 3, centrality: 2, exit: 5, adaptation: 4 },
  { x: 50, y: 68, name: 'davanti al centro', distance: 2, centrality: 4, exit: 4, adaptation: 3 },
  { x: 70, y: 68, name: 'vicino alle porte, destra', distance: 3, centrality: 2, exit: 5, adaptation: 4 },
];

const rounds = [
  {
    title: 'Dove ti metti?',
    description: 'Stai entrando nell’ascensore. Ci sono già due persone.',
    occupants: [
      { asset: 'char-paolo', slot: 0 },
      { asset: 'char-maria', slot: 2 },
    ],
    feedback: [
      'Un angolo libero: la diplomazia ringrazia.',
      'Centrale, ma con una certa compostezza.',
      'Hai scelto il gemello dell’angolo. Solido.',
      'Lato sinistro: distanza corretta, uscita possibile.',
      'Il centro. Una dichiarazione di presenza.',
      'Lato destro: equilibrio senza annunci.',
      'Vicino alle porte: prudenza o lungimiranza?',
      'Davanti al centro: una posizione osservata.',
      'Uscita a destra: preparazione metodica.',
    ],
  },
  {
    title: 'Lo spazio si restringe.',
    description: 'Entra un’altra persona. Ora la densità sociale aumenta.',
    occupants: [
      { asset: 'char-paolo', slot: 0 },
      { asset: 'char-maria', slot: 2 },
      { asset: 'char-arturo', slot: 4 },
    ],
    feedback: [
      'Ti sei tenuto un margine. Una scelta civile.',
      'Dietro tutti, ma non fuori dalla conversazione.',
      'L’angolo opposto resta una zona franca.',
      'Hai lasciato passare l’aria. E forse anche il silenzio.',
      'Il centro è occupato. Letteralmente e non solo.',
      'Un compromesso laterale, senza gesti teatrali.',
      'Vicino alle porte: nessun piano di fuga dichiarato.',
      'Davanti al centro: la geometria sociale approva.',
      'Pronto a uscire, ma con educazione.',
    ],
  },
  {
    title: 'Conta anche il contesto.',
    description: 'L’ascensore è quasi pieno. Restano pochi centimetri e molte convenzioni.',
    occupants: [
      { asset: 'char-rossi-padre', slot: 0 },
      { asset: 'char-rossi-madre', slot: 1 },
      { asset: 'char-jannel', slot: 2 },
      { asset: 'char-hijab', slot: 3 },
      { asset: 'char-cappello', slot: 5 },
    ],
    feedback: [
      'Hai trovato l’ultimo angolo. La cabina conserva memoria.',
      'Dietro al gruppo: presenza discreta, spazio salvo.',
      'Un angolo rimasto per miracolo.',
      'Lato sinistro: diplomazia in pochi centimetri.',
      'Il centro era già una questione aperta.',
      'Hai adattato la postura al contesto. Quasi scientifico.',
      'Vicino all’uscita: stratega dell’ultimo piano.',
      'Davanti al centro: composto fino all’ultimo piano.',
      'L’uscita è a portata di decisione. Non di panico.',
    ],
  },
];

const profiles = [
  {
    key: 'uscita',
    title: 'Stratega dell’uscita',
    description: 'Non fuggi: ti prepari. Ogni porta ha un lato più pratico, e tu lo hai già individuato.',
    when: (metrics) => metrics.exit >= 12,
  },
  {
    key: 'angolo',
    title: 'Custode dell’angolo',
    description: 'Lasci agli altri il centro della scena. Tu garantisci distanza, silenzio e una dignitosa visuale della porta.',
    when: (metrics) => metrics.distance >= 12 && metrics.centrality <= 8,
  },
  {
    key: 'centro',
    title: 'Centrista impassibile',
    description: 'Il centro non ti spaventa. Lo abiti con la calma di chi ha già deciso che sarà un viaggio breve.',
    when: (metrics) => metrics.centrality >= 12,
  },
  {
    key: 'laterale',
    title: 'Diplomatico laterale',
    description: 'Non invadi, non sparisci. Ti adatti alla stanza e lasci che l’ascensore faccia il resto.',
    when: () => true,
  },
];

function useMarkup(assetId, viewBox, transform) {
  return `<svg class="elevator-game-asset" viewBox="${viewBox}" aria-hidden="true" focusable="false"><use href="${assetPack}#${assetId}" transform="${transform}"></use></svg>`;
}

function slotMarkup(round, choice) {
  const occupied = new Set(round.occupants.map((person) => person.slot));
  return slots.map((slot, index) => {
    const isOccupied = occupied.has(index);
    const isChosen = choice === index;
    const disabled = isOccupied || choice != null;
    return `<button class="elevator-game-slot${isChosen ? ' is-chosen' : ''}${isOccupied ? ' is-occupied' : ''}" type="button" data-game-choice="${index}" style="--x:${slot.x}%;--y:${slot.y}%" aria-label="${esc(`Posizione ${index + 1}: ${slot.name}`)}"${disabled ? ' disabled' : ''}>${useMarkup(isChosen ? 'asset-slot-active' : 'asset-slot', isChosen ? '-60 -60 120 120' : '-60 -60 120 120', isChosen ? 'translate(-1390 -660)' : 'translate(-1160 -660)')}<span class="sr-only">${esc(slot.name)}</span></button>`;
  }).join('');
}

function peopleMarkup(round) {
  return round.occupants.map(({ asset, slot }) => {
    const position = slots[slot];
    const assetPosition = {
      'char-paolo': [1620, 150],
      'char-maria': [1390, 150],
      'char-rossi-padre': [1850, 150],
      'char-rossi-madre': [2080, 150],
      'char-rossi-bambino': [1160, 390],
      'char-arturo': [1390, 390],
      'char-jannel': [1620, 390],
      'char-hijab': [1850, 390],
      'char-cappello': [2080, 390],
    }[asset] ?? [1160, 150];
    return `<span class="elevator-game-person" style="--x:${position.x}%;--y:${position.y}%">${useMarkup(asset, '-60 -50 120 110', `translate(-${assetPosition[0]} -${assetPosition[1]})`)} </span>`;
  }).join('');
}

function markerMarkup(choice) {
  if (choice == null) return '';
  const position = slots[choice];
  return `<span class="elevator-game-you" style="--x:${position.x}%;--y:${position.y}%">${useMarkup('asset-marker-tu', '-78 -116 156 198', 'translate(-1620 -660)')}</span>`;
}

function cabinMarkup(round, choice, { final = false } = {}) {
  return `<div class="elevator-game-cabin" aria-label="Cabina dell’ascensore vista dall’alto">
    <img class="elevator-game-cabin-base" src="${elevatorAsset}" alt="Cabina dell’ascensore vista dall’alto" draggable="false">
    <div class="elevator-game-cabin-layer">${slotMarkup(round, choice)}${peopleMarkup(round)}${markerMarkup(choice)}</div>
    ${final ? '<span class="elevator-game-cabin-caption">CAPACITÀ MASSIMA · 6 PERSONE</span>' : ''}
  </div>`;
}

function metricsFor(choices) {
  const totals = choices.reduce((metrics, choice, roundIndex) => {
    const slot = slots[choice];
    metrics.distance += slot.distance;
    metrics.centrality += slot.centrality;
    metrics.exit += slot.exit;
    metrics.adaptation += slot.adaptation + (roundIndex > 0 && choice !== choices[roundIndex - 1] ? 1 : 0);
    return metrics;
  }, { distance: 0, centrality: 0, exit: 0, adaptation: 0 });
  return totals;
}

function profileFor(metrics) {
  return profiles.find((profile) => profile.when(metrics));
}

function metricMarkup(label, value) {
  const dots = Array.from({ length: 5 }, (_, index) => `<i class="${index < Math.round(value / 3) ? 'is-full' : ''}" aria-hidden="true"></i>`).join('');
  return `<div class="elevator-game-metric"><span>${label}</span><div>${dots}</div></div>`;
}

function metricsMarkup(metrics) {
  return `<div class="elevator-game-metrics">${metricMarkup('Distanza sociale', metrics.distance)}${metricMarkup('Centralità', metrics.centrality)}${metricMarkup('Propensione all’uscita', metrics.exit)}${metricMarkup('Adattamento', metrics.adaptation)}</div>`;
}

function recapMarkup(choices) {
  return `<section class="elevator-game-recap" aria-label="Recap delle tre scelte"><h2>Il tuo percorso</h2><div>${choices.map((choice, index) => `<figure><div class="elevator-game-recap-cabin">${cabinMarkup(rounds[index], choice).replace(' aria-label="Cabina dell’ascensore vista dall’alto"', ' aria-hidden="true"')}</div><figcaption>ROUND ${index + 1}</figcaption></figure>`).join('')}</div></section>`;
}

function closeButton() {
  return '<button class="overlay-close feature-close elevator-game-close" type="button" data-game-action="close" aria-label="Chiudi il gioco">×</button>';
}

function renderMarkup(state) {
  const round = rounds[state.roundIndex];
  const choice = state.choices[state.roundIndex] ?? null;
  const isResult = state.screen === 'result';
  const metrics = isResult ? metricsFor(state.choices) : null;
  const profile = isResult ? profileFor(metrics) : null;
  const title = state.screen === 'intro' ? 'La scienza del posto giusto' : isResult ? 'Il tuo profilo' : round.title;
  const kicker = state.screen === 'intro' ? 'QUIZ DA ASCENSORE' : isResult ? 'RISULTATO FINALE' : `ROUND ${state.roundIndex + 1} / ${rounds.length}`;
  const copy = state.screen === 'intro'
    ? `<p class="elevator-game-lead">La prossemica studia il modo in cui usiamo lo spazio tra noi e gli altri. L’ascensore è uno dei suoi laboratori più scomodi.</p><p class="elevator-game-smallprint">Tre round, nessun esito corretto. Test scientificamente validato: assolutamente no.</p><div class="elevator-game-intro-actions"><button class="elevator-game-primary" type="button" data-game-action="start">GIOCA <span aria-hidden="true">→</span></button><button class="elevator-game-secondary" type="button" data-game-action="article">LEGGI L’ARTICOLO <span aria-hidden="true">→</span></button></div>`
    : isResult
      ? `<h1 class="elevator-game-profile-title">${esc(profile.title)}</h1><p class="elevator-game-lead">${esc(profile.description)}</p><div class="elevator-game-actions"><button class="elevator-game-primary" type="button" data-game-action="retry">RIGIOCA <span aria-hidden="true">↻</span></button></div>`
      : `<p class="elevator-game-lead">${esc(round.description)}</p>${choice != null ? `<div class="elevator-game-feedback" aria-live="polite">${esc(round.feedback[choice])}</div><button class="elevator-game-primary" type="button" data-game-action="next">${state.roundIndex === rounds.length - 1 ? 'VEDI IL PROFILO' : 'SCENARIO SUCCESSIVO'} <span aria-hidden="true">→</span></button>` : '<p class="elevator-game-instruction">TOCCA UNA POSIZIONE NELLA CABINA.</p>'}`;

  const visual = isResult
    ? `<div class="elevator-game-visual elevator-game-visual--result">${recapMarkup(state.choices)}${metricsMarkup(metrics)}</div>`
    : `<div class="elevator-game-visual">${cabinMarkup(round, choice)}</div>`;

  return `<div class="feature-overlay feature-overlay--game" role="dialog" aria-modal="true" aria-labelledby="elevator-game-title"><section class="elevator-position-game">
    <div class="elevator-game-copy"><header><p class="feature-kicker">${kicker}</p><h1 id="elevator-game-title">${title}</h1></header>${copy}</div>
    ${visual}
    ${closeButton()}
  </section></div>`;
}

export function createElevatorPositionGame({ host, background, onReadArticle }) {
  let overlay = null;
  let previousFocus = null;
  let state = null;

  function focusAfterRender() {
    const target = overlay?.querySelector('[data-game-action="next"], [data-game-action="start"], [data-game-action="retry"], .elevator-game-close');
    target?.focus({ preventScroll: true });
  }

  function render() {
    const template = document.createElement('template');
    template.innerHTML = renderMarkup(state);
    const next = template.content.firstElementChild;
    next.addEventListener('click', handleClick);
    next.addEventListener('click', delegatedClick, true);
    next.classList.add('is-open');
    if (overlay) overlay.replaceWith(next);
    else host.append(next);
    overlay = next;
    requestAnimationFrame(focusAfterRender);
  }

  function open(trigger) {
    close(false);
    previousFocus = trigger ?? document.activeElement;
    state = { screen: 'intro', roundIndex: 0, choices: [] };
    background?.setAttribute('inert', '');
    render();
  }

  function close(restore = true) {
    if (!overlay) return false;
    const closing = overlay;
    overlay = null;
    state = null;
    closing.classList.remove('is-open');
    closing.classList.add('is-closing');
    window.setTimeout(() => closing.remove(), 180);
    background?.removeAttribute('inert');
    if (restore) previousFocus?.focus({ preventScroll: true });
    return true;
  }

  function handleClick(event) {
    const action = event.target.closest('[data-game-action]')?.dataset.gameAction;
    if (event.target === overlay || action === 'close') { close(); return; }
    if (!action || !state) return;
    if (action === 'start') { state.screen = 'round'; render(); return; }
    if (action === 'article') { onReadArticle?.(event.target.closest('[data-game-action="article"]')); return; }
    if (action === 'retry') { state = { screen: 'round', roundIndex: 0, choices: [] }; render(); return; }
    if (action === 'choice') return;
    if (action === 'next') {
      if (state.roundIndex === rounds.length - 1) state.screen = 'result';
      else { state.roundIndex += 1; }
      render();
    }
  }

  function handleChoice(event) {
    const choice = event.target.closest('[data-game-choice]');
    if (!choice || !state || state.screen !== 'round') return false;
    const index = Number(choice.dataset.gameChoice);
    if (!Number.isInteger(index) || slots[index] == null || rounds[state.roundIndex].occupants.some((person) => person.slot === index)) return false;
    state.choices[state.roundIndex] = index;
    render();
    return true;
  }

  function handleKeydown(event) {
    if (!overlay) return false;
    if (event.key === 'Escape') { event.preventDefault(); close(); return true; }
    return false;
  }

  function delegatedClick(event) {
    if (handleChoice(event)) return;
    if (event.target.closest('[data-game-action]')) return;
  }

  return {
    open,
    close,
    handleKeydown,
    get isOpen() { return Boolean(overlay); },
  };
}
