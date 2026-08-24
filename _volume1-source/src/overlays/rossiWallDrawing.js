const storageKey = 'conventional:rossi-wall-drawing:v1';
const svgNamespace = 'http://www.w3.org/2000/svg';
const canvasWidth = 1000;
const canvasHeight = 540;
const maximumStrokes = 80;
const maximumPoints = 420;
const previewOrigin = { x: 1015, y: 255 };
const previewScale = .64;

const normalizedPoint = (x, y) => ({ x: x / canvasWidth, y: y / canvasHeight });
const initialCircle = {
  points: Array.from({ length: 37 }, (_, index) => {
    const angle = -.42 + (index / 36) * Math.PI * 2;
    const radius = 91 + Math.sin(index * 1.7) * 2.2;
    return normalizedPoint(350 + Math.cos(angle) * radius, 274 + Math.sin(angle) * radius);
  }),
};
const initialWallDrawing = Object.freeze([
  initialCircle,
  { points: [[650, 120], [622, 121], [590, 129], [558, 142], [526, 158], [496, 176], [470, 194], [450, 211]].map(([x, y]) => normalizedPoint(x, y)) },
  { points: [[450, 211], [458, 181], [469, 153]].map(([x, y]) => normalizedPoint(x, y)) },
  { points: [[450, 211], [482, 214], [514, 220]].map(([x, y]) => normalizedPoint(x, y)) },
]);

function sanitizePoint(point) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
}

function sanitizeStrokes(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(-maximumStrokes).map((stroke) => ({
    points: (Array.isArray(stroke?.points) ? stroke.points : [])
      .slice(0, maximumPoints)
      .map(sanitizePoint)
      .filter(Boolean),
  })).filter((stroke) => stroke.points.length > 0);
}

function readRossiWallDrawingState() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored == null) return { initialized: false, strokes: sanitizeStrokes(initialWallDrawing) };
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed?.strokes)) return { initialized: false, strokes: sanitizeStrokes(initialWallDrawing) };
    return { initialized: true, strokes: sanitizeStrokes(parsed.strokes) };
  } catch {
    return { initialized: false, strokes: sanitizeStrokes(initialWallDrawing) };
  }
}

export function readRossiWallDrawing() {
  return readRossiWallDrawingState().strokes;
}

function saveRossiWallDrawing(strokes) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, strokes: sanitizeStrokes(strokes) }));
  } catch {
    // The drawing remains usable for the current visit if storage is unavailable.
  }
}

function pathData(stroke, width = canvasWidth, height = canvasHeight) {
  return stroke.points.map((point, index) => `${index ? 'L' : 'M'}${(point.x * width).toFixed(1)} ${(point.y * height).toFixed(1)}`).join(' ');
}

function renderDrawingPaths(strokes) {
  return strokes.map((stroke) => `<path d="${pathData(stroke)}"/>`).join('');
}

export function renderRossiWallPreview(scene, strokes = readRossiWallDrawing()) {
  const layer = scene?.querySelector('[data-svg-id="rossi-wall-drawing-layer"]');
  if (!layer) return;
  layer.replaceChildren();
  for (const stroke of sanitizeStrokes(strokes)) {
    const path = document.createElementNS(svgNamespace, 'path');
    path.setAttribute('d', pathData(stroke));
    path.setAttribute('transform', `translate(${previewOrigin.x} ${previewOrigin.y}) scale(${previewScale})`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#d52d20');
    path.setAttribute('stroke-width', '7');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    layer.append(path);
  }
}

function renderOverlay(strokes) {
  return `<div class="rossi-wall-overlay" role="dialog" aria-modal="true" aria-labelledby="rossi-wall-title">
    <section class="rossi-wall-editor">
      <header><p>CASA ROSSI</p><h1 id="rossi-wall-title">Il muro è tutto tuo.</h1></header>
      <div class="rossi-wall-surface">
        <svg data-rossi-wall-canvas viewBox="0 0 ${canvasWidth} ${canvasHeight}" aria-label="Area su cui disegnare con il pennarello rosso">
          <rect width="${canvasWidth}" height="${canvasHeight}" fill="#f5dcc6"/>
          <path class="rossi-wall-shadow" d="M0 488H1000V540H0Z"/>
          <path class="rossi-wall-baseboard" d="M0 488H1000"/>
          <g class="rossi-wall-strokes" data-rossi-wall-strokes>${renderDrawingPaths(strokes)}</g>
        </svg>
      </div>
      <footer>
        <button type="button" data-rossi-wall-clear>Cancella tutto</button>
        <button type="button" data-rossi-wall-done>Fatto</button>
      </footer>
      <button class="rossi-overlay-close overlay-close" type="button" data-rossi-wall-close aria-label="Chiudi il muro"><span aria-hidden="true">×</span></button>
    </section>
  </div>`;
}

export function createRossiWallDrawing({ host, background, scene }) {
  let overlay = null;
  let previousFocus = null;
  const initialState = readRossiWallDrawingState();
  let strokes = initialState.strokes;
  if (!initialState.initialized) saveRossiWallDrawing(strokes);
  let activeStroke = null;
  let pointerId = null;

  function updatePreview() {
    renderRossiWallPreview(scene, strokes);
  }

  function pointFromEvent(event) {
    const svg = overlay?.querySelector('[data-rossi-wall-canvas]');
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return sanitizePoint({ x: point.x / canvasWidth, y: point.y / canvasHeight });
  }

  function appendPoint(event) {
    if (event.pointerId !== pointerId || !activeStroke) return;
    const point = pointFromEvent(event);
    if (!point) return;
    const previous = activeStroke.points.at(-1);
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < .0035) return;
    if (activeStroke.points.length >= maximumPoints) return;
    activeStroke.points.push(point);
    const path = overlay.querySelector('[data-active-wall-stroke]');
    if (path) path.setAttribute('d', pathData(activeStroke));
  }

  function finishStroke(event) {
    if (pointerId == null || (event?.pointerId != null && event.pointerId !== pointerId)) return;
    const svg = overlay?.querySelector('[data-rossi-wall-canvas]');
    const finishingPointer = pointerId;
    pointerId = null;
    activeStroke = null;
    svg?.querySelector('[data-active-wall-stroke]')?.removeAttribute('data-active-wall-stroke');
    if (svg?.hasPointerCapture?.(finishingPointer)) svg.releasePointerCapture(finishingPointer);
    saveRossiWallDrawing(strokes);
    updatePreview();
  }

  function startStroke(event) {
    if (event.button > 0 || pointerId != null) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.preventDefault();
    if (strokes.length >= maximumStrokes) strokes = strokes.slice(1);
    activeStroke = { points: [point] };
    strokes.push(activeStroke);
    pointerId = event.pointerId;
    const path = document.createElementNS(svgNamespace, 'path');
    path.setAttribute('d', pathData(activeStroke));
    path.setAttribute('data-active-wall-stroke', '');
    overlay.querySelector('[data-rossi-wall-strokes]')?.append(path);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function close() {
    if (!overlay) return false;
    finishStroke();
    const closing = overlay;
    overlay = null;
    closing.classList.add('is-closing');
    window.setTimeout(() => closing.remove(), 180);
    background?.removeAttribute('inert');
    previousFocus?.focus({ preventScroll: true });
    return true;
  }

  function clear() {
    strokes = [];
    saveRossiWallDrawing(strokes);
    overlay?.querySelector('[data-rossi-wall-strokes]')?.replaceChildren();
    updatePreview();
  }

  function open(trigger) {
    if (overlay) return;
    previousFocus = trigger ?? document.activeElement;
    strokes = readRossiWallDrawing();
    const template = document.createElement('template');
    template.innerHTML = renderOverlay(strokes);
    overlay = template.content.firstElementChild;
    const canvas = overlay.querySelector('[data-rossi-wall-canvas]');
    canvas.addEventListener('pointerdown', startStroke);
    canvas.addEventListener('pointermove', appendPoint);
    canvas.addEventListener('pointerup', finishStroke);
    canvas.addEventListener('pointercancel', finishStroke);
    canvas.addEventListener('lostpointercapture', finishStroke);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('[data-rossi-wall-close], [data-rossi-wall-done]')) close();
      else if (event.target.closest('[data-rossi-wall-clear]')) clear();
    });
    host.append(overlay);
    background?.setAttribute('inert', '');
    window.requestAnimationFrame(() => overlay?.classList.add('is-open'));
    overlay.querySelector('[data-rossi-wall-done]')?.focus({ preventScroll: true });
  }

  function handleKeydown(event) {
    if (!overlay || event.key !== 'Escape') return false;
    event.preventDefault();
    close();
    return true;
  }

  return { open, close, handleKeydown, updatePreview };
}
