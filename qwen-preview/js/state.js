// ============ STATE.JS - Gestione stato applicazione ============

export const AppState = {
  currentScene: 'scene-androne',
  previousScene: null,
  sceneHistory: [],
  elevatorPosition: 0,
  elevatorMoving: false,
  liftDoorsOpen: false,
  currentApartment: null,
  apartmentZone: 0,
  
  // Content overlays state
  activeOverlay: null,
  readerState: {
    currentContent: null,
    scrollPosition: 0
  },
  
  // Quiz state
  quizState: {
    isActive: false,
    currentQuestion: 0,
    userVector: { social: 0, ordine: 0, regole: 0, rumore: 0, curiosita: 0, possesso: 0 },
    completed: false,
    result: null
  },
  
  // Elevator game state
  elevatorGameState: {
    isActive: false,
    currentScene: 0,
    choices: [],
    stats: {
      stress: 50,
      simpatia: 50,
      rispetto: 50
    }
  }
};

export function saveState() {
  try {
    localStorage.setItem('condominio-state', JSON.stringify({
      currentScene: AppState.currentScene,
      elevatorPosition: AppState.elevatorPosition,
      apartmentZone: AppState.apartmentZone
    }));
  } catch (e) {
    console.warn('Could not save state:', e);
  }
}

export function loadState() {
  try {
    const saved = localStorage.getItem('condominio-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(AppState, parsed);
      return true;
    }
  } catch (e) {
    console.warn('Could not load state:', e);
  }
  return false;
}

export function clearState() {
  try {
    localStorage.removeItem('condominio-state');
  } catch (e) {
    console.warn('Could not clear state:', e);
  }
}
