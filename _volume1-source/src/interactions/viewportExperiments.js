export function getViewportDebugOptions() {
  const query = new URLSearchParams(window.location.search);
  return {
    debug: query.get('viewportDebug') === '1',
    touchDebug: query.get('touchDebug') === '1',
  };
}

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '—';
}

function describeElement(element) {
  if (!(element instanceof Element)) return 'null';
  const label = element.getAttribute('aria-label') || element.dataset.action || element.dataset.svgId || element.tagName.toLowerCase();
  const scene = element.closest('[data-scene]')?.dataset.scene;
  return scene ? `${label} [${scene}]` : label;
}

function isVisible(element) {
  if (!(element instanceof Element)) return false;
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return rect.width > 1 && rect.height > 1
    && style.visibility !== 'hidden'
    && style.display !== 'none'
    && style.pointerEvents !== 'none';
}

function formatRect(element) {
  if (!(element instanceof Element)) return '—';
  const rect = element.getBoundingClientRect();
  return `${formatNumber(rect.x)},${formatNumber(rect.y)} ${formatNumber(rect.width)}×${formatNumber(rect.height)}`;
}

export function auditVisibleHitAlignment(root = document) {
  const selectors = '[data-action], .shared-post-it, .overlay-close, [data-recipe-open], [data-recipe-close]';
  const targets = [...root.querySelectorAll(selectors)].filter(isVisible);
  const results = targets.map((target) => {
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    const matched = hit === target || target.contains(hit);
    return {
      label: describeElement(target),
      matched,
      point: `${formatNumber(x)},${formatNumber(y)}`,
      hit: describeElement(hit),
    };
  });
  return {
    total: results.length,
    matched: results.filter((result) => result.matched).length,
    failures: results.filter((result) => !result.matched),
    results,
  };
}

function readViewportSnapshot(sceneStage, experience, shutterState, interactionState) {
  const visual = window.visualViewport;
  const exterior = sceneStage?.querySelector('[data-scene="exterior"]');
  const background = exterior?.querySelector('.qwen-art--exterior-background');
  const backgroundSvg = background?.querySelector('svg');
  const mainArt = exterior?.querySelector('.qwen-art--facade');
  const mainSvg = mainArt?.querySelector('svg');
  const logo = experience?.querySelector('.brand-mark');
  const experienceStyle = experience ? getComputedStyle(experience) : null;
  const fullscreen = document.fullscreenElement;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
  const alignment = auditVisibleHitAlignment(sceneStage ?? document);
  return {
    scrollY: window.scrollY,
    maxScroll,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    visualWidth: visual?.width,
    visualHeight: visual?.height,
    visualScale: visual?.scale,
    visualOffsetLeft: visual?.offsetLeft,
    visualOffsetTop: visual?.offsetTop,
    experienceRect: formatRect(experience),
    sceneRect: formatRect(sceneStage),
    exteriorRect: formatRect(exterior),
    backgroundRect: formatRect(background),
    backgroundSvgRect: formatRect(backgroundSvg),
    mainSvgRect: formatRect(mainSvg),
    logoRect: formatRect(logo),
    experiencePosition: experienceStyle?.position ?? '—',
    experienceTransform: experienceStyle?.transform ?? '—',
    fullscreen: fullscreen ? `${fullscreen.tagName.toLowerCase()}${fullscreen.id ? `#${fullscreen.id}` : ''}` : 'none',
    shutter: shutterState?.state ?? '—',
    interaction: interactionState?.state ?? '—',
    alignment: `${alignment.matched}/${alignment.total}`,
  };
}

export function initializeViewportDebug({ scope = 'document', sceneStage, experience, getShutterState, getInteractionState } = {}) {
  const debugOptions = getViewportDebugOptions();
  if (!debugOptions.debug) return { destroy() {} };

  const panel = document.createElement('pre');
  panel.className = 'viewport-debug-panel';
  panel.setAttribute('aria-live', 'polite');
  panel.style.cssText = 'position:fixed;z-index:240;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));max-width:min(94vw,390px);margin:0;padding:8px 10px;border:1px solid rgba(255,255,255,.45);border-radius:6px;color:#fff;background:rgba(24,19,16,.82);font:10px/1.35 ui-monospace,monospace;white-space:pre-wrap;pointer-events:none;backdrop-filter:blur(3px);';
  document.body.append(panel);

  const update = () => {
    const snapshot = readViewportSnapshot(sceneStage, experience, getShutterState?.(), getInteractionState?.());
    panel.textContent = [
      `scope: ${scope}`,
      `scrollY: ${formatNumber(snapshot.scrollY)}`,
      `maxScroll: ${formatNumber(snapshot.maxScroll)}`,
      `inner: ${snapshot.innerWidth}×${snapshot.innerHeight}`,
      `client: ${snapshot.clientWidth}×${snapshot.clientHeight}`,
      `visual: ${formatNumber(snapshot.visualWidth)}×${formatNumber(snapshot.visualHeight)}`,
      `scale: ${formatNumber(snapshot.visualScale)}`,
      `offset: ${formatNumber(snapshot.visualOffsetLeft)} / ${formatNumber(snapshot.visualOffsetTop)}`,
      `experience: ${snapshot.experienceRect}`,
      `stage: ${snapshot.sceneRect}`,
      `exterior: ${snapshot.exteriorRect}`,
      `background: ${snapshot.backgroundRect}`,
      `background svg: ${snapshot.backgroundSvgRect}`,
      `main svg: ${snapshot.mainSvgRect}`,
      `logo: ${snapshot.logoRect}`,
      `layout: ${snapshot.experiencePosition} / ${snapshot.experienceTransform}`,
      `fullscreen: ${snapshot.fullscreen}`,
      `shutter: ${snapshot.shutter}`,
      `interaction: ${snapshot.interaction}`,
      `alignment: ${snapshot.alignment}`,
    ].join('\n');
  };

  const eventTypes = ['resize', 'orientationchange', 'scroll', 'fullscreenchange'];
  eventTypes.forEach((type) => window.addEventListener(type, update, { passive: true }));
  window.visualViewport?.addEventListener('resize', update, { passive: true });
  window.visualViewport?.addEventListener('scroll', update, { passive: true });
  const timer = window.setInterval(update, 100);
  update();

  return {
    destroy() {
      eventTypes.forEach((type) => window.removeEventListener(type, update));
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      window.clearInterval(timer);
      panel.remove();
    },
  };
}

function localSvgPoint(svg, clientX, clientY) {
  const inverse = svg?.getScreenCTM?.()?.inverse?.();
  if (!inverse) return null;
  const point = new DOMPoint(clientX, clientY).matrixTransform(inverse);
  return `${formatNumber(point.x)},${formatNumber(point.y)}`;
}

export function initializeTouchProbe({ scope = 'document' } = {}) {
  const debugOptions = getViewportDebugOptions();
  if (!debugOptions.touchDebug) return { destroy() {} };

  const marker = document.createElement('div');
  marker.className = 'touch-debug-probe';
  marker.style.cssText = 'position:fixed;z-index:250;display:none;width:22px;height:22px;margin:-11px 0 0 -11px;border:2px solid #ff6f55;border-radius:50%;box-shadow:0 0 0 1px #2a211c,0 0 12px rgba(255,111,85,.85);pointer-events:none;';
  const label = document.createElement('pre');
  label.style.cssText = 'position:absolute;top:20px;left:20px;min-width:190px;margin:0;padding:6px 8px;border:1px solid #2a211c;background:#f4e7d3;color:#2a211c;font:10px/1.3 ui-monospace,monospace;white-space:pre-wrap;';
  marker.append(label);
  document.body.append(marker);

  let hideTimer = 0;
  const handlePointerDown = (event) => {
    const { clientX, clientY } = event;
    const element = document.elementFromPoint(clientX, clientY);
    const svg = element?.closest?.('svg');
    const local = svg ? localSvgPoint(svg, clientX, clientY) : null;
    const target = element?.closest?.('[data-action], .shared-post-it, .overlay-close, [data-recipe-open], [data-recipe-close]');
    const targetRect = target?.getBoundingClientRect();
    const centerX = targetRect ? targetRect.left + targetRect.width / 2 : null;
    const centerY = targetRect ? targetRect.top + targetRect.height / 2 : null;
    marker.style.left = `${clientX}px`;
    marker.style.top = `${clientY}px`;
    marker.style.display = 'block';
    label.textContent = [
      `scope: ${scope}`,
      `client: ${formatNumber(clientX)},${formatNumber(clientY)}`,
      `element: ${describeElement(element)}`,
      `target: ${describeElement(target)}`,
      `target center: ${centerX === null ? '—' : `${formatNumber(centerX)},${formatNumber(centerY)}`}`,
      `center delta: ${centerX === null ? '—' : `${formatNumber(clientX - centerX)},${formatNumber(clientY - centerY)}`}`,
      `svg local: ${local ?? '—'}`,
    ].join('\n');
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => { marker.style.display = 'none'; }, 1400);
  };

  document.addEventListener('pointerdown', handlePointerDown, true);
  return {
    destroy() {
      window.clearTimeout(hideTimer);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      marker.remove();
    },
  };
}
