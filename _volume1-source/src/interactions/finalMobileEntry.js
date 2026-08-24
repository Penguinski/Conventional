import shutterAsset from '../assets/tapparella.svg?raw';
import { getViewportDebugOptions } from './viewportExperiments.js';
import { needsIosSafariEntry } from './mobileEntryPlatform.js';

const landscapeQuery = '(orientation: landscape)';
const coarsePointerQuery = '(pointer: coarse)';
const gateThreshold = 0.30;
const shutterTravel = 900;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function viewportHeight() {
  return Math.max(1, Math.round(window.visualViewport?.height ?? window.innerHeight));
}

function viewportSignature() {
  const visual = window.visualViewport;
  return [
    window.innerWidth,
    window.innerHeight,
    document.documentElement.clientWidth,
    document.documentElement.clientHeight,
    visual?.width,
    visual?.height,
    visual?.scale,
    visual?.offsetLeft,
    visual?.offsetTop,
  ].map((value) => Number.isFinite(Number(value)) ? Number(value).toFixed(2) : 'na').join('|');
}

function findScrollableElement(target) {
  let element = target instanceof Element ? target : target?.parentElement;
  while (element && element !== document.body && element !== document.documentElement) {
    const style = getComputedStyle(element);
    const scrollableY = ['auto', 'scroll'].includes(style.overflowY)
      && element.scrollHeight > element.clientHeight + 1;
    const scrollableX = ['auto', 'scroll'].includes(style.overflowX)
      && element.scrollWidth > element.clientWidth + 1;
    if (scrollableX || scrollableY) return { element, scrollableX, scrollableY };
    element = element.parentElement;
  }
  return null;
}

function canConsumeGesture(scroller, deltaX, deltaY) {
  if (!scroller) return false;
  const { element, scrollableX, scrollableY } = scroller;
  if (scrollableX && Math.abs(deltaX) >= Math.abs(deltaY) && Math.abs(deltaX) >= 0.5) {
    const maxScrollX = Math.max(0, element.scrollWidth - element.clientWidth);
    if (deltaX > 0) return element.scrollLeft > 0;
    return element.scrollLeft < maxScrollX - 1;
  }
  if (!scrollableY || Math.abs(deltaY) < 0.5) return false;
  const maxScroll = Math.max(0, element.scrollHeight - element.clientHeight);
  if (deltaY > 0) return element.scrollTop > 0;
  return element.scrollTop < maxScroll - 1;
}

export function initializeFinalMobileEntry({
  app,
  experience,
  sceneStage,
  onGesture,
  onEntryReady,
  onViewportChange,
} = {}) {
  const root = document.documentElement;
  const debugOptions = getViewportDebugOptions();
  const query = new URLSearchParams(window.location.search);
  const touchDevice = window.matchMedia?.(coarsePointerQuery).matches === true
    || Number(navigator.maxTouchPoints) > 0;
  const enabled = (touchDevice && needsIosSafariEntry()) || query.has('qa-mobile-intro');
  let active = false;
  let entered = false;
  let completing = false;
  let touching = false;
  let gestureNotified = false;
  let peakProgress = 0;
  let entryDistance = 0;
  let landingTarget = 0;
  let spacer = null;
  let runway = null;
  let overlay = null;
  let shutter = null;
  let settleTimer = 0;
  let orientationTimer = 0;
  let stableFrame = 0;
  let stableTimer = 0;
  let correctionFrame = 0;
  let lastLandscape = null;
  let internalScroller = null;
  let lastTouchX = 0;
  let lastTouchY = 0;

  function setState(state) {
    if (state) root.dataset.mobileEntryState = state;
    else delete root.dataset.mobileEntryState;
  }

  function isLandscape() {
    return window.matchMedia?.(landscapeQuery).matches === true;
  }

  function maxDocumentScroll() {
    return Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
  }

  function visualViewportTop() {
    const offsetTop = Number(window.visualViewport?.offsetTop);
    return Number.isFinite(offsetTop) ? offsetTop : 0;
  }

  function stageVisibleTop() {
    const stage = sceneStage ?? experience;
    return stage.getBoundingClientRect().top - visualViewportTop();
  }

  function refreshLandingGeometry() {
    const stage = sceneStage ?? experience;
    const stageDocumentTop = window.scrollY + stage.getBoundingClientRect().top;
    landingTarget = Math.max(0, stageDocumentTop - visualViewportTop());

    if (runway) {
      runway.style.height = '0px';
      const missingTravel = Math.max(0, Math.ceil(landingTarget - maxDocumentScroll()));
      runway.style.height = `${missingTravel}px`;
    }

    landingTarget = Math.min(landingTarget, maxDocumentScroll());
    return landingTarget;
  }

  function landingScroll() {
    return Math.min(landingTarget, maxDocumentScroll());
  }

  function setProgress(progress) {
    if (!shutter) return;
    const clamped = clamp(progress, 0, 1);
    shutter.setAttribute('transform', `translate(0 ${-Math.round(clamped * shutterTravel)})`);
    overlay?.style.setProperty('--shutter-progress', String(clamped));
  }

  function progressFromScroll() {
    return entryDistance ? clamp(window.scrollY / entryDistance, 0, 1) : 0;
  }

  function createEntry() {
    entryDistance = Math.round(clamp(viewportHeight() * 0.85, 220, 360));
    spacer = document.createElement('section');
    spacer.className = 'mobile-final-entry-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.height = `${entryDistance}px`;
    experience.before(spacer);

    runway = document.createElement('div');
    runway.className = 'mobile-final-landing-runway';
    runway.setAttribute('aria-hidden', 'true');
    experience.after(runway);
    landingTarget = entryDistance;

    const svg = shutterAsset.replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ');
    overlay = document.createElement('div');
    overlay.className = 'mobile-final-shutter';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Alza la tapparella per entrare nel condominio');
    overlay.innerHTML = `
      <div class="mobile-final-shutter-art" aria-hidden="true">${svg}</div>
      <p class="mobile-final-shutter-hint">Alza la tapparella</p>`;
    app.append(overlay);
    shutter = overlay.querySelector('#shutter');
  }

  function clearEntryTimers() {
    window.clearTimeout(settleTimer);
    window.clearTimeout(orientationTimer);
    window.clearTimeout(stableTimer);
    window.cancelAnimationFrame(stableFrame);
    window.cancelAnimationFrame(correctionFrame);
    settleTimer = 0;
    orientationTimer = 0;
    stableTimer = 0;
    stableFrame = 0;
    correctionFrame = 0;
  }

  function removeUnenteredEntry() {
    if (entered) return;
    active = false;
    completing = false;
    touching = false;
    peakProgress = 0;
    spacer?.remove();
    runway?.remove();
    overlay?.remove();
    spacer = null;
    runway = null;
    overlay = null;
    shutter = null;
    entryDistance = 0;
    landingTarget = 0;
    root.classList.remove('mobile-final-flow', 'mobile-final-intro-active');
    setState('portrait');
    window.scrollTo(0, 0);
  }

  function releaseOverlay() {
    if (!overlay) return;
    const closing = overlay;
    closing.classList.add('is-closing');
    window.setTimeout(() => {
      if (overlay !== closing) return;
      closing.remove();
      overlay = null;
      shutter = null;
    }, 180);
  }

  function waitForStableLanding(callback) {
    let stableFrames = 0;
    let lastSignature = viewportSignature();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(stableTimer);
      window.cancelAnimationFrame(stableFrame);
      stableTimer = 0;
      stableFrame = 0;
      callback();
    };
    const sample = () => {
      if (finished) return;
      const target = refreshLandingGeometry();
      const signature = viewportSignature();
      const aligned = Math.abs(window.scrollY - target) <= 1
        && Math.abs(stageVisibleTop()) <= 1;
      if (!aligned && Math.abs(window.scrollY - target) > 1) window.scrollTo(0, target);
      if (aligned && signature === lastSignature) stableFrames += 1;
      else {
        lastSignature = signature;
        stableFrames = 0;
      }
      if (stableFrames >= 4) return finish();
      stableFrame = window.requestAnimationFrame(sample);
    };
    stableFrame = window.requestAnimationFrame(sample);
    stableTimer = window.setTimeout(finish, 900);
  }

  function completeLanding() {
    entered = true;
    active = false;
    completing = false;
    setProgress(1);
    setState('entered');
    root.classList.remove('mobile-final-intro-active');
    root.classList.add('mobile-final-entered');
    onViewportChange?.();
    const release = () => releaseOverlay();
    if (onEntryReady) onEntryReady({ release, entryDistance });
    else release();
  }

  function beginLanding() {
    if (!active || completing || entered) return;
    completing = true;
    setState('settling');
    const target = refreshLandingGeometry();
    window.scrollTo({ top: target, behavior: 'smooth' });
    waitForStableLanding(completeLanding);
  }

  function settleGesture() {
    window.clearTimeout(settleTimer);
    if (!active || entered || completing || touching) return;
    if (peakProgress >= gateThreshold || progressFromScroll() >= gateThreshold) beginLanding();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scheduleSettle() {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settleGesture, 120);
  }

  function handleScroll() {
    if (entered) {
      window.cancelAnimationFrame(correctionFrame);
      correctionFrame = window.requestAnimationFrame(() => {
        correctionFrame = 0;
        const target = landingScroll();
        if (Math.abs(window.scrollY - target) > 1) window.scrollTo(0, target);
      });
      return;
    }
    if (!active) return;
    const progress = progressFromScroll();
    peakProgress = Math.max(peakProgress, progress);
    setProgress(progress);
    scheduleSettle();
  }

  function notifyGesture() {
    if (gestureNotified) return;
    gestureNotified = true;
    onGesture?.();
  }

  function handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    if (entered) {
      internalScroller = findScrollableElement(event.target);
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      return;
    }
    if (!active) return;
    touching = true;
    notifyGesture();
  }

  function handleTouchMove(event) {
    if (!entered) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const deltaX = touch.clientX - lastTouchX;
    const deltaY = touch.clientY - lastTouchY;
    if (canConsumeGesture(internalScroller, deltaX, deltaY)) {
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      return;
    }
    event.preventDefault();
  }

  function handleTouchEnd() {
    internalScroller = null;
    if (!active || entered) return;
    touching = false;
    settleGesture();
  }

  function activateEntry() {
    if (active || entered || !isLandscape()) return;
    root.classList.add('mobile-final-flow', 'mobile-final-intro-active');
    createEntry();
    active = true;
    completing = false;
    touching = false;
    gestureNotified = false;
    peakProgress = 0;
    setState('closed');
    window.scrollTo(0, 0);
    setProgress(0);
  }

  function syncOrientation() {
    if (!enabled) return;
    const landscape = isLandscape();
    if (debugOptions.debug) root.dataset.mobileEntryOrientation = landscape ? 'landscape' : 'portrait';
    if (landscape === lastLandscape) {
      if (landscape && entered) window.scrollTo(0, refreshLandingGeometry());
      return;
    }
    lastLandscape = landscape;
    if (landscape) {
      if (entered) window.scrollTo(0, refreshLandingGeometry());
      else activateEntry();
    } else if (!entered) removeUnenteredEntry();
  }

  function scheduleOrientationSync() {
    window.clearTimeout(orientationTimer);
    orientationTimer = window.setTimeout(syncOrientation, 80);
  }

  if (!enabled) {
    setState('entered');
    return {
      deferBootstrap: false,
      refresh() {},
      get state() { return 'entered'; },
      get entryDistance() { return 0; },
      destroy() {},
    };
  }

  root.classList.add('mobile-final-candidate');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('scrollend', settleGesture, { passive: true });
  document.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });
  document.addEventListener('touchcancel', handleTouchEnd, { passive: true, capture: true });
  window.addEventListener('resize', scheduleOrientationSync, { passive: true });
  window.addEventListener('orientationchange', scheduleOrientationSync, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleOrientationSync, { passive: true });
  syncOrientation();

  return {
    deferBootstrap: true,
    refresh: syncOrientation,
    get state() { return root.dataset.mobileEntryState ?? null; },
    get entryDistance() { return entryDistance; },
    destroy() {
      clearEntryTimers();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scrollend', settleGesture);
      document.removeEventListener('touchstart', handleTouchStart, true);
      document.removeEventListener('touchmove', handleTouchMove, true);
      document.removeEventListener('touchend', handleTouchEnd, true);
      document.removeEventListener('touchcancel', handleTouchEnd, true);
      window.removeEventListener('resize', scheduleOrientationSync);
      window.removeEventListener('orientationchange', scheduleOrientationSync);
      window.visualViewport?.removeEventListener('resize', scheduleOrientationSync);
      spacer?.remove();
      runway?.remove();
      overlay?.remove();
      root.classList.remove('mobile-final-candidate', 'mobile-final-flow', 'mobile-final-intro-active', 'mobile-final-entered');
      delete root.dataset.mobileEntryOrientation;
      delete root.dataset.mobileEntryState;
    },
  };
}
