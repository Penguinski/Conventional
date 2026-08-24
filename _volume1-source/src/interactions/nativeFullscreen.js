const attemptKey = 'conventional:native-fullscreen-attempted';

export function requestNativeFullscreen(root) {
  const supported = document.fullscreenEnabled === true
    && typeof root?.requestFullscreen === 'function';
  if (!supported || navigator.userActivation?.isActive === false) return false;
  try {
    Promise.resolve(root.requestFullscreen({ navigationUI: 'hide' })).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

function readAttempted() {
  try { return sessionStorage.getItem(attemptKey) === 'true'; }
  catch { return false; }
}

function rememberAttempt() {
  try { sessionStorage.setItem(attemptKey, 'true'); }
  catch { /* Fullscreen remains a best-effort enhancement. */ }
}

export function initializeNativeFullscreen({ root, onViewportChange }) {
  const query = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
  const forceMobile = query?.has('qa-touch') === true;
  const forceUnavailable = query?.has('qa-no-fullscreen') === true;
  const forceRejection = query?.has('qa-reject-fullscreen') === true;
  let attempted = readAttempted();

  const handleFullscreenChange = () => {
    onViewportChange?.();
    if (document.fullscreenElement !== root) return;
    window.setTimeout(() => {
      if (document.fullscreenElement !== root) return;
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const coversDisplay = viewportWidth >= window.screen.width * 0.75
        && viewportHeight >= window.screen.height * 0.75;
      if (!coversDisplay) Promise.resolve(document.exitFullscreen?.()).catch(() => {});
    }, 80);
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  function tryEnter() {
    if (attempted) return;
    attempted = true;
    rememberAttempt();

    const mobile = forceMobile || window.matchMedia('(pointer: coarse)').matches;
    const supported = mobile
      && !forceUnavailable
      && document.fullscreenEnabled === true
      && typeof root?.requestFullscreen === 'function';
    if (!supported || navigator.userActivation?.isActive === false) return;

    try {
      if (forceRejection) {
        Promise.reject(new DOMException('QA fullscreen rejection', 'NotAllowedError')).catch(() => {});
        return;
      }
      requestNativeFullscreen(root);
    } catch {
      // Rejection must never delay or replace the normal entrance transition.
    }
  }

  return {
    tryEnter,
    destroy() { document.removeEventListener('fullscreenchange', handleFullscreenChange); },
  };
}
