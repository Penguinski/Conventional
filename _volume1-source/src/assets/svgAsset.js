import { apartmentWindows, getApartmentState } from '../state/timeOfDay.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const svgMarkupCache = new Map();
const observedHitAreaRoots = new WeakSet();

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function namespaceToken(value) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

const svgContracts = {
  facade: {
    root: 'scene-facade',
    ids: {
      building: ['building', 'Building', 'building-group'],
      'entrance-door': ['entrance-door', 'entrance_door', 'door'],
      intercom: ['intercom', 'intercom-bell', 'citofono', 'campanello'],
    },
  },
  lobby: {
    root: 'scene-lobby',
    ids: {
      'entrance-door': ['entrance-door', 'entrance_door', 'door'],
      'entrance-leaves': ['entrance-leaves', 'entrance_leaves', 'door-leaves'],
      mailboxes: ['mailboxes', 'mail-boxes', 'mail_boxes', 'cassette-postali'],
      'bulletin-board': ['bulletin-board', 'bulletin_board', 'notice-board', 'bacheca'],
      elevator: ['elevator', 'lift', 'ascensore'],
      'elevator-call-button': ['elevator-call-button', 'elevator_call_button', 'call-button'],
      'elevator-left-door': ['elevator-left-door', 'elevator_left_door', 'left-elevator-door'],
      'elevator-right-door': ['elevator-right-door', 'elevator_right_door', 'right-elevator-door'],
    },
  },
  elevator: {
    root: 'scene-elevator',
    ids: {
      'elevator-doors': ['elevator-doors', 'elevator_doors', 'doors'],
      'elevator-left-door': ['elevator-left-door', 'elevator_left_door', 'left-elevator-door'],
      'elevator-right-door': ['elevator-right-door', 'elevator_right_door', 'right-elevator-door'],
      'floor-indicator': ['floor-indicator', 'floor_indicator', 'elevator-floor-indicator'],
      mirror: ['mirror', 'elevator-mirror'],
      'button-panel': ['button-panel', 'button_panel', 'elevator-button-panel'],
    },
  },
};

const residentByAssetId = {
  player: 'Nuovo inquilino',
  maria: 'Maria',
  paolo: 'Paolo',
  rossi: 'Famiglia Rossi',
  arturo: 'Arturo',
  jannel: 'Jannel',
};

function fallbackImage(container, source) {
  const image = document.createElement('img');
  image.src = source;
  image.alt = '';
  image.className = 'qwen-svg-fallback';
  image.draggable = false;
  container.replaceChildren(image);
}

function idToken(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeSvgStructure(svg, contract, rootKey) {
  if (!contract && !rootKey) return;

  // Illustrator often replaces a semantic root with "Livello_1". The root ID
  // is restored here so scene code never depends on an export-layer name.
  const rootName = contract?.root ?? `scene-${rootKey}`;
  svg.id = rootName;
  svg.setAttribute('data-name', rootName);

  const nodes = [...svg.querySelectorAll('[id]')];
  for (const [canonical, aliases] of Object.entries(contract?.ids ?? {})) {
    if (nodes.some((node) => node.id === canonical)) continue;
    const tokens = new Set([canonical, ...aliases].map(idToken));
    const match = nodes.find((node) => tokens.has(idToken(node.id)));
    if (match) match.id = canonical;
  }
}

function groupLobbyEntranceLeaves(svg) {
  const leaves = svg.querySelector('[id="entrance-leaves"]');
  if (!leaves || leaves.querySelector('[id="entrance-left-leaf"]')) return;

  const doorPanels = [...leaves.children].filter((node) => node.localName === 'rect');
  const insetGroup = [...leaves.children].find((node) => node.localName === 'g');
  const insets = [...(insetGroup?.children ?? [])].filter((node) => node.localName === 'rect');
  const pushbars = [...leaves.children].filter((node) => node.localName === 'path');
  if (doorPanels.length !== 2 || insets.length !== 4 || pushbars.length !== 2) return;

  const left = svg.ownerDocument.createElementNS(SVG_NS, 'g');
  left.id = 'entrance-left-leaf';
  left.append(doorPanels[0], insets[0], insets[1], pushbars[0]);

  const right = svg.ownerDocument.createElementNS(SVG_NS, 'g');
  right.id = 'entrance-right-leaf';
  right.append(doorPanels[1], insets[2], insets[3], pushbars[1]);

  leaves.replaceChildren(left, right);
}

function cleanupIllustratorExport(svg, rootKey) {
  if (rootKey === 'lobby') groupLobbyEntranceLeaves(svg);
  if (rootKey !== 'lobby' && rootKey !== 'elevator') return;

  // Illustrator exported a full-width checkerboard and then repeated the same
  // floor as three overlapping pattern groups. Keep the expanded full-bleed
  // layer and remove only those duplicates.
  for (const id of ['floor', 'floor-2', 'floor-3']) {
    svg.querySelector(`[id="${id}"]`)?.remove();
  }
}

function namespaceSvgStructure(svg, namespace) {
  const prefix = `cv-${namespaceToken(namespace)}`;
  const elements = [svg, ...svg.querySelectorAll('*')];
  const idMap = new Map();

  for (const node of elements) {
    if (!node.id) continue;
    const originalId = node.id;
    const namespacedId = `${prefix}--${namespaceToken(originalId)}`;
    idMap.set(originalId, namespacedId);
    node.setAttribute('data-svg-id', originalId);
    node.id = namespacedId;
  }

  const classTokens = new Set();
  for (const node of elements) {
    node.getAttribute('class')?.split(/\s+/).filter(Boolean).forEach((token) => classTokens.add(token));
  }
  for (const style of svg.querySelectorAll('style')) {
    for (const match of (style.textContent ?? '').matchAll(/\.([_a-zA-Z][\w-]*)/g)) classTokens.add(match[1]);
  }
  const classMap = new Map([...classTokens].map((token) => [token, `${prefix}--${namespaceToken(token)}`]));

  for (const node of elements) {
    const className = node.getAttribute('class');
    if (className) {
      node.setAttribute('class', className.split(/\s+/).filter(Boolean).map((token) => classMap.get(token) ?? token).join(' '));
    }

    for (const attribute of [...node.attributes]) {
      let value = attribute.value;
      if (attribute.name === 'aria-labelledby' || attribute.name === 'aria-describedby') {
        value = value.split(/\s+/).map((token) => idMap.get(token) ?? token).join(' ');
      } else if ((attribute.localName === 'href' || attribute.name === 'href') && value.startsWith('#')) {
        value = `#${idMap.get(value.slice(1)) ?? value.slice(1)}`;
      } else {
        value = value.replace(/url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/g, (match, quote, id) => {
          const target = idMap.get(id);
          return target ? `url(#${target})` : match;
        });
      }
      if (value !== attribute.value) node.setAttribute(attribute.name, value);
    }
  }

  for (const style of svg.querySelectorAll('style')) {
    let css = style.textContent ?? '';
    for (const [originalId, namespacedId] of idMap) {
      css = css.replace(new RegExp(`#${escapeRegExp(originalId)}(?![\\w-])`, 'g'), `#${namespacedId}`);
    }
    for (const [originalClass, namespacedClass] of classMap) {
      css = css.replace(new RegExp(`\\.${escapeRegExp(originalClass)}(?![\\w-])`, 'g'), `.${namespacedClass}`);
    }
    style.textContent = css;
  }

  svg.setAttribute('data-svg-namespace', prefix);
}

function findSvgPart(svg, semanticId) {
  return svg?.querySelector(`[data-svg-id="${semanticId}"]`);
}

function markTimeSkySurfaces(svg) {
  svg.querySelectorAll('[data-time-sky-surface]').forEach((surface) => {
    surface.classList.add('time-sky-surface');
  });
  for (const windowGroup of svg.querySelectorAll('[data-svg-id$="-window"]')) {
    windowGroup.querySelectorAll('[fill="#A9C1CE"], [fill="#a9c1ce"]').forEach((surface) => {
      surface.classList.add('time-sky-surface');
    });
  }
}

function fetchSvgMarkup(source) {
  if (!svgMarkupCache.has(source)) {
    svgMarkupCache.set(source, fetch(source).then(async (response) => {
      if (!response.ok) throw new Error(`Asset SVG non disponibile: ${source}`);
      return response.text();
    }));
  }
  return svgMarkupCache.get(source);
}

async function mountSvg(container) {
  if (container.dataset.svgReady) return;
  const source = container.dataset.svgSrc;
  try {
    const markup = await fetchSvgMarkup(source);
    const documentSvg = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const svg = documentSvg.documentElement;
    if (svg.nodeName.toLowerCase() !== 'svg' || documentSvg.querySelector('parsererror')) {
      throw new Error(`Asset SVG non valido: ${source}`);
    }
    svg.querySelectorAll('script, foreignObject').forEach((node) => node.remove());
    normalizeSvgStructure(svg, svgContracts[container.dataset.svgRoot], container.dataset.svgRoot);
    cleanupIllustratorExport(svg, container.dataset.svgRoot);
    namespaceSvgStructure(svg, container.dataset.svgNamespace ?? container.dataset.svgRoot);
    markTimeSkySurfaces(svg);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute(
      'preserveAspectRatio',
      container.dataset.svgFit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet',
    );
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('qwen-svg');
    container.replaceChildren(document.importNode(svg, true));
    container.dataset.svgReady = 'true';
  } catch (error) {
    console.error(error);
    fallbackImage(container, source);
    container.dataset.svgReady = 'fallback';
  }
}

export async function hydrateSvgAssets(root = document) {
  await Promise.all([...root.querySelectorAll('[data-svg-src]')].map(mountSvg));
  layoutSceneHitAreas(root);
  observeSceneHitAreas(root);
}

function transformPoint(matrix, x, y) {
  return {
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f,
  };
}

function layoutHitArea(button) {
  if (button.dataset.hitManual === 'true') return;
  const scene = button.closest('[data-scene]');
  const layer = button.closest('[data-hit-layer]');
  const targetId = button.dataset.hitAnchor ?? button.dataset.hitTarget;
  const svg = [...(scene?.querySelectorAll('.qwen-svg') ?? [])]
    .find((candidate) => findSvgPart(candidate, targetId));
  const target = findSvgPart(svg, targetId);
  if (!layer || !target || typeof target.getBBox !== 'function') {
    button.dataset.hitReady = 'missing';
    return;
  }

  try {
    const box = target.getBBox();
    const matrix = target.getScreenCTM();
    const layerRect = layer.getBoundingClientRect();
    if (!matrix || !box.width || !box.height || !layerRect.width || !layerRect.height) {
      button.dataset.hitReady = 'pending';
      return;
    }

    const points = [
      transformPoint(matrix, box.x, box.y),
      transformPoint(matrix, box.x + box.width, box.y),
      transformPoint(matrix, box.x, box.y + box.height),
      transformPoint(matrix, box.x + box.width, box.y + box.height),
    ];
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches === true;
    const padding = Number(coarsePointer && button.dataset.hitTouchPadding !== undefined
      ? button.dataset.hitTouchPadding
      : button.dataset.hitPadding || 0);
    const minSize = Number(coarsePointer && button.dataset.hitTouchMinSize
      ? button.dataset.hitTouchMinSize
      : button.dataset.hitMinSize || 44);
    const minX = Math.min(...points.map((point) => point.x)) - layerRect.left;
    const maxX = Math.max(...points.map((point) => point.x)) - layerRect.left;
    const minY = Math.min(...points.map((point) => point.y)) - layerRect.top;
    const maxY = Math.max(...points.map((point) => point.y)) - layerRect.top;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = Math.min(layerRect.width, Math.max(maxX - minX + padding * 2, minSize));
    const height = Math.min(layerRect.height, Math.max(maxY - minY + padding * 2, minSize));
    const left = Math.max(0, Math.min(layerRect.width - width, centerX - width / 2));
    const top = Math.max(0, Math.min(layerRect.height - height, centerY - height / 2));

    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
    button.style.width = `${width}px`;
    button.style.height = `${height}px`;
    button.dataset.hitReady = 'true';
  } catch {
    button.dataset.hitReady = 'pending';
  }
}

export function layoutSceneHitAreas(root = document) {
  root.querySelectorAll('[data-hit-target]').forEach(layoutHitArea);
}

function observeSceneHitAreas(root) {
  if (observedHitAreaRoots.has(root)) return;
  observedHitAreaRoots.add(root);
  let scheduled = false;
  const layout = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      layoutSceneHitAreas(root);
    });
  };
  window.addEventListener('resize', layout, { passive: true });
  root.addEventListener('transitionend', layout);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(layout);
    observer.observe(root);
  }
}

export function setElevatorFloorIndicator(scene, floor) {
  if (!scene) return;
  scene.dataset.elevatorFloor = floor;
  const svg = scene.querySelector('.qwen-svg');
  const indicatorText = findSvgPart(svg, 'floor-indicator')?.querySelector('text');
  if (indicatorText) indicatorText.textContent = floor;
  svg?.querySelectorAll('[data-svg-id^="button-"]').forEach((button) => button.classList.remove('is-selected'));
  findSvgPart(svg, `button-${String(floor).toLowerCase()}`)?.classList.add('is-selected');
}

function rebuildShutter(group) {
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', '16');
  rect.setAttribute('y', '16');
  rect.setAttribute('width', '168');
  rect.setAttribute('height', '138');
  rect.setAttribute('fill', '#6E8B78');
  rect.setAttribute('stroke-width', '4');

  const slats = document.createElementNS(SVG_NS, 'path');
  slats.setAttribute('d', 'M16 28H184 M16 40H184 M16 52H184 M16 64H184 M16 76H184 M16 88H184 M16 100H184 M16 112H184 M16 124H184 M16 136H184 M16 148H184');
  slats.setAttribute('fill', 'none');
  slats.setAttribute('stroke-width', '3');

  group.replaceChildren(rect, slats);
  group.classList.add('time-shutter');
}

export function applyExteriorTime(scene, period) {
  const svg = scene.querySelector('.qwen-art--facade .qwen-svg');
  if (!svg) return;

  for (const [assetId, resident] of Object.entries(residentByAssetId)) {
    const apartment = apartmentWindows.find((item) => item.resident === resident);
    if (!apartment) continue;
    const state = getApartmentState(apartment, period);
    const windowGroup = findSvgPart(svg, `window-${assetId}`);
    const light = findSvgPart(svg, `window-${assetId}-light`);
    const shutter = findSvgPart(svg, `window-${assetId}-shutter`);
    const curtain = findSvgPart(svg, `window-${assetId}-curtain`);
    const insideProps = findSvgPart(svg, `window-${assetId}-props-inside`);
    const sillProps = findSvgPart(svg, `window-${assetId}-props-sill`);

    windowGroup?.classList.toggle('is-window-open', state.open);
    if (light) light.style.opacity = state.light ? '0.94' : '0';
    if (shutter) {
      rebuildShutter(shutter);
      shutter.style.setProperty('--shutter-level', String(Math.max(0, state.shutter) / 100));
      shutter.style.opacity = state.shutter <= 0 ? '0' : '1';
    }
    if (curtain) {
      curtain.dataset.curtain = state.curtain;
      curtain.style.opacity = state.curtain === 'open' ? '0.52' : state.curtain === 'half' ? '0.8' : '1';
    }
    const showProps = state.detail !== 'none';
    if (insideProps) insideProps.style.opacity = showProps ? '1' : '0';
    if (sillProps) sillProps.style.opacity = showProps ? '1' : '0';
  }
}
