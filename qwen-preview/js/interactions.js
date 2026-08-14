// ============ INTERACTIONS.JS - Gestione interazioni utente ============

import { MICRO_LABELS, APARTMENT_ZONES } from './data.js';
import { openReader, closeReader, openBottomSheet, closeBottomSheet, openExperience, closeExperience, openLitiArchive } from './content-router.js';
import { AppState, saveState } from './state.js';
import { startElevatorRide } from './elevator.js';
import { initQuiz } from './quiz.js';
import { initElevatorGame } from './elevator-game.js';

let tagTimeout = null;

export function showTag(text, x, y) {
  const tag = document.getElementById('tag');
  tag.textContent = text;
  tag.style.left = x + 'px';
  tag.style.top = y + 'px';
  tag.classList.add('show');
  
  clearTimeout(tagTimeout);
  tagTimeout = setTimeout(() => {
    tag.classList.remove('show');
  }, 1500);
}

export function hideTag() {
  const tag = document.getElementById('tag');
  tag.classList.remove('show');
}

export function handleInteraction(e) {
  const target = e.target.closest('.hit');
  if (!target) return;
  
  const action = target.dataset.action;
  const rect = target.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top;
  
  // Hide hint on first interaction
  const hint = document.getElementById('hint');
  if (hint && !hint.classList.contains('gone')) {
    hint.classList.add('gone');
  }
  
  switch (action) {
    case 'micro':
      const label = MICRO_LABELS[target.dataset.id] || 'Oggetto';
      showTag(label, centerX, centerY);
      triggerMicroAnimation(target);
      break;
      
    case 'reader':
      const contentKey = target.dataset.content;
      const title = target.dataset.title;
      openReader(contentKey, title);
      break;
      
    case 'callLift':
      startElevatorRide();
      break;
      
    case 'liftPanel':
      // Handled by elevator.js
      break;
      
    case 'enterApartment':
      enterApartment(target.dataset.apt);
      break;
      
    case 'backToLanding':
      backToLanding();
      break;
      
    default:
      // Check for special actions
      if (target.dataset.id === 'pulsante-ascensore') {
        startElevatorRide();
      }
  }
}

function triggerMicroAnimation(element) {
  element.classList.add('nudge', 'shake');
  setTimeout(() => {
    element.classList.remove('nudge', 'shake');
  }, 400);
}

function enterApartment(aptId) {
  AppState.previousScene = AppState.currentScene;
  AppState.sceneHistory.push(AppState.currentScene);
  AppState.currentApartment = aptId;
  AppState.apartmentZone = 0;
  
  // Hide current scene
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('is-active'));
  
  // Show apartment scene
  const aptScene = document.getElementById(`scene-apt${aptId}`);
  if (aptScene) {
    aptScene.classList.add('is-active');
    AppState.currentScene = `scene-apt${aptId}`;
    
    // Update nav buttons
    updateApartmentNav(aptId);
  }
  
  saveState();
}

function backToLanding() {
  const currentApt = AppState.currentApartment;
  if (!currentApt) return;
  
  // Hide apartment scene
  const aptScene = document.getElementById(`scene-apt${currentApt}`);
  if (aptScene) {
    aptScene.classList.remove('is-active');
  }
  
  // Show landing scene
  const landingScene = document.getElementById('scene-landing1');
  if (landingScene) {
    landingScene.classList.add('is-active');
    AppState.currentScene = 'scene-landing1';
  }
  
  AppState.currentApartment = null;
  AppState.apartmentZone = 0;
  saveState();
}

function updateApartmentNav(aptId) {
  const zones = APARTMENT_ZONES[aptId];
  if (!zones) return;
  
  const navButtons = document.querySelectorAll('.apt-nav-btn');
  navButtons.forEach((btn, index) => {
    btn.classList.toggle('active', index === AppState.apartmentZone);
    btn.addEventListener('click', () => {
      AppState.apartmentZone = index;
      navButtons.forEach((b, i) => b.classList.toggle('active', i === index));
      highlightZoneObjects(zones[index].objects);
      saveState();
    });
  });
  
  // Initial highlight
  highlightZoneObjects(zones[0].objects);
}

function highlightZoneObjects(objectClasses) {
  // Remove previous highlights
  document.querySelectorAll('.zone-highlight').forEach(el => {
    el.classList.remove('zone-highlight');
    el.style.filter = '';
  });
  
  // Apply highlight to current zone objects
  objectClasses.forEach(cls => {
    document.querySelectorAll('.' + cls).forEach(el => {
      el.classList.add('zone-highlight');
      el.style.filter = 'drop-shadow(4px 6px 0 rgba(35,32,28,0.2))';
    });
  });
}

export function setupInteractions() {
  // Global click handler for hit areas
  document.addEventListener('click', handleInteraction);
  
  // Close overlays handlers
  document.querySelectorAll('.close-btn, .overlay-backdrop').forEach(el => {
    el.addEventListener('click', () => {
      closeReader();
      closeBottomSheet();
      closeExperience();
    });
  });
  
  // Reader back button
  document.querySelector('#readerOverlay .back-btn').addEventListener('click', closeReader);
  
  // Experience back buttons
  document.querySelectorAll('#quizOverlay .back-btn, #elevatorGameOverlay .back-btn').forEach(btn => {
    btn.addEventListener('click', closeExperience);
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeReader();
      closeBottomSheet();
      closeExperience();
    }
  });
  
  // Logo button - reset to androne
  document.getElementById('logoBtn').addEventListener('click', () => {
    goToScene('scene-androne');
  });
  
  // Elevator button in topbar
  document.getElementById('btnLift').addEventListener('click', startElevatorRide);
  
  // Initialize quiz
  initQuiz();
  
  // Initialize elevator game
  initElevatorGame();
}

function goToScene(sceneId) {
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('is-active'));
  const targetScene = document.getElementById(sceneId);
  if (targetScene) {
    targetScene.classList.add('is-active');
    AppState.currentScene = sceneId;
    AppState.previousScene = null;
    AppState.sceneHistory = [];
    saveState();
  }
}
