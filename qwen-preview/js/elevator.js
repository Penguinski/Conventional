// ============ ELEVATOR.JS - Gestione ascensore ============

import { AppState, saveState } from './state.js';

const FLOORS = ['P', '1', '2', '3'];
let currentFloor = 0;
let isMoving = false;

export function startElevatorRide() {
  if (isMoving) return;
  
  const androneScene = document.getElementById('scene-androne');
  const cabinScene = document.getElementById('scene-cabin');
  const landingScene = document.getElementById('scene-landing1');
  
  // Start elevator sequence
  androneScene.classList.remove('is-active');
  cabinScene.classList.add('is-active');
  AppState.currentScene = 'scene-cabin';
  
  // Open doors animation
  const liftFrame = cabinScene.querySelector('.lift-frame');
  if (liftFrame) {
    liftFrame.parentElement.classList.add('open');
  }
  
  // Show floor display
  const display = document.getElementById('cabinFloorDisplay');
  display.textContent = '0';
  
  // After doors open, close them and start ride
  setTimeout(() => {
    liftFrame.parentElement.classList.remove('open');
    
    // Simulate elevator movement
    simulateElevatorRide(display);
  }, 1500);
}

function simulateElevatorRide(display) {
  isMoving = true;
  let floor = 0;
  
  const interval = setInterval(() => {
    floor++;
    display.textContent = floor;
    
    // Add vibration effect
    document.body.style.transform = `translate(${Math.random() * 2 - 1}px, ${Math.random() * 2 - 1}px)`;
    
    if (floor >= 1) {
      clearInterval(interval);
      document.body.style.transform = '';
      
      // Arrived at floor 1
      setTimeout(() => {
        openDoorsOnLanding();
        isMoving = false;
      }, 800);
    }
  }, 600);
}

function openDoorsOnLanding() {
  const cabinScene = document.getElementById('scene-cabin');
  const landingScene = document.getElementById('scene-landing1');
  
  // Open doors
  const liftFrame = cabinScene.querySelector('.lift-frame');
  if (liftFrame) {
    liftFrame.parentElement.classList.add('open');
  }
  
  // Transition to landing after doors open
  setTimeout(() => {
    cabinScene.classList.remove('is-active');
    landingScene.classList.add('is-active');
    AppState.currentScene = 'scene-landing1';
    AppState.elevatorPosition = 1;
    saveState();
    
    // Show "ASCENSORE" button in topbar for return
    const btnLift = document.getElementById('btnLift');
    btnLift.classList.add('show');
  }, 1200);
}

export function setupElevatorControls() {
  const liftButtons = document.querySelectorAll('.lift-btn');
  
  liftButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isMoving) return;
      
      const targetFloor = parseInt(btn.dataset.floor);
      const display = document.getElementById('cabinFloorDisplay');
      
      // Visual feedback
      btn.style.fill = '#d9694b';
      setTimeout(() => {
        btn.style.fill = '';
      }, 300);
      
      // If going to floor 1, trigger ride
      if (targetFloor === 1 && currentFloor === 0) {
        // Already handled by startElevatorRide
      }
    });
  });
}
