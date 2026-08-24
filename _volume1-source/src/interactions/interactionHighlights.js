const SVG_NS = 'http://www.w3.org/2000/svg';
const staggerMs = 85;
let mobileFilterIndex = 0;

function ensureMobileFilter(svg) {
  const existing = svg.querySelector('[data-interaction-mobile-filter]');
  if (existing) return existing.id;

  const id = `interaction-mobile-filter-${mobileFilterIndex += 1}`;
  const defs = svg.querySelector('defs') ?? svg.insertBefore(document.createElementNS(SVG_NS, 'defs'), svg.firstChild);
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.id = id;
  filter.dataset.interactionMobileFilter = '';
  filter.setAttribute('x', '-30%');
  filter.setAttribute('y', '-30%');
  filter.setAttribute('width', '160%');
  filter.setAttribute('height', '160%');
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  filter.innerHTML = '<feComponentTransfer in="SourceGraphic" result="bright"><feFuncR type="linear" slope="1.28"/><feFuncG type="linear" slope="1.28"/><feFuncB type="linear" slope="1.28"/><feFuncA type="identity"/></feComponentTransfer><feColorMatrix in="bright" type="saturate" values="0.78"/>';
  defs.append(filter);
  return id;
}

function createMobileVisual(target, wrapper) {
  const svg = target.ownerSVGElement;
  if (!svg || !target.id) return;
  const visual = document.createElementNS(SVG_NS, 'use');
  visual.classList.add('interaction-highlight-mobile-visual');
  visual.setAttribute('href', `#${target.id}`);
  visual.setAttribute('filter', `url(#${ensureMobileFilter(svg)})`);
  visual.setAttribute('aria-hidden', 'true');
  visual.setAttribute('pointer-events', 'none');
  wrapper.append(visual);
}

function wrapHighlightTarget(target, index, boxIndex = null, sceneKey = null) {
  if (!target?.parentNode || target.closest('[data-interaction-highlight]')) return null;
  const wrapper = document.createElementNS(SVG_NS, 'g');
  wrapper.classList.add('interaction-highlight');
  if (boxIndex !== null) wrapper.classList.add('interaction-highlight--box');
  if (boxIndex !== null) wrapper.dataset.boxIndex = String(boxIndex);
  if (sceneKey) wrapper.dataset.interactionScene = sceneKey;
  if (target.dataset.svgId) wrapper.dataset.interactionTargetId = target.dataset.svgId;
  wrapper.dataset.interactionHighlight = '';
  wrapper.style.setProperty('--interaction-delay', `${index * staggerMs}ms`);
  target.before(wrapper);
  wrapper.append(target);
  createMobileVisual(target, wrapper);
  return wrapper;
}

export function initializeInteractionHighlights({ sceneDefinitions, scenes, draggableElements = [] }) {
  const candidatesByScene = new Map();
  for (const definition of sceneDefinitions) {
    const scene = scenes[definition.key];
    if (!scene) continue;
    const targets = new Set(definition.actions
      .map((action) => scene.querySelector(`.qwen-svg [data-svg-id="${action.targetId}"]`))
      .filter(Boolean));
    for (const target of targets) {
      if ([...targets].some((other) => other !== target && other.contains(target))) continue;
      const candidates = candidatesByScene.get(definition.key) ?? [];
      candidates.push(target);
      candidatesByScene.set(definition.key, candidates);
    }
  }
  const highlights = [];
  for (const [sceneKey, candidates] of candidatesByScene) {
    highlights.push(...candidates
      .map((target, index) => wrapHighlightTarget(target, index, null, sceneKey))
      .filter(Boolean));
  }
  const draggableByScene = new Map();
  for (const target of draggableElements.filter(Boolean)) {
    const sceneKey = target.closest('[data-scene]')?.dataset.scene;
    if (!sceneKey) continue;
    const sceneDraggables = draggableByScene.get(sceneKey) ?? [];
    sceneDraggables.push(target);
    draggableByScene.set(sceneKey, sceneDraggables);
  }
  for (const [sceneKey, targets] of draggableByScene) {
    const candidateCount = candidatesByScene.get(sceneKey)?.length ?? 0;
    highlights.push(...targets
      .map((target, boxIndex) => wrapHighlightTarget(target, candidateCount + boxIndex, boxIndex, sceneKey))
      .filter(Boolean));
  }
  let timer = 0;
  let pointerStart = null;
  const boxCycleByScene = new Map();

  function isVisibleAndInteractive(node, scene) {
    if (!scene.classList.contains('is-active') || scene.closest('[inert]')) return false;
    const nodeStyle = getComputedStyle(node);
    const nodeRect = node.getBoundingClientRect();
    if (nodeStyle.display === 'none' || nodeStyle.visibility === 'hidden' || Number(nodeStyle.opacity) === 0
      || nodeRect.width === 0 || nodeRect.height === 0) return false;

    const targetId = node.dataset.interactionTargetId;
    if (!targetId) return true;
    const control = [...scene.querySelectorAll('[data-hit-target]')]
      .find((candidate) => candidate.dataset.hitTarget === targetId);
    if (!control || control.disabled || control.dataset.hitReady !== 'true') return false;
    const controlStyle = getComputedStyle(control);
    return controlStyle.display !== 'none'
      && controlStyle.visibility !== 'hidden'
      && Number(controlStyle.opacity) !== 0
      && controlStyle.pointerEvents !== 'none';
  }

  function flashScene(sceneKey) {
    const scene = scenes[sceneKey];
    if (!scene?.classList.contains('is-active') || scene.closest('[inert]')) return;
    const sceneHighlights = highlights
      .filter((node) => node.dataset.interactionScene === sceneKey)
      .filter((node) => isVisibleAndInteractive(node, scene));
    const cycle = boxCycleByScene.get(sceneKey) ?? 0;
    boxCycleByScene.set(sceneKey, (cycle + 1) % 3);
    highlights.forEach((node) => node.classList.remove('is-flashing'));
    void scene.getBoundingClientRect();
    const flashingHighlights = sceneHighlights.filter((node) => !node.classList.contains('interaction-highlight--box')
      || Number(node.dataset.boxIndex ?? 0) % 3 === cycle);
    flashingHighlights.forEach((node, index) => {
      node.style.setProperty('--interaction-delay', `${index * staggerMs}ms`);
      node.classList.add('is-flashing');
    });
    window.clearTimeout(timer);
    timer = window.setTimeout(() => highlights.forEach((node) => node.classList.remove('is-flashing')), 6000 + flashingHighlights.length * staggerMs);
  }

  const stage = Object.values(scenes)[0]?.parentElement;
  const onPointerDown = (event) => { pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY }; };
  const onPointerUp = (event) => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    pointerStart = null;
    if (moved > 10 || event.target.closest?.('[data-action], button, a, input, textarea, select, [contenteditable], [data-draggable-box], [role="button"]')) return;
    const active = event.target.closest?.('.scene.is-active');
    if (active?.dataset.scene) flashScene(active.dataset.scene);
  };
  stage?.addEventListener('pointerdown', onPointerDown, { passive: true });
  stage?.addEventListener('pointerup', onPointerUp);

  return {
    highlights,
    flashScene,
    destroy() {
      window.clearTimeout(timer);
      stage?.removeEventListener('pointerdown', onPointerDown);
      stage?.removeEventListener('pointerup', onPointerUp);
    },
  };
}
