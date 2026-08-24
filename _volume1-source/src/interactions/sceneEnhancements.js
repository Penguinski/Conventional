import { artworks } from '../content/artworks.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const paintingLayout = {
  'home-player': { x: 1080, y: 105, w: 225, h: 180, color: '#8eaa9e' },
  'home-maria': { x: 1330, y: 102, w: 105, h: 210, color: '#b87868' },
  'home-paolo': { x: 460, y: 250, w: 260, h: 180, color: '#bca877' },
  'home-rossi': { x: 1045, y: 86, w: 145, h: 225, color: '#d2a455' },
  'home-jannel': { x: 1450, y: 78, w: 145, h: 235, color: '#8b7775' },
};

function svgNode(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}
function identify(node, id) { node.id = id; node.dataset.svgId = id; return node; }

function addPaintingPlaceholder(scene, artworkId, config) {
  const svg = scene?.querySelector('.qwen-svg');
  if (!svg || svg.querySelector(`[data-svg-id="${artworkId}"]`)) return;
  const group = identify(svgNode('g', { role: 'img', 'aria-label': 'Quadro illustrato' }), artworkId);
  const pad = 12;
  group.append(svgNode('rect', { x: config.x - pad + 7, y: config.y - pad + 8, width: config.w + pad * 2, height: config.h + pad * 2, rx: 3, fill: '#2a211c', opacity: '.16' }));
  group.append(svgNode('rect', { x: config.x - pad, y: config.y - pad, width: config.w + pad * 2, height: config.h + pad * 2, rx: 3, fill: '#eee3ce', stroke: '#2a211c', 'stroke-width': 6 }));
  group.append(svgNode('rect', { x: config.x, y: config.y, width: config.w, height: config.h, fill: config.color }));
  group.append(svgNode('path', { d: `M${config.x + config.w * .08} ${config.y + config.h * .74} Q${config.x + config.w * .35} ${config.y + config.h * .28} ${config.x + config.w * .56} ${config.y + config.h * .62} T${config.x + config.w * .92} ${config.y + config.h * .34}`, fill: 'none', stroke: '#f0dfbd', 'stroke-width': Math.max(8, config.w * .07), 'stroke-linecap': 'round', opacity: '.9' }));
  group.append(svgNode('circle', { cx: config.x + config.w * .28, cy: config.y + config.h * .33, r: Math.min(config.w, config.h) * .11, fill: '#d86e55', stroke: '#2a211c', 'stroke-width': 3 }));
  svg.append(group);
}

function addMailboxScribbles(scene) {
  const svg = scene?.querySelector('.qwen-svg');
  ['mailbox-player', 'mailbox-maria', 'mailbox-paolo', 'mailbox-rossi', 'mailbox-arturo', 'mailbox-jannel'].forEach((id, index) => {
    const box = svg?.querySelector(`[data-svg-id="${id}"]`);
    if (!box || box.querySelector('[data-mailbox-scribble]')) return;
    const bounds = box.getBBox();
    const group = svgNode('g', { 'data-mailbox-scribble': '', 'aria-hidden': 'true' });
    group.append(svgNode('rect', { x: bounds.x + bounds.width * .14, y: bounds.y + bounds.height * .08, width: bounds.width * .72, height: Math.max(9, bounds.height * .15), rx: 1.5, fill: '#eee4d3', stroke: '#2a211c', 'stroke-width': 1.2 }));
    const x = bounds.x + bounds.width * .21;
    const y = bounds.y + bounds.height * .16;
    const w = bounds.width * .58;
    group.append(svgNode('path', { d: `M${x} ${y} q${w * .1} ${index % 2 ? -4 : 3} ${w * .2} 0 t${w * .2} 0 t${w * .2} 0 t${w * .2} 0`, fill: 'none', stroke: '#51473f', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: '.75' }));
    box.append(group);
  });
}

function addElevatorPlaque(scene) {
  const notice = scene?.querySelector('.qwen-svg [data-svg-id="notice-frame"]');
  if (!notice || notice.hasAttribute('data-elevator-capacity')) return;
  const x = 1850;
  const y = 245;
  const width = 250;
  const height = 250;
  notice.removeAttribute('transform');
  notice.setAttribute('data-elevator-capacity', 'true');
  notice.replaceChildren();
  notice.append(
    svgNode('rect', { x: x + 8, y: y + 10, width, height, rx: 8, fill: '#2a211c', stroke: 'none', opacity: '.14' }),
    svgNode('rect', { x, y, width, height, rx: 8, fill: '#eee3ce', stroke: '#2a211c', 'stroke-width': 5 }),
    svgNode('circle', { cx: x + 18, cy: y + 18, r: 4, fill: '#d9a654', stroke: '#2a211c', 'stroke-width': 2 }),
    svgNode('circle', { cx: x + width - 18, cy: y + 18, r: 4, fill: '#d9a654', stroke: '#2a211c', 'stroke-width': 2 }),
    svgNode('circle', { cx: x + 18, cy: y + height - 18, r: 4, fill: '#d9a654', stroke: '#2a211c', 'stroke-width': 2 }),
    svgNode('circle', { cx: x + width - 18, cy: y + height - 18, r: 4, fill: '#d9a654', stroke: '#2a211c', 'stroke-width': 2 }),
  );

  const addText = (text, textY, attributes = {}) => {
    const node = svgNode('text', {
      x: x + width / 2,
      y: textY,
      'text-anchor': 'middle',
      fill: '#2a211c',
      'font-family': 'Arial, sans-serif',
      'font-weight': '700',
      ...attributes,
    });
    node.textContent = text;
    notice.append(node);
  };

  addText('CAPACITÀ', y + 58, { 'font-size': 22, 'letter-spacing': 2 });
  addText('MASSIMA', y + 88, { 'font-size': 22, 'letter-spacing': 2 });
  addText('6', y + 148, { 'font-family': 'Georgia, serif', 'font-size': 58 });
  addText('PERSONE', y + 181, { 'font-size': 20, 'letter-spacing': 2 });
  addText('E TU,', y + 214, { 'font-size': 17, 'letter-spacing': 1 });
  addText('DOVE TI METTI?', y + 238, { 'font-size': 17, 'letter-spacing': 1 });
}

function addArturoNotes(scene) {
  const svg = scene?.querySelector('.qwen-svg');
  if (!svg) return;
  const make = (id, x, y, title, fill, angle) => {
    if (svg.querySelector(`[data-svg-id="${id}"]`)) return;
    const group = identify(svgNode('g'), id);
    group.setAttribute('transform', `translate(${x} ${y}) rotate(${angle})`);
    group.append(svgNode('path', { d: 'M0 0H112V72H0Z', fill, stroke: '#2a211c', 'stroke-width': 4 }));
    const text = svgNode('text', { x: 56, y: 31, 'text-anchor': 'middle', fill: '#2a211c', 'font-family': 'Georgia, serif', 'font-size': 11, 'font-weight': '700' });
    text.textContent = title;
    group.append(text, svgNode('path', { d: 'M21 46H91M29 57H83', fill: 'none', stroke: '#2a211c', 'stroke-width': 2, opacity: '.5' }));
    svg.append(group);
  };
  make('arturo-story-note', 1690, 530, 'TURNO DI NOTTE', '#e9c778', -3);
  make('arturo-avoid-note', 1570, 555, 'PRIMA DI USCIRE', '#f4e7d3', 2);
}

export function initializeSceneEnhancements(scenes) {
  addMailboxScribbles(scenes.lobby);
  addElevatorPlaque(scenes.elevator);
  addArturoNotes(scenes['home-arturo']);
  Object.entries(artworks).forEach(([id, artwork]) => addPaintingPlaceholder(scenes[artwork.scene], id, paintingLayout[artwork.scene]));
}
