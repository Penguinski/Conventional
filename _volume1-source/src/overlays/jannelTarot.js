import '../styles/jannelTarot.css';
import { getSupabaseClient, hasSupabaseConfiguration } from '../backend/supabaseClient.js';
import { jannelTarotAsset, jannelTarotCards } from '../content/jannelTarot.js';

const storageKey = 'conventional:jannel-daily-tarot';
const table = 'jannel_daily_tarot_readings';
const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function localDateKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function cardForSlug(slug) {
  return jannelTarotCards.find((card) => card.slug === slug) ?? null;
}

function readLocalToday() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return saved?.date === localDateKey() ? cardForSlug(saved.slug) : null;
  } catch {
    return null;
  }
}

function saveLocalToday(card) {
  try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, date: localDateKey(), slug: card.slug })); } catch { /* Keep the reading available for this opening. */ }
}

async function ensureIdentity(client) {
  if (!client) return null;
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  let session = sessionData.session;
  if (!session?.user) {
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  return session?.user ?? null;
}

async function readRemoteToday(client, identity) {
  const { data, error } = await client.from(table)
    .select('card_slug')
    .eq('owner_id', identity.id)
    .eq('local_date', localDateKey())
    .maybeSingle();
  if (error) throw error;
  return cardForSlug(data?.card_slug);
}

async function writeRemoteToday(client, identity, card) {
  const { data, error } = await client.from(table)
    .insert({ owner_id: identity.id, local_date: localDateKey(), card_slug: card.slug })
    .select('card_slug')
    .single();
  if (!error) return cardForSlug(data?.card_slug) ?? card;
  if (error.code === '23505') return readRemoteToday(client, identity) ?? card;
  throw error;
}

function closeButton() {
  return '<button class="overlay-close jannel-tarot-close" type="button" data-tarot-close aria-label="Chiudi i tarocchi">×</button>';
}

function introMarkup() {
  return `<div class="jannel-tarot-overlay" role="dialog" aria-modal="true" aria-labelledby="jannel-tarot-intro-title">
    <article class="jannel-tarot-panel jannel-tarot-panel--intro">
      <div class="jannel-tarot-intro-copy">
        <p class="jannel-tarot-kicker">TAROCCHI CONDOMINIALI</p>
        <h1 id="jannel-tarot-intro-title">Una carta al giorno</h1>
        <div class="jannel-tarot-rule" aria-hidden="true"><span></span></div>
        <p class="jannel-tarot-lead">Jannel sostiene che il mazzo non vada interrogato due volte. Non sappiamo se crederle, ma il regolamento è questo.</p>
        <div class="jannel-tarot-cta">
          <button type="button" data-tarot-draw>Pesca la carta di oggi <span aria-hidden="true">→</span></button>
          <p>La lettura resterà la stessa fino a domani.</p>
        </div>
      </div>
      <div class="jannel-tarot-intro-mark" aria-hidden="true"><span>XXI</span><b>✦</b><i>?</i></div>
      ${closeButton()}
    </article>
  </div>`;
}

function resultMarkup(card) {
  return `<div class="jannel-tarot-overlay" role="dialog" aria-modal="true" aria-labelledby="jannel-tarot-result-title">
    <article class="jannel-tarot-panel jannel-tarot-panel--result">
      <figure class="jannel-tarot-card"><img src="${jannelTarotAsset(card)}" alt="${esc(card.title)}" draggable="false"></figure>
      <div class="jannel-tarot-reading">
        <p class="jannel-tarot-kicker">LA CARTA DI OGGI</p>
        <h1 id="jannel-tarot-result-title"><span>${esc(card.roman)} —</span> ${esc(card.title)}</h1>
        <div class="jannel-tarot-rule" aria-hidden="true"><span></span></div>
        <p class="jannel-tarot-reading-copy">${esc(card.reading)}</p>
        <p class="jannel-tarot-footer">Il mazzo ha già parlato. Torna domani.</p>
      </div>
      ${closeButton()}
    </article>
  </div>`;
}

export function createJannelTarot({ host, background }) {
  let overlay = null;
  let previousFocus = null;
  let drawPending = false;
  let todayLoad = { date: null, promise: null };

  function loadToday() {
    const date = localDateKey();
    if (todayLoad.date === date && todayLoad.promise) return todayLoad.promise;
    const localCard = readLocalToday();
    if (!hasSupabaseConfiguration) {
      todayLoad = { date, promise: Promise.resolve(localCard) };
      return todayLoad.promise;
    }
    const client = getSupabaseClient();
    todayLoad = {
      date,
      promise: (async () => {
        try {
          const identity = await ensureIdentity(client);
          if (!identity) return localCard;
          const remoteCard = await readRemoteToday(client, identity);
          if (remoteCard) {
            saveLocalToday(remoteCard);
            return remoteCard;
          }
          if (localCard) {
            const restoredCard = await writeRemoteToday(client, identity, localCard);
            saveLocalToday(restoredCard);
            return restoredCard;
          }
          return null;
        } catch {
          return localCard;
        }
      })(),
    };
    return todayLoad.promise;
  }

  async function persistToday(card) {
    if (!hasSupabaseConfiguration) {
      saveLocalToday(card);
      return card;
    }
    try {
      const identity = await ensureIdentity(getSupabaseClient());
      const savedCard = identity ? await writeRemoteToday(getSupabaseClient(), identity, card) : card;
      saveLocalToday(savedCard);
      todayLoad = { date: localDateKey(), promise: Promise.resolve(savedCard) };
      return savedCard;
    } catch {
      saveLocalToday(card);
      todayLoad = { date: localDateKey(), promise: Promise.resolve(card) };
      return card;
    }
  }

  function mount(markup, trigger) {
    close(false);
    previousFocus = trigger ?? document.activeElement;
    const template = document.createElement('template');
    template.innerHTML = markup;
    overlay = template.content.firstElementChild;
    overlay.addEventListener('click', handleClick);
    host.append(overlay);
    background?.setAttribute('inert', '');
    requestAnimationFrame(() => overlay?.classList.add('is-open'));
    overlay.querySelector('[data-tarot-close]')?.focus({ preventScroll: true });
    return overlay;
  }

  function close(restore = true) {
    if (!overlay) return false;
    const closing = overlay;
    overlay = null;
    closing.classList.remove('is-open');
    closing.classList.add('is-closing');
    setTimeout(() => closing.remove(), 180);
    background?.removeAttribute('inert');
    if (restore) previousFocus?.focus({ preventScroll: true });
    return true;
  }

  function replace(markup) {
    if (!overlay) return null;
    const template = document.createElement('template');
    template.innerHTML = markup;
    const nextOverlay = template.content.firstElementChild;
    nextOverlay.addEventListener('click', handleClick);
    overlay.replaceWith(nextOverlay);
    overlay = nextOverlay;
    overlay.classList.add('is-open');
    overlay.querySelector('[data-tarot-close]')?.focus({ preventScroll: true });
    return overlay;
  }

  async function draw() {
    if (!overlay || drawPending) return;
    drawPending = true;
    const drawButton = overlay.querySelector('[data-tarot-draw]');
    if (drawButton) {
      drawButton.disabled = true;
      drawButton.setAttribute('aria-busy', 'true');
    }
    const existing = await loadToday();
    if (!overlay) {
      drawPending = false;
      return;
    }
    const card = existing ?? jannelTarotCards[Math.floor(Math.random() * jannelTarotCards.length)];
    const savedCard = existing ?? await persistToday(card);
    drawPending = false;
    replace(resultMarkup(savedCard));
  }

  function open(trigger) {
    const initialOverlay = mount(introMarkup(), trigger);
    loadToday().then((card) => {
      if (card && overlay === initialOverlay) replace(resultMarkup(card));
    });
  }

  function handleClick(event) {
    if (event.target === overlay || event.target.closest('[data-tarot-close]')) { close(); return; }
    if (event.target.closest('[data-tarot-draw]')) draw();
  }

  function handleKeydown(event) {
    if (!overlay || event.key !== 'Escape') return false;
    event.preventDefault();
    close();
    return true;
  }

  return { open, close, handleKeydown };
}
