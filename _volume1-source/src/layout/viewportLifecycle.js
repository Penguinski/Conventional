function readViewport() {
  const visualViewport = window.visualViewport;
  const width = Math.max(1, Math.round(visualViewport?.width || window.innerWidth || document.documentElement.clientWidth));
  const height = Math.max(1, Math.round(visualViewport?.height || window.innerHeight || document.documentElement.clientHeight));
  return {
    width,
    height,
    orientation: width >= height ? 'landscape' : 'portrait',
  };
}

function readViewportSignature() {
  const visualViewport = window.visualViewport;
  return [
    window.innerWidth,
    window.innerHeight,
    document.documentElement.clientWidth,
    document.documentElement.clientHeight,
    visualViewport?.width,
    visualViewport?.height,
    visualViewport?.scale,
    visualViewport?.offsetLeft,
    visualViewport?.offsetTop,
  ].map((value) => Number.isFinite(Number(value)) ? Number(value).toFixed(2) : 'na').join('|');
}

export function initializeViewportLifecycle({ root, onLayout, onSettled }) {
  let frame = 0;
  let settledTimer = 0;
  let destroyed = false;

  function apply({ settled = false } = {}) {
    frame = 0;
    window.clearTimeout(settledTimer);
    settledTimer = 0;
    const viewport = readViewport();
    root.dataset.viewportOrientation = viewport.orientation;
    window.requestAnimationFrame(() => {
      if (destroyed) return;
      onLayout?.(viewport);
      if (settled) onSettled?.(viewport);
    });
  }

  function schedule() {
    if (destroyed) return;
    window.cancelAnimationFrame(frame);
    window.clearTimeout(settledTimer);
    let stableFrames = 0;
    let lastSignature = readViewportSignature();

    const sample = () => {
      if (destroyed) return;
      const signature = readViewportSignature();
      if (signature === lastSignature) stableFrames += 1;
      else {
        lastSignature = signature;
        stableFrames = 0;
      }
      if (stableFrames >= 3) {
        apply({ settled: true });
        return;
      }
      frame = window.requestAnimationFrame(sample);
    };

    frame = window.requestAnimationFrame(sample);
    settledTimer = window.setTimeout(() => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      apply({ settled: true });
    }, 500);
  }

  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
  apply();

  return {
    refresh: schedule,
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settledTimer);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
    },
  };
}
