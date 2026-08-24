const editableSelector = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

export function initializeBrowserGuards(root) {
  root.addEventListener('selectstart', (event) => {
    if (!event.target.closest?.(editableSelector)) event.preventDefault();
  });

  root.addEventListener('dragstart', (event) => {
    if (!event.target.closest?.(editableSelector)) event.preventDefault();
  });

  root.addEventListener('dblclick', (event) => {
    if (!event.target.closest?.(editableSelector)) event.preventDefault();
  }, { passive: false });

  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    root.addEventListener(type, (event) => event.preventDefault(), { passive: false });
  }

  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) event.preventDefault();
  }, { passive: false });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && ['+', '-', '=', '0'].includes(event.key)) event.preventDefault();
  });
}
