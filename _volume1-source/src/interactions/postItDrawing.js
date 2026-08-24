const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_STROKES = 64;
const MAX_POINTS_PER_STROKE = 128;
const MAX_TOTAL_POINTS = 2048;

export function sanitizeStrokes(strokes) {
  let total = 0;
  return (Array.isArray(strokes) ? strokes : []).slice(0, MAX_STROKES).flatMap((stroke) => {
    const points = (Array.isArray(stroke?.points) ? stroke.points : []).slice(0, MAX_POINTS_PER_STROKE).flatMap((point) => {
      if (total >= MAX_TOTAL_POINTS || !Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return [];
      total += 1;
      return [{ x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) }];
    });
    return points.length > 1 ? [{ points }] : [];
  });
}

function strokePath(points) {
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x * 100} ${point.y * 100}`).join(' ');
}

export function renderStrokes(svg, strokes) {
  svg.replaceChildren(...sanitizeStrokes(strokes).map((stroke) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', strokePath(stroke.points));
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    return path;
  }));
}

export function attachPostItDrawing(svg, onChange) {
  let strokes = [];
  let active = null;
  let pointerId = null;

  function pointFromEvent(event) {
    const matrix = svg.getScreenCTM?.();
    if (matrix) {
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      return {
        x: Math.max(0, Math.min(1, point.x / 100)),
        y: Math.max(0, Math.min(1, point.y / 100)),
      };
    }
    const rect = svg.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  }

  function redraw() { renderStrokes(svg, strokes); onChange?.(strokes); }

  svg.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button > 0 || strokes.length >= MAX_STROKES) return;
    event.preventDefault();
    pointerId = event.pointerId;
    active = { points: [pointFromEvent(event)] };
    strokes.push(active);
    svg.setPointerCapture?.(pointerId);
    redraw();
  });
  svg.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId || !active) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    const previous = active.points.at(-1);
    if (active.points.length >= MAX_POINTS_PER_STROKE || Math.hypot(point.x - previous.x, point.y - previous.y) < 0.008) return;
    active.points.push(point);
    redraw();
  });
  const finish = (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    active = null;
    strokes = sanitizeStrokes(strokes);
    redraw();
  };
  svg.addEventListener('pointerup', finish);
  svg.addEventListener('pointercancel', finish);

  return {
    clear() { strokes = []; active = null; redraw(); },
    getStrokes() { return sanitizeStrokes(strokes); },
  };
}
