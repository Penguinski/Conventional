// ============ MAIN.JS - Inizializzazione applicazione ============

import { setupInteractions } from './interactions.js';
import { setupElevatorControls } from './elevator.js';
import { AppState, loadState } from './state.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  // Try to load saved state
  loadState();
  
  // Setup interactions
  setupInteractions();
  
  // Setup elevator controls
  setupElevatorControls();
  
  // Initial scene is set in HTML (scene-androne with is-active)
  console.log('CONVENTIONAL Volume 1 — Condominio initialized');
  
  // Add touch-friendly class for mobile devices
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
  }
  
  // Handle viewport resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Recalculate any layout-dependent things here if needed
    }, 250);
  });
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
  // Can add SW registration here if needed for PWA
}
