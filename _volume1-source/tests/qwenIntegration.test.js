import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { destinationLabels, sceneDefinitions, scenesByKey } from '../src/scenes/sceneConfig.js';
import { renderIllustratedScene } from '../src/scenes/illustratedScene.js';
import { complaintDocuments } from '../src/content/complaintDossier.js';
import { clampDragDelta } from '../src/interactions/draggableSvgObjects.js';
import { renderEditorialFolder } from '../src/overlays/editorialFolder.js';
import { applyStickerPack, drawStickerPack, rossiStickerCards } from '../src/content/rossiStickerCards.js';

const assets = {
  exterior: new URL('../public/assets/qwen/facciata-condominio.svg', import.meta.url),
  lobby: new URL('../public/assets/qwen/androne-condominio.svg', import.meta.url),
  elevator: new URL('../public/assets/qwen/ascensore-interno.svg', import.meta.url),
  'landing-1': new URL('../public/assets/qwen/pianerottolo-1.svg', import.meta.url),
  'home-player': new URL('../public/assets/qwen/casa-tua.svg', import.meta.url),
  'home-maria': new URL('../public/assets/qwen/casa-maria2.svg', import.meta.url),
  'landing-2': new URL('../public/assets/qwen/pianerottolo-2.svg', import.meta.url),
  'home-paolo': new URL('../public/assets/qwen/casa-paolo.svg', import.meta.url),
  'home-rossi': new URL('../public/assets/qwen/casa-rossi2.svg', import.meta.url),
  'landing-3': new URL('../public/assets/qwen/pianerottolo-3.svg', import.meta.url),
  'home-arturo': new URL('../public/assets/qwen/casa-arturo2.svg', import.meta.url),
  'home-jannel': new URL('../public/assets/qwen/casa-jannel2.svg', import.meta.url),
  basement: new URL('../public/assets/qwen/cantina2.svg', import.meta.url),
};
const exteriorBackground = new URL('../public/assets/exterior/sfondo.svg', import.meta.url);

const requiredIds = {
  exterior: ['entrance-door', 'intercom', 'window-arturo-shutter'],
  lobby: ['entrance-door', 'mailboxes', 'bulletin-board', 'elevator'],
  elevator: ['floor-indicator', 'elevator-doors', 'button-c', 'button-0', 'button-1', 'button-2', 'button-3', 'button-alarm'],
  'landing-1': ['player-door', 'maria-door', 'elevator'],
  'home-player': ['player-entry-door', 'complaint-file', 'box-2', 'box-4', 'box-6', 'box-8'],
  'home-maria': ['maria-entry-door', 'maria-window', 'maria-binoculars', 'maria-fridge', 'junk-drawer', 'recipe-book'],
  'landing-2': ['paolo-door', 'rossi-door', 'elevator'],
  'home-paolo': ['paolo-entry-door'],
  'home-rossi': ['rossi-entry-door', 'rossi-window', 'rossi-wall-drawing-layer', 'wall-marker', 'rossi-bunk-beds', 'rossi-upper-bunk', 'rossi-lower-bunk', 'sticker-album'],
  'landing-3': ['arturo-door', 'jannel-door', 'elevator'],
  'home-arturo': ['arturo-entry-door', 'arturo-window'],
  'home-jannel': ['jannel-entry-door', 'jannel-window'],
  basement: ['basement-exit', 'high-window'],
};

function getAction(scene, targetId) {
  return scenesByKey[scene].actions.find((action) => action.targetId === targetId);
}

test('all production SVGs remain logic-free and expose their semantic navigation IDs', async () => {
  assert.equal(Object.keys(assets).length, 13);
  for (const [key, url] of Object.entries(assets)) {
    const markup = await readFile(url, 'utf8');
    assert.doesNotMatch(markup, /<script\b/i);
    assert.doesNotMatch(markup, /on(?:click|pointer|mouse|touch)\s*=/i);
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${key} contiene ID SVG duplicati`);
    for (const id of requiredIds[key]) assert.match(markup, new RegExp(`id="${id}"`));
  }
});

test('scene configuration covers the whole condominium with one asset per scene', () => {
  assert.equal(sceneDefinitions.length, 13);
  for (const scene of sceneDefinitions) {
    assert.ok(assets[scene.key], `${scene.key} non ha un asset inventariato`);
    assert.match(scene.asset, /\/assets\/qwen\/.+\.svg$/);
    assert.ok(scene.actions.length > 0, `${scene.key} non ha una via di navigazione`);
  }
  assert.equal(scenesByKey.exterior.fit, 'contain');
  assert.match(scenesByKey.exterior.backgroundAsset, /\/assets\/exterior\/sfondo\.svg$/);
  for (const scene of sceneDefinitions.filter((scene) => scene.key !== 'exterior')) {
    assert.equal(scene.fit, 'cover', `${scene.key} deve usare il framing fullscreen centralizzato`);
  }
});

test('the exterior background stays separate from the existing facade and exposes time-aware layers', async () => {
  const markup = await readFile(exteriorBackground, 'utf8');
  assert.match(markup, /id="background-sky"/);
  assert.match(markup, /id="background-orb"/);
  assert.match(markup, /id="background-clouds"/);
  assert.match(markup, /id="background-windows"/);
  assert.ok(markup.indexOf('id="background-orb"') < markup.indexOf('id="background-side-buildings"'), 'il corpo celeste deve essere dipinto dietro agli edifici');
  assert.doesNotMatch(markup, /id="(?:facade|entrance-door|intercom)"/);
  assert.doesNotMatch(markup, /<script\b/i);
});

test('the configured journey reaches every floor, apartment and basement', () => {
  assert.equal(getAction('exterior', 'entrance-door').destination, 'lobby');
  assert.equal(getAction('lobby', 'elevator').type, 'elevator');

  assert.deepEqual(destinationLabels, {
    basement: 'C',
    lobby: '0',
    'landing-1': '1',
    'landing-2': '2',
    'landing-3': '3',
  });

  assert.equal(getAction('landing-1', 'player-door').destination, 'home-player');
  assert.equal(getAction('landing-1', 'maria-door').destination, 'home-maria');
  assert.equal(getAction('landing-2', 'paolo-door').destination, 'home-paolo');
  assert.equal(getAction('landing-2', 'rossi-door').destination, 'home-rossi');
  assert.equal(getAction('landing-3', 'arturo-door').destination, 'home-arturo');
  assert.equal(getAction('landing-3', 'jannel-door').destination, 'home-jannel');
  assert.equal(getAction('home-player', 'player-entry-door').destination, 'landing-1');
  assert.equal(getAction('home-maria', 'maria-entry-door').destination, 'landing-1');
  assert.equal(getAction('home-paolo', 'paolo-entry-door').destination, 'landing-2');
  assert.equal(getAction('home-rossi', 'rossi-entry-door').destination, 'landing-2');
  assert.equal(getAction('home-arturo', 'arturo-entry-door').destination, 'landing-3');
  assert.equal(getAction('home-jannel', 'jannel-entry-door').destination, 'landing-3');
  assert.equal(getAction('basement', 'basement-exit').type, 'elevator');
});

test('the generic scene renderer keeps actions in HTML and assets in separate SVG files', () => {
  const markup = renderIllustratedScene(scenesByKey['landing-1']);
  assert.match(markup, /data-svg-fit="cover"/);
  assert.match(markup, /data-hit-target="player-door"/);
  assert.match(markup, /data-hit-target="maria-door"/);
  assert.match(markup, /data-hit-target="elevator"/);
  assert.doesNotMatch(markup, /<svg\b/i);
});

test('time and touch adaptations reuse shared state and semantic SVG geometry', async () => {
  const renderer = renderIllustratedScene(scenesByKey.exterior, { period: 'night' });
  const adapter = await readFile(new URL('../src/assets/svgAsset.js', import.meta.url), 'utf8');
  const controller = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles/main.css', import.meta.url), 'utf8');
  assert.match(renderer, /qwen-art--exterior-background/);
  assert.match(adapter, /markTimeSkySurfaces/);
  assert.match(adapter, /querySelectorAll\('\[data-time-sky-surface\]'\)/);
  assert.match(adapter, /pointer: coarse/);
  assert.match(styles, /\.experience\[data-period='night'\]/);
  assert.match(styles, /\.time-sky-surface/);
  assert.match(styles, /\.scene--elevator\.is-panel-focused \.qwen-art \{ transform: translate\(var\(--panel-shift-x\), var\(--panel-shift-y\)\) scale\(var\(--panel-scale\)\)/);
  assert.match(styles, /\.scene--elevator\.is-panel-focused\.is-panel-ready \.qwen-svg \[data-svg-id\^='button-'\]/);
  assert.match(controller, /function focusElevatorPanel\(\)/);
  assert.match(controller, /function closeElevatorPanel\(onComplete\)/);
  assert.match(controller, /function focusedElevatorSvgId\(event\)/);
  assert.match(controller, /event\.composedPath\(\)/);
  assert.doesNotMatch(controller, /layoutElevatorTouchTargets|focusedSvgRect/);
  assert.match(controller, /closeElevatorPanel\(startTravel\)/);
  assert.equal(getAction('elevator', 'button-panel').type, 'focus-elevator-panel');
  assert.equal(getAction('elevator', 'button-c').touchMinSize, 46);
  assert.equal(getAction('elevator', 'button-alarm').type, 'feedback');
});

test('the five replacement rooms retain semantic targets and dynamic interior skies', async () => {
  assert.match(scenesByKey['home-maria'].asset, /casa-maria2\.svg$/);
  assert.match(scenesByKey['home-rossi'].asset, /casa-rossi2\.svg$/);
  assert.match(scenesByKey['home-arturo'].asset, /casa-arturo2\.svg$/);
  assert.match(scenesByKey['home-jannel'].asset, /casa-jannel2\.svg$/);
  assert.match(scenesByKey.basement.asset, /cantina2\.svg$/);

  for (const key of ['home-maria', 'home-rossi', 'home-jannel']) {
    const markup = await readFile(assets[key], 'utf8');
    assert.match(markup, /data-time-sky-surface="true"/);
  }
});

test('the SVG adapter caches sources, computes hit areas from SVG geometry and restores semantic roots', async () => {
  const adapter = await readFile(new URL('../src/assets/svgAsset.js', import.meta.url), 'utf8');
  assert.match(adapter, /const svgMarkupCache = new Map\(\)/);
  assert.match(adapter, /function layoutHitArea\(button\)/);
  assert.match(adapter, /querySelectorAll\('\.qwen-svg'\)/);
  assert.match(adapter, /find\(\(candidate\) => findSvgPart\(candidate, targetId\)\)/);
  assert.match(adapter, /target\.getBBox\(\)/);
  assert.match(adapter, /target\.getScreenCTM\(\)/);
  assert.match(adapter, /root: 'scene-facade'/);
  assert.match(adapter, /root: 'scene-lobby'/);
  assert.match(adapter, /root: 'scene-elevator'/);
  assert.match(adapter, /xMidYMid slice/);
  assert.match(adapter, /function namespaceSvgStructure/);
  assert.match(adapter, /data-svg-id/);
  assert.match(adapter, /cleanupIllustratorExport/);
  assert.match(adapter, /groupLobbyEntranceLeaves/);
});

test('inline SVG integration namespaces styles and animates semantic door leaves', async () => {
  const renderer = await readFile(new URL('../src/scenes/illustratedScene.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles/main.css', import.meta.url), 'utf8');
  const facade = await readFile(assets.exterior, 'utf8');

  assert.match(renderer, /data-svg-root="\$\{artKey\}"/);
  assert.match(renderer, /data-svg-namespace="\$\{scene\.key\}"/);
  assert.match(facade, /id="door-left-leaf"/);
  assert.match(facade, /id="door-right-leaf"/);
  assert.match(styles, /\[data-svg-id='elevator-left-door'\]/);
  assert.match(styles, /\[data-svg-id='floor-indicator'\] text/);
  assert.match(styles, /\.qwen-art--exterior-background \{[^}]*z-index: 0;[^}]*pointer-events: none;/);
  assert.match(styles, /\.qwen-art--facade \{ z-index: 2;/);
  assert.match(styles, /\.scene-hit-layer \{ position: absolute; z-index: 8;/);
  assert.doesNotMatch(styles, /\.qwen-svg\s+#[a-z]/i);
});

test('editorial interaction remains scoped to approved apartment objects', () => {
  const allowed = new Set(['scene', 'bell', 'feedback', 'elevator', 'leave-elevator', 'focus-elevator-panel', 'elevator-destination', 'editorial', 'external-link', 'maria-binoculars', 'maria-fridge', 'maria-junk-drawer', 'maria-recipe-book', 'rossi-wall-drawing', 'rossi-bunk-boing', 'rossi-sticker-album', 'elevator-mirror-fact', 'elevator-social-game', 'jannel-tarot', 'paolo-story', 'arturo-story', 'avoid-neighbors', 'pet-cat', 'artwork-lightbox', 'home-article', 'intercom-article']);
  for (const scene of sceneDefinitions) {
    for (const action of scene.actions) assert.ok(allowed.has(action.type), `${scene.key}/${action.targetId} supera lo scope`);
  }
  const editorialActions = sceneDefinitions.flatMap((scene) => scene.actions
    .filter((action) => action.type === 'editorial')
    .map((action) => `${scene.key}/${action.targetId}`));
  assert.deepEqual(editorialActions, ['home-player/complaint-file']);
  const longFormArticleActions = sceneDefinitions.flatMap((scene) => scene.actions
    .filter((action) => action.type === 'home-article' || action.type === 'intercom-article')
    .map((action) => `${scene.key}/${action.targetId}/${action.type}`));
  assert.deepEqual(longFormArticleActions, ['home-player/box-6/home-article', 'home-paolo/intercom/intercom-article']);
});

test('Casa tua dossier uses all six source documents and relies on tab navigation', async () => {
  const source = await readFile(new URL('../Numero 1.md', import.meta.url), 'utf8');
  const normalizedSource = source.replace(/\\([\[\].])/g, '$1');
  assert.equal(complaintDocuments.length, 6);
  for (const document of complaintDocuments) {
    const sourceFragments = [document.heading, ...document.metadata, ...document.paragraphs, document.note].filter(Boolean);
    for (const fragment of sourceFragments) {
      assert.ok(normalizedSource.includes(fragment), `${document.tab} non deriva testualmente da Numero 1.md`);
    }
  }
  const markup = renderEditorialFolder({ title: 'Denunce da cattivo vicino', documents: complaintDocuments });
  assert.match(markup, /role="dialog"/);
  assert.match(markup, /class="dossier-tabs"/);
  assert.doesNotMatch(markup, /data-action="editorial-prev"/);
  assert.doesNotMatch(markup, /data-action="editorial-next"/);
  assert.match(markup, /data-action="editorial-close"/);
});

test('Maria Memory contains every card face and uses the supplied packet asset', async () => {
  const source = await readFile(new URL('../src/overlays/mariaJunkDrawer.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles/mariaJunkDrawer.css', import.meta.url), 'utf8');
  const packet = await readFile(new URL('../src/assets/bustina.svg', import.meta.url), 'utf8');

  assert.match(source, /import packetAssetUrl from '\.\.\/assets\/bustina\.svg';/);
  assert.match(source, /class="memory-packet-art" src="\$\{packetAssetUrl\}"/);
  assert.doesNotMatch(source, /memory-packet-paper|memory-packet-building/);
  assert.match(styles, /\.memory-card__face \{[^}]*overflow: hidden;/);
  assert.match(styles, /\.memory-card__face svg \{[^}]*position: absolute;[^}]*max-width: 100%;[^}]*max-height: 100%;[^}]*overflow: hidden;/);
  assert.match(packet, /<svg[^>]+viewBox="0 0 1457 1994"/);
});

test('box drag clamping keeps a dragged object inside the scene bounds', () => {
  const bounds = { start: 0, end: 1000 };
  const box = { start: 400, end: 600 };
  assert.equal(clampDragDelta(-1000, box, bounds), -390);
  assert.equal(clampDragDelta(1000, box, bounds), 390);
  assert.equal(clampDragDelta(30, box, bounds), 30);
});

test('the Rossi sticker collection is data-driven and keeps duplicate copies out of album slots', () => {
  assert.equal(rossiStickerCards.length, 32);
  assert.equal(new Set(rossiStickerCards.map((card) => card.id)).size, 32);
  assert.deepEqual(new Set(rossiStickerCards.map((card) => card.rarity)), new Set(['common', 'uncommon', 'rare']));
  assert.deepEqual(rossiStickerCards.map((card) => card.slot), Array.from({ length: 32 }, (_, index) => index));
  const repeatedPack = drawStickerPack([rossiStickerCards[0]], () => 0, 5);
  const result = applyStickerPack({}, repeatedPack);
  assert.equal(result.reveals.length, 5);
  assert.equal(result.reveals.filter((reveal) => reveal.isNew).length, 1);
  assert.equal(result.owned[rossiStickerCards[0].id], 5);
  assert.equal(Object.keys(result.owned).length, 1);
});

test('the GitHub Pages build stays isolated under vol1-test without Sites metadata', async () => {
  const packageJson = await readFile(new URL('../package.json', import.meta.url), 'utf8');
  const sceneConfig = await readFile(new URL('../src/scenes/sceneConfig.js', import.meta.url), 'utf8');
  await assert.rejects(readFile(new URL('../.openai/hosting.json', import.meta.url), 'utf8'));
  assert.match(packageJson, /vite build --base=\/vol1-test\//);
  assert.match(sceneConfig, /import\.meta\.env\?\.BASE_URL/);
  assert.match(sceneConfig, /assets\/qwen/);
});
