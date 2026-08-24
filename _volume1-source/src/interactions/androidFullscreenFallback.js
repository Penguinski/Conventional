import { requestNativeFullscreen } from './nativeFullscreen.js';

export function shouldShowAndroidFullscreenFallback({
  userAgent,
  landscape,
  fullscreenElement,
}) {
  return /Android/i.test(userAgent) && landscape && !fullscreenElement;
}

export function initializeAndroidFullscreenFallback({
  root,
  host = document.body,
  userAgent = navigator.userAgent,
  landscapeQuery = window.matchMedia('(orientation: landscape)'),
}) {
  if (!/Android/i.test(userAgent)) return { destroy() {} };

  const button = document.createElement('button');
  button.className = 'android-fullscreen-fallback';
  button.type = 'button';
  button.textContent = '⛶ SCHERMO INTERO';
  button.setAttribute('aria-label', 'Attiva schermo intero');
  button.hidden = true;
  host.append(button);

  const update = () => {
    button.hidden = !shouldShowAndroidFullscreenFallback({
      userAgent,
      landscape: landscapeQuery.matches,
      fullscreenElement: document.fullscreenElement,
    });
  };

  const handleVisibilityChange = () => {
    if (!document.hidden) update();
  };
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    requestNativeFullscreen(root);
  };

  button.addEventListener('click', handleClick);
  document.addEventListener('fullscreenchange', update);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('orientationchange', update);
  window.addEventListener('resize', update);
  update();

  return {
    destroy() {
      button.removeEventListener('click', handleClick);
      document.removeEventListener('fullscreenchange', update);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('resize', update);
      button.remove();
    },
  };
}
