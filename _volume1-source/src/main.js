import './styles/main.css';
import './styles/androidFullscreenFallback.css';
import './styles/cookieConsent.css';
import { initializeAnalyticsConsent } from './analytics/analyticsConsent.js';
import { bellCopy } from './content/editorial.js';
import { complaintDocuments } from './content/complaintDossier.js';
import { mailboxById } from './content/mailboxes.js';
import { initializeAudio, playBell, playDoorLatch, playEffect } from './audio/sound.js';
import { initializeDraggableSvgObjects } from './interactions/draggableSvgObjects.js';
import { initializeInteractionHighlights } from './interactions/interactionHighlights.js';
import { initializeBrowserGuards } from './interactions/browserGuards.js';
import { initializeAndroidFullscreenFallback } from './interactions/androidFullscreenFallback.js';
import { initializeNativeFullscreen, requestNativeFullscreen } from './interactions/nativeFullscreen.js';
import { initializeFinalMobileEntry } from './interactions/finalMobileEntry.js';
import { shouldUseMobileElevatorFocus } from './interactions/mobileElevatorPlatform.js';
import { auditVisibleHitAlignment, initializeTouchProbe, initializeViewportDebug } from './interactions/viewportExperiments.js';
import { initializeSceneEnhancements } from './interactions/sceneEnhancements.js';
import { createEditorialFolder } from './overlays/editorialFolder.js';
import { createMailboxOverlay } from './overlays/mailboxOverlay.js';
import { createBulletinBoard } from './overlays/bulletinBoard.js';
import { createMariaInteractions } from './overlays/mariaInteractions.js';
import { createRossiInteractions } from './overlays/rossiInteractions.js';
import { createJannelTarot } from './overlays/jannelTarot.js';
import { renderOnboardingNotice, renderWelcomeLetter } from './overlays/welcomeLetter.js';
import { resolveTimePeriod } from './state/timeOfDay.js';
import {
  applyExteriorTime,
  hydrateSvgAssets,
  layoutSceneHitAreas,
  setElevatorFloorIndicator,
} from './assets/svgAsset.js';
import { destinationLabels, floorForScene, sceneDefinitions, scenesByKey } from './scenes/sceneConfig.js';
import { renderIllustratedScene } from './scenes/illustratedScene.js';

const app = document.querySelector('#app');

initializeAnalyticsConsent();
initializeExperience();

function initializeExperience() {
const period = resolveTimePeriod();
const welcomeSeen = sessionStorage.getItem('conventional:welcome-seen') === 'true';
const forceMobileElevatorQa = import.meta.env.DEV && new URLSearchParams(window.location.search).has('qa-touch');
const coarsePointerQuery = window.matchMedia?.('(pointer: coarse)');
document.documentElement.classList.toggle(
  'mobile-elevator-controls',
  forceMobileElevatorQa || coarsePointerQuery?.matches === true,
);
const sceneForFloor = {
  C: 'basement',
  0: 'lobby',
  1: 'landing-1',
  2: 'landing-2',
  3: 'landing-3',
};

let scene = 'exterior';
let currentFloor = '0';
let transitioning = false;
let bellCount = Number(sessionStorage.getItem('conventional:bell-count') || 0);
let previousBellVariant = -1;
let elevatorPanelTimer = 0;
let boxPhysics = null;
let pendingElevatorTravel = null;
let suppressElevatorClickUntil = 0;
let interactionHighlights = null;
let expandedExperiences = null;
let expandedExperiencesPromise = null;

const elevatorPanelTransitionMs = 300;

app.innerHTML = `
  <div class="experience" data-period="${period}">
    <a class="skip-link" href="#scene-focus">Vai alla scena</a>
    <div class="brand-mark" aria-label="Conventional — The Apartment">
      <img src="${import.meta.env.BASE_URL}assets/brand/logo_conventional.svg" alt="Conventional" />
      <span class="brand-mark__subtitle">The Apartment</span>
    </div>
    <div class="scene-stage" id="scene-focus" tabindex="-1" ${welcomeSeen ? '' : 'inert'}>
      ${sceneDefinitions.map((definition) => renderIllustratedScene(definition, { period, active: definition.key === 'exterior' })).join('')}
    </div>
    <div class="transition-iris" aria-hidden="true"></div>
    <div class="rotate-device" role="status">
      <div class="phone-icon" aria-hidden="true"><span></span></div>
      <p><strong>Gira il telefono.</strong><br />Il condominio si visita in orizzontale.</p>
    </div>
  </div>
  <div id="overlay-root" class="overlay-root" aria-live="polite">${welcomeSeen ? '' : renderWelcomeLetter()}</div>`;

const experience = app.querySelector('.experience');
const overlayRoot = app.querySelector('#overlay-root');
initializeBrowserGuards(experience);
initializeAndroidFullscreenFallback({ root: app });
const exterior = app.querySelector('[data-scene="exterior"]');
const elevator = app.querySelector('[data-scene="elevator"]');
const transitionIris = app.querySelector('.transition-iris');
const bellCaption = app.querySelector('[data-bell-caption]');
const sceneStage = app.querySelector('.scene-stage');
const scenes = Object.fromEntries(sceneDefinitions.map((definition) => [definition.key, app.querySelector(`[data-scene="${definition.key}"]`)]));
let mobileEntry = null;
let complaintFolder = null;
let audio = null;
let mailboxOverlay = null;
let bulletinBoard = null;
let mariaInteractions = null;
let rossiInteractions = null;
let jannelTarot = null;
const viewportLifecycle = { refresh() {}, destroy() {} };
let nativeFullscreen = null;
let interactionBootPromise = null;
let viewportDebug = null;
let touchProbe = null;
let interactionListenersBound = false;
let interactionState = 'idle';

function showOnboardingNotice() {
  if (app.querySelector('[data-onboarding-notice]')) return;
  const template = document.createElement('template');
  template.innerHTML = renderOnboardingNotice({
    touch: forceMobileElevatorQa || coarsePointerQuery?.matches === true || navigator.maxTouchPoints > 0,
  });
  const notice = template.content.firstElementChild;
  const closeButton = notice.querySelector('[data-onboarding-close]');
  closeButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    notice.classList.add('is-closing');
    window.setTimeout(() => notice.remove(), 160);
  });
  experience.append(notice);
  window.requestAnimationFrame(() => notice.classList.add('is-visible'));
}

function loadExpandedExperiences() {
  expandedExperiencesPromise ??= import('./overlays/expandedExperiences.js').then(({ createExpandedExperiences }) => {
    expandedExperiences = createExpandedExperiences({ host: overlayRoot, background: sceneStage, scenes, audio });
    return expandedExperiences;
  });
  return expandedExperiencesPromise;
}
async function bootstrapInteractiveExperience() {
  if (interactionBootPromise) return interactionBootPromise;
  interactionBootPromise = (async () => {
    interactionState = 'booting';
    complaintFolder = createEditorialFolder({
      host: overlayRoot,
      background: sceneStage,
      title: 'Denunce da cattivo vicino',
      documents: complaintDocuments,
      onClose: () => app.querySelector('.hit--complaint-file')?.classList.remove('is-opening'),
    });
    audio = initializeAudio();
    mailboxOverlay = createMailboxOverlay({ host: overlayRoot, background: sceneStage });
    bulletinBoard = createBulletinBoard({ host: overlayRoot, background: sceneStage, boardScene: scenes.lobby });
    mariaInteractions = createMariaInteractions({ host: overlayRoot, background: sceneStage, scene: scenes['home-maria'], period, audio });
    rossiInteractions = createRossiInteractions({ host: overlayRoot, background: sceneStage, scene: scenes['home-rossi'], audio });
    jannelTarot = createJannelTarot({ host: overlayRoot, background: sceneStage });
    nativeFullscreen = initializeNativeFullscreen({ root: app, onViewportChange: viewportLifecycle.refresh });
    bindInteractionListeners();
    await hydrateSvgAssets(sceneStage);
    applyExteriorTime(exterior, period);
    setElevatorFloorIndicator(elevator, currentFloor);
    initializeSceneEnhancements(scenes);
    layoutSceneHitAreas(sceneStage);
    boxPhysics = initializeDraggableSvgObjects(scenes['home-player']);
    boxPhysics.setActive(scene === 'home-player');
    rossiInteractions.hydrate();
    interactionHighlights = initializeInteractionHighlights({ sceneDefinitions, scenes, draggableElements: boxPhysics.wrappers });
    interactionHighlights.flashScene(scene);
    audio.setAudioScene(scene);
    experience.classList.add('assets-ready');
    interactionState = 'ready';
  })();
  interactionBootPromise.catch(() => { interactionState = 'error'; });
  return interactionBootPromise;
}

mobileEntry = initializeFinalMobileEntry({
  app,
  experience,
  sceneStage,
  onViewportChange: () => viewportLifecycle?.refresh(),
  onGesture: () => requestNativeFullscreen(app),
  onEntryReady: ({ release }) => {
    bootstrapInteractiveExperience()
      .then(() => {
        if (!welcomeSeen) sceneStage.setAttribute('inert', '');
        else sceneStage.removeAttribute('inert');
        release();
      })
      .catch(() => release());
  },
});
viewportDebug = initializeViewportDebug({
  scope: 'document',
  sceneStage,
  experience,
  getShutterState: () => ({ state: mobileEntry?.state }),
  getInteractionState: () => ({ state: interactionState }),
});
touchProbe = initializeTouchProbe({ scope: 'document' });

if (mobileEntry.deferBootstrap) {
  sceneStage.setAttribute('inert', '');
  hydrateSvgAssets(exterior).then(() => {
    applyExteriorTime(exterior, period);
    experience.classList.add('assets-ready');
  });
} else {
  bootstrapInteractiveExperience();
}

function focusScene(target) {
  target.querySelector('button')?.focus({ preventScroll: true });
}

function usesMobileElevatorFocus() {
  return shouldUseMobileElevatorFocus({
    force: forceMobileElevatorQa,
    coarsePointer: coarsePointerQuery?.matches === true,
    landscape: window.matchMedia?.('(orientation: landscape)').matches === true,
  });
}

function resetElevatorPanelFocus() {
  window.clearTimeout(elevatorPanelTimer);
  elevator.classList.remove('is-panel-focused', 'is-panel-ready', 'is-panel-returning');
  elevator.style.removeProperty('--panel-scale');
  elevator.style.removeProperty('--panel-shift-x');
  elevator.style.removeProperty('--panel-shift-y');
  pendingElevatorTravel = null;
}

function layoutElevatorPanelFocus() {
  const svg = elevator.querySelector('.qwen-svg');
  const panel = svg?.querySelector('[data-svg-id="button-panel"]');
  const art = elevator.querySelector('.qwen-art');
  if (!svg || !panel || !art) return false;
  const viewBox = svg.viewBox?.baseVal;
  const artRect = art.getBoundingClientRect();
  if (!viewBox?.width || !viewBox?.height || !artRect.width || !artRect.height) return false;
  const box = panel.getBBox();
  const sourceScale = Math.max(artRect.width / viewBox.width, artRect.height / viewBox.height);
  const sourceLeft = (artRect.width - viewBox.width * sourceScale) / 2 - viewBox.x * sourceScale;
  const sourceTop = (artRect.height - viewBox.height * sourceScale) / 2 - viewBox.y * sourceScale;
  const panelLeft = sourceLeft + box.x * sourceScale;
  const panelTop = sourceTop + box.y * sourceScale;
  const panelWidth = box.width * sourceScale;
  const panelHeight = box.height * sourceScale;
  const margin = Math.max(16, Math.min(28, artRect.height * 0.065));
  const scale = Math.min((artRect.width - margin * 2) / panelWidth, (artRect.height - margin * 2) / panelHeight);
  const panelCenterX = panelLeft + panelWidth / 2;
  const panelCenterY = panelTop + panelHeight / 2;
  const shiftX = artRect.width / 2 - panelCenterX * scale;
  const shiftY = artRect.height / 2 - panelCenterY * scale;
  elevator.style.setProperty('--panel-scale', String(scale));
  elevator.style.setProperty('--panel-shift-x', `${shiftX}px`);
  elevator.style.setProperty('--panel-shift-y', `${shiftY}px`);
  return true;
}

function pointInsideRect(clientX, clientY, rect) {
  return Boolean(rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom);
}

function focusedElevatorSvgId(event) {
  return event.composedPath()
    .find((node) => node instanceof Element && /^button-(?:[c0123]|alarm)$/.test(node.dataset?.svgId ?? ''))
    ?.dataset.svgId ?? null;
}

function focusedElevatorControl(svgId) {
  return svgId ? elevator.querySelector(`[data-hit-target="${svgId}"]`) : null;
}

function eventBelongsToElevatorPanel(event) {
  if (event.composedPath().some((node) => node instanceof Element && node.dataset?.svgId === 'button-panel')) return true;
  const panel = elevator.querySelector('.qwen-svg [data-svg-id="button-panel"]');
  return pointInsideRect(event.clientX, event.clientY, panel?.getBoundingClientRect());
}

function focusElevatorPanel() {
  if (!usesMobileElevatorFocus() || scene !== 'elevator' || transitioning) return;
  window.clearTimeout(elevatorPanelTimer);
  elevator.classList.remove('is-panel-returning', 'is-panel-ready');
  if (!layoutElevatorPanelFocus()) return;
  elevator.classList.add('is-panel-focused');
  elevatorPanelTimer = window.setTimeout(() => {
    if (scene !== 'elevator' || !elevator.classList.contains('is-panel-focused')) return;
    elevator.classList.add('is-panel-ready');
  }, elevatorPanelTransitionMs);
}

function closeElevatorPanel(onComplete) {
  if (!elevator.classList.contains('is-panel-focused')) return false;
  window.clearTimeout(elevatorPanelTimer);
  elevator.classList.remove('is-panel-ready', 'is-panel-focused');
  elevator.classList.add('is-panel-returning');
  elevatorPanelTimer = window.setTimeout(() => {
    elevator.classList.remove('is-panel-returning');
    layoutSceneHitAreas(elevator);
    onComplete?.();
  }, elevatorPanelTransitionMs);
  return true;
}

function setScene(next) {
  const outgoing = scenes[scene];
  const incoming = scenes[next];
  if (!incoming) return;
  outgoing.classList.remove('is-active');
  outgoing.setAttribute('aria-hidden', 'true');
  incoming.classList.add('is-active');
  incoming.removeAttribute('aria-hidden');
  scene = next;
  boxPhysics?.setActive(next === 'home-player');
  const floor = floorForScene(next);
  if (floor) currentFloor = floor;
  layoutSceneHitAreas(incoming);
  audio.setAudioScene(next);
  window.requestAnimationFrame(() => interactionHighlights?.flashScene(next));
}

function clearTransitionClasses() {
  experience.classList.remove('is-arriving');
  Object.values(scenes).forEach((sceneNode) => sceneNode.classList.remove('is-elevator-arriving', 'is-elevator-opening'));
  elevator.classList.remove('doors-open', 'is-travelling');
}

function changeScene(next, trigger, options = {}) {
  if (transitioning || scene === next || !scenes[next]) return;
  const from = scene;
  const isElevatorTravel = options.elevatorTravel === true;
  transitioning = true;
  playDoorLatch();
  trigger?.classList.add('is-opening');

  if (isElevatorTravel) {
    elevator.classList.remove('doors-open');
    elevator.classList.add('is-travelling');
    window.setTimeout(() => transitionIris.classList.add('is-covering'), 135);
    window.setTimeout(() => {
      currentFloor = options.floor;
      setElevatorFloorIndicator(elevator, currentFloor);
    }, 245);
    window.setTimeout(() => {
      setScene(next);
      scenes[next].classList.add('is-elevator-arriving');
      trigger?.classList.remove('is-opening');
    }, 365);
    window.setTimeout(() => transitionIris.classList.remove('is-covering'), 400);
    window.setTimeout(() => {
      clearTransitionClasses();
      transitioning = false;
      focusScene(scenes[next]);
    }, 680);
    return;
  }

  const isElevatorPassage = next === 'elevator' || from === 'elevator';
  if (isElevatorPassage) {
    if (next === 'elevator') {
      scenes[from].classList.add('is-elevator-opening');
      elevator.classList.add('doors-open');
    }
    window.setTimeout(() => {
      if (from === 'elevator') scenes[next].classList.add('is-elevator-arriving');
      setScene(next);
      trigger?.classList.remove('is-opening');
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        elevator.classList.remove('doors-open');
        scenes[next].classList.remove('is-elevator-arriving');
      }));
    }, 300);
    window.setTimeout(() => {
      clearTransitionClasses();
      transitioning = false;
      focusScene(scenes[next]);
    }, 660);
    return;
  }

  const isEntrancePassage = trigger?.classList.contains('hit--exterior-door')
    || trigger?.classList.contains('hit--lobby-exit');
  const coverDelay = isEntrancePassage ? 235 : 155;
  const swapDelay = isEntrancePassage ? 360 : 305;
  const revealDelay = isEntrancePassage ? 390 : 335;
  const finishDelay = isEntrancePassage ? 640 : 580;

  window.setTimeout(() => transitionIris.classList.add('is-covering'), coverDelay);
  window.setTimeout(() => {
    setScene(next);
    experience.classList.add('is-arriving');
    trigger?.classList.remove('is-opening');
  }, swapDelay);
  window.setTimeout(() => transitionIris.classList.remove('is-covering'), revealDelay);
  window.setTimeout(() => {
    clearTransitionClasses();
    transitioning = false;
    focusScene(scenes[next]);
  }, finishDelay);
}

function chooseBellVariant() {
  if (bellCopy.variants.length === 1) return 0;
  let next;
  do next = Math.floor(Math.random() * bellCopy.variants.length);
  while (next === previousBellVariant);
  previousBellVariant = next;
  return next;
}

function ringBell(button) {
  playBell();
  button.classList.remove('is-ringing');
  void button.offsetWidth;
  button.classList.add('is-ringing');
  const copy = bellCount === 0 ? bellCopy.first : bellCopy.variants[chooseBellVariant()];
  bellCount += 1;
  sessionStorage.setItem('conventional:bell-count', String(bellCount));
  bellCaption.innerHTML = `<span class="drin" aria-hidden="true">DRIN!</span><p>${copy}</p>`;
  bellCaption.classList.remove('is-visible');
  void bellCaption.offsetWidth;
  bellCaption.classList.add('is-visible');
}

function ambientFeedback(button) {
  button.classList.remove('is-touched');
  void button.offsetWidth;
  button.classList.add('is-touched');
  const target = scenes[scene].querySelector(`[data-svg-id="${button.dataset.hitTarget}"]`);
  target?.classList.add('is-touched');
  window.setTimeout(() => target?.classList.remove('is-touched'), 260);
}

function enterElevator(button) {
  resetElevatorPanelFocus();
  currentFloor = floorForScene(scene) ?? currentFloor;
  setElevatorFloorIndicator(elevator, currentFloor);
  changeScene('elevator', button);
}

function leaveElevator(button) {
  changeScene(sceneForFloor[currentFloor] ?? 'lobby', button);
}

function travelElevator(destination, button) {
  const floor = destinationLabels[destination];
  if (!floor) return;
  const startTravel = () => {
    const travel = pendingElevatorTravel ?? { destination, button, floor };
    pendingElevatorTravel = null;
    changeScene(travel.destination, travel.button, { elevatorTravel: true, floor: travel.floor });
  };
  if (usesMobileElevatorFocus() && elevator.classList.contains('is-panel-focused')) {
    pendingElevatorTravel = { destination, button, floor };
    closeElevatorPanel(startTravel);
    return;
  }
  startTravel();
}

function bindInteractionListeners() {
  if (interactionListenersBound) return;
  interactionListenersBound = true;

elevator.addEventListener('pointerup', (event) => {
  if (scene !== 'elevator' || !usesMobileElevatorFocus() || !elevator.classList.contains('is-panel-focused')) return;
  if (!elevator.classList.contains('is-panel-ready')) {
    suppressElevatorClickUntil = performance.now() + 500;
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  const control = focusedElevatorControl(focusedElevatorSvgId(event));
  suppressElevatorClickUntil = performance.now() + 500;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (control?.classList.contains('hit--elevator-floor')) {
    travelElevator(control.dataset.destination, control);
    return;
  }
  if (control?.classList.contains('hit--elevator-alarm')) {
    ambientFeedback(control);
    return;
  }
  if (!eventBelongsToElevatorPanel(event)) closeElevatorPanel();
}, true);

app.addEventListener('click', (event) => {
  if (scene === 'elevator' && usesMobileElevatorFocus() && performance.now() < suppressElevatorClickUntil) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  const actionTarget = event.target.closest('[data-action]');
  if (scene === 'elevator' && usesMobileElevatorFocus()) {
    if (elevator.classList.contains('is-panel-returning')) return;
    if (elevator.classList.contains('is-panel-focused')) {
      if (eventBelongsToElevatorPanel(event)) return;
      else {
        closeElevatorPanel();
        return;
      }
    }
  }
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  if (action === 'close-letter') {
    sessionStorage.setItem('conventional:welcome-seen', 'true');
    const overlay = overlayRoot.querySelector('[data-welcome-overlay]');
    overlay.classList.add('is-closing');
    window.setTimeout(() => {
      overlay.remove();
      sceneStage.removeAttribute('inert');
      focusScene(exterior);
      layoutSceneHitAreas(sceneStage);
      window.setTimeout(showOnboardingNotice, 400);
    }, 260);
    return;
  }
  if (action === 'bell') ringBell(actionTarget);
  if (action === 'scene') {
    if (scene === 'exterior'
      && actionTarget.dataset.destination === 'lobby'
      && actionTarget.classList.contains('hit--exterior-door')) nativeFullscreen?.tryEnter();
    changeScene(actionTarget.dataset.destination, actionTarget);
  }
  if (action === 'elevator') enterElevator(actionTarget);
  if (action === 'leave-elevator') leaveElevator(actionTarget);
  if (action === 'focus-elevator-panel') focusElevatorPanel();
  if (action === 'elevator-destination') travelElevator(actionTarget.dataset.destination, actionTarget);
  if (action === 'external-link') {
    const externalUrl = actionTarget.dataset.externalUrl;
    if (externalUrl.startsWith('mailto:')) {
      window.location.href = externalUrl;
    } else {
      const opened = window.open(externalUrl, '_blank', 'noopener,noreferrer');
      if (opened) opened.opener = null;
    }
  }
  if (action === 'feedback') {
    const mailbox = mailboxById[actionTarget.dataset.feedback];
    if (actionTarget.dataset.feedback === 'board') bulletinBoard.open(actionTarget);
    else if (mailbox) {
      const svgTarget = scenes.lobby.querySelector(`[data-svg-id="${mailbox.id}"]`);
      mailboxOverlay.open(mailbox, actionTarget, svgTarget);
    } else ambientFeedback(actionTarget);
  }
  if (action === 'elevator-mirror-fact') loadExpandedExperiences().then((features) => features.openElevatorFact(actionTarget));
  if (action === 'elevator-social-game') loadExpandedExperiences().then((features) => features.openElevatorGame(actionTarget));
  if (action === 'gossip-article') loadExpandedExperiences().then((features) => features.openGossip(actionTarget));
  if (action === 'paolo-story') {
    scenes['home-paolo'].classList.add('story-light-off');
    window.setTimeout(() => loadExpandedExperiences().then((features) => features.openStory('paolo', actionTarget)), 320);
  }
  if (action === 'arturo-story') loadExpandedExperiences().then((features) => features.openStory('arturo', actionTarget));
  if (action === 'avoid-neighbors') loadExpandedExperiences().then((features) => features.openAvoidNeighbors(actionTarget));
  if (action === 'home-article') loadExpandedExperiences().then((features) => features.openHomeArticle(actionTarget));
  if (action === 'intercom-article') loadExpandedExperiences().then((features) => features.openIntercomArticle(actionTarget));
  if (action === 'artwork-lightbox') loadExpandedExperiences().then((features) => features.openArtwork(actionTarget.dataset.hitTarget, actionTarget));
  if (action === 'pet-cat') {
    const cat = scenes[scene]?.querySelector(`[data-svg-id="${actionTarget.dataset.hitTarget}"]`);
    cat?.classList.remove('is-petted');
    void cat?.getBoundingClientRect();
    cat?.classList.add('is-petted');
    window.setTimeout(() => cat?.classList.remove('is-petted'), 520);
    playEffect('cat');
  }
  if (action === 'editorial') {
    actionTarget.classList.add('is-opening');
    window.setTimeout(() => complaintFolder.open(actionTarget), 150);
  }
  if (action === 'maria-binoculars') mariaInteractions.openBinocular(actionTarget);
  if (action === 'maria-fridge') mariaInteractions.toggleFridge(actionTarget);
  if (action === 'maria-junk-drawer') mariaInteractions.openJunkDrawer(actionTarget);
  if (action === 'maria-recipe-book') mariaInteractions.openRecipes(actionTarget);
  if (action === 'jannel-tarot') jannelTarot.open(actionTarget);
  if (action === 'rossi-wall-drawing') rossiInteractions.openWallDrawing(actionTarget);
  if (action === 'rossi-bunk-boing') rossiInteractions.boingBeds(actionTarget);
  if (action === 'rossi-sticker-album') rossiInteractions.openStickerAlbum(actionTarget);
});

document.addEventListener('keydown', (event) => {
  if (expandedExperiences?.handleKeydown(event)) return;
  if (jannelTarot.handleKeydown(event)) return;
  if (rossiInteractions.handleKeydown(event)) return;
  if (mariaInteractions.handleKeydown(event)) return;
  if (bulletinBoard.handleKeydown(event)) return;
  if (mailboxOverlay.handleKeydown(event)) return;
  if (complaintFolder.handleKeydown(event)) return;
  if (event.key === 'Escape' && closeElevatorPanel()) return;
  if (event.key === 'Escape') app.querySelector('[data-action="close-letter"]')?.click();
});
}

window.__CONVENTIONAL__ = {
  period,
  mobileEntry,
  auditAlignment: () => auditVisibleHitAlignment(app),
  get interactionState() { return interactionState; },
  get scene() { return scene; },
  get floor() { return currentFloor; },
  get sceneDefinition() { return scenesByKey[scene]; },
};

app.querySelector('[data-action="close-letter"]')?.focus({ preventScroll: true });
}
