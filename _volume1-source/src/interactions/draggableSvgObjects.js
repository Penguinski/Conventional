const SVG_NS = 'http://www.w3.org/2000/svg';

export const BOX_PHYSICS_CONFIG = Object.freeze({
  ids: ['box-left-1', 'box-left-2', 'box-1', 'box-2', 'box-3', 'box-4', 'box-5', 'box-6', 'box-7', 'box-8', 'box-9', 'box-10', 'box-right-1', 'box-right-2'],
  gravity: 1450, maxSpeed: 1250, restitution: 0.12, airDrag: 0.985, floorFriction: 0.68,
});

export function clampDragDelta(delta, start, bounds, inset = 10) {
  const minimum = bounds.start + inset - start.start;
  const maximum = bounds.end - inset - start.end;
  if (minimum > maximum) return 0;
  return Math.min(maximum, Math.max(minimum, delta));
}

function screenDeltaToLocal(node, x, y) {
  const matrix = node?.getScreenCTM?.();
  if (!matrix) return { x: 0, y: 0 };
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  if (!determinant) return { x: 0, y: 0 };
  return { x: (matrix.d * x - matrix.c * y) / determinant, y: (-matrix.b * x + matrix.a * y) / determinant };
}

function wrapSvgObject(node, label) {
  const wrapper = document.createElementNS(SVG_NS, 'g');
  wrapper.classList.add('draggable-box');
  wrapper.dataset.draggableBox = node.dataset.svgId;
  wrapper.setAttribute('tabindex', '0');
  wrapper.setAttribute('role', 'button');
  wrapper.setAttribute('aria-label', label);
  node.before(wrapper);
  wrapper.append(node);
  return wrapper;
}

function setPosition(wrapper, state) {
  wrapper.style.setProperty('--box-x', `${state.x}px`);
  wrapper.style.setProperty('--box-y', `${state.y}px`);
  wrapper.style.setProperty('--box-r', `${state.rotation}deg`);
}

function clampMagnitude(value, maximum) { return Math.max(-maximum, Math.min(maximum, value)); }

export function initializeDraggableSvgObjects(scene, config = BOX_PHYSICS_CONFIG) {
  const svg = scene?.querySelector('.qwen-svg');
  if (!svg) return { setActive() {}, destroy() {}, wrappers: [] };
  const states = config.ids.flatMap((id, index) => {
    const node = svg.querySelector(`[data-svg-id="${id}"]`);
    if (!node || node.closest('[data-draggable-box]')) return [];
    const wrapper = wrapSvgObject(node, `Sposta lo scatolone ${index + 1}`);
    return [{ wrapper, x: 0, y: 0, rotation: 0, vx: 0, vy: 0, angularVelocity: 0, pointerId: null, dragStart: null, samples: [], moving: false }];
  });
  let active = scene.classList.contains('is-active');
  let frame = 0;
  let lastTime = 0;

  function renderedGroundY() {
    const floor = svg.querySelector('[data-svg-id="physics-floor"]');
    if (!floor || typeof floor.getBBox !== 'function') return scene.getBoundingClientRect().bottom;
    const box = floor.getBBox();
    const matrix = floor.getScreenCTM();
    return matrix ? matrix.b * box.x + matrix.d * box.y + matrix.f : scene.getBoundingClientRect().bottom;
  }

  function correctBounds(state) {
    const box = state.wrapper.getBoundingClientRect();
    const bounds = scene.getBoundingClientRect();
    let correctionX = 0;
    let correctionY = 0;
    if (box.left < bounds.left) correctionX = bounds.left - box.left;
    else if (box.right > bounds.right) correctionX = bounds.right - box.right;
    const groundY = renderedGroundY();
    if (box.top < bounds.top) correctionY = bounds.top - box.top;
    else if (box.bottom > groundY) correctionY = groundY - box.bottom;
    if (correctionX) {
      const delta = screenDeltaToLocal(state.wrapper.parentElement, correctionX, 0);
      state.x += delta.x; state.y += delta.y; state.vx *= -config.restitution; state.angularVelocity *= 0.55;
    }
    if (correctionY) {
      const delta = screenDeltaToLocal(state.wrapper.parentElement, 0, correctionY);
      state.x += delta.x; state.y += delta.y; state.vy *= -config.restitution;
      state.vx *= config.floorFriction; state.angularVelocity *= 0.48;
    }
    return correctionY < 0;
  }

  function tick(time) {
    frame = 0;
    if (!active) return;
    const dt = Math.min(0.032, Math.max(0.001, (time - (lastTime || time - 16)) / 1000));
    lastTime = time;
    let keepRunning = false;
    for (const state of states) {
      if (!state.moving || state.pointerId !== null) continue;
      state.vy += config.gravity * dt;
      const damping = Math.pow(config.airDrag, dt * 60);
      state.vx *= damping; state.vy *= damping; state.angularVelocity *= Math.pow(0.97, dt * 60);
      const delta = screenDeltaToLocal(state.wrapper.parentElement, state.vx * dt, state.vy * dt);
      state.x += delta.x; state.y += delta.y; state.rotation += state.angularVelocity * dt;
      setPosition(state.wrapper, state);
      const onFloor = correctBounds(state);
      if (onFloor && Math.abs(state.vy) < 32 && Math.abs(state.vx) < 18) {
        state.vx = 0; state.vy = 0; state.angularVelocity = 0; state.moving = false;
        state.wrapper.classList.remove('is-in-motion');
      } else keepRunning = true;
      setPosition(state.wrapper, state);
    }
    if (keepRunning) frame = window.requestAnimationFrame(tick);
  }

  function requestPhysics() {
    if (!active || frame) return;
    lastTime = 0;
    frame = window.requestAnimationFrame(tick);
  }

  for (const state of states) {
    const { wrapper } = state;
    setPosition(wrapper, state);
    wrapper.addEventListener('pointerdown', (event) => {
      if (!active || !event.isPrimary || event.button > 0) return;
      event.preventDefault();
      const box = wrapper.getBoundingClientRect();
      const sceneBounds = scene.getBoundingClientRect();
      const bounds = { left: sceneBounds.left, right: sceneBounds.right, top: sceneBounds.top, bottom: renderedGroundY() };
      state.pointerId = event.pointerId; state.moving = false; state.vx = 0; state.vy = 0;
      wrapper.classList.remove('is-in-motion');
      state.dragStart = { clientX: event.clientX, clientY: event.clientY, x: state.x, y: state.y, box, bounds };
      state.samples = [{ x: event.clientX, y: event.clientY, time: event.timeStamp }];
      wrapper.classList.add('is-dragging');
      wrapper.setPointerCapture?.(event.pointerId);
    });
    wrapper.addEventListener('pointermove', (event) => {
      if (state.pointerId !== event.pointerId || !state.dragStart) return;
      event.preventDefault();
      const rawX = event.clientX - state.dragStart.clientX;
      const rawY = event.clientY - state.dragStart.clientY;
      const clientX = clampDragDelta(rawX, { start: state.dragStart.box.left, end: state.dragStart.box.right }, { start: state.dragStart.bounds.left, end: state.dragStart.bounds.right }, 0);
      const clientY = clampDragDelta(rawY, { start: state.dragStart.box.top, end: state.dragStart.box.bottom }, { start: state.dragStart.bounds.top, end: state.dragStart.bounds.bottom }, 0);
      const delta = screenDeltaToLocal(wrapper.parentElement, clientX, clientY);
      state.x = state.dragStart.x + delta.x; state.y = state.dragStart.y + delta.y;
      state.rotation = Math.max(-3, Math.min(3, rawX * 0.018));
      state.samples.push({ x: event.clientX, y: event.clientY, time: event.timeStamp });
      state.samples = state.samples.filter((sample) => event.timeStamp - sample.time <= 120).slice(-6);
      setPosition(wrapper, state);
    });
    const finishDrag = (event) => {
      if (state.pointerId !== event.pointerId) return;
      const newest = state.samples.at(-1);
      const oldest = state.samples[0];
      const elapsed = newest && oldest ? Math.max(16, newest.time - oldest.time) / 1000 : 0;
      state.vx = elapsed ? clampMagnitude((newest.x - oldest.x) / elapsed, config.maxSpeed) : 0;
      state.vy = elapsed ? clampMagnitude((newest.y - oldest.y) / elapsed, config.maxSpeed) : 0;
      state.angularVelocity = clampMagnitude(state.vx * 0.018, 120);
      state.pointerId = null; state.dragStart = null; state.samples = []; state.moving = true;
      wrapper.classList.remove('is-dragging');
      wrapper.classList.add('is-in-motion');
      requestPhysics();
    };
    wrapper.addEventListener('pointerup', finishDrag);
    wrapper.addEventListener('pointercancel', finishDrag);
    wrapper.addEventListener('lostpointercapture', finishDrag);
    wrapper.addEventListener('keydown', (event) => {
      const directions = { ArrowLeft: [-14, 0], ArrowRight: [14, 0], ArrowUp: [0, -14], ArrowDown: [0, 14] };
      const movement = directions[event.key];
      if (!movement || !active) return;
      event.preventDefault();
      const delta = screenDeltaToLocal(wrapper.parentElement, movement[0], movement[1]);
      state.x += delta.x; state.y += delta.y; state.vx = movement[0] * 7; state.vy = movement[1] * 7; state.moving = true;
      wrapper.classList.add('is-in-motion');
      setPosition(wrapper, state); requestPhysics();
    });
  }

  return {
    wrappers: states.map((state) => state.wrapper),
    setActive(value) {
      active = Boolean(value);
      if (!active) {
        window.cancelAnimationFrame(frame); frame = 0;
        states.forEach((state) => { state.moving = false; state.vx = 0; state.vy = 0; state.wrapper.classList.remove('is-in-motion'); });
      }
    },
    destroy() { active = false; window.cancelAnimationFrame(frame); frame = 0; },
  };
}
